#!/usr/bin/env node
// Validates every skills/*/SKILL.md frontmatter block on three axes that
// `claude plugin validate` does not cover: (1) every key is a real Claude Code
// frontmatter key -- a typo'd key is silently ignored at runtime, so it must fail
// here; (2) the frontmatter POLICY CLAUDE.md declares for this repo (pinned model,
// no effort, no allowed-tools, both skills in sync); (3) the Agent Skills open
// standard's constraints on the six portable fields.
// The YAML is parsed with deliberate line handling (top-level `key: value`, block
// scalars `|`/`>`, flow lists `[a, b]`) so the check stays dependency-free.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = join(root, 'skills');

const errors = [];
const notes = [];

// Every frontmatter key Claude Code recognises in a SKILL.md.
const KNOWN_KEYS = [
  'name',
  'description',
  'when_to_use',
  'argument-hint',
  'arguments',
  'disable-model-invocation',
  'user-invocable',
  'allowed-tools',
  'disallowed-tools',
  'model',
  'effort',
  'context',
  'agent',
  'background',
  'hooks',
  'paths',
  'shell',
  'metadata',
  'license',
  'compatibility',
];

// The Agent Skills open standard (agentskills.io/specification) defines exactly these
// six. Outside Claude Code -- a claude.ai upload, the Skills API -- any other key is a
// hard error rather than an ignored extra, which is what the NOTE below documents.
const SPEC_FIELDS = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];

const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;
const MAX_COMPATIBILITY = 500;
// A REPO BUDGET, not a documented runtime limit: keeping the combined
// description + when_to_use under this keeps the `/` menu entry skimmable.
// Advisory only (reported via NOTE) -- it must never fail the build.
const MAX_LISTING = 1536;
const BOM = 0xfeff;

// Keys this check reads as plain strings. A flow list or an indented block here
// would either coerce silently (String(['optimize-prompt']) === 'optimize-prompt',
// so a bogus `name: [optimize-prompt]` would pass clean) or throw on a string
// method, so the shape itself is rejected before any value check runs.
const SCALAR_ONLY = [
  'name',
  'description',
  'when_to_use',
  'compatibility',
  'model',
  'disable-model-invocation',
  'user-invocable',
];

function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

function stripQuotes(s) {
  return /^"[\s\S]*"$/.test(s) || /^'[\s\S]*'$/.test(s) ? s.slice(1, -1) : s;
}

// Minimal YAML: enough for the shapes a SKILL.md frontmatter actually uses.
function parseFrontmatter(text) {
  const body = text.charCodeAt(0) === BOM ? text.slice(1) : text;
  const lines = body.split(/\r?\n/);
  // A delimiter may carry trailing whitespace ("--- ") and is still a delimiter.
  const isDelimiter = (line) => line !== undefined && line.trimEnd() === '---';
  if (!isDelimiter(lines[0])) return null;
  const end = lines.findIndex((line, i) => i > 0 && isDelimiter(line));
  if (end === -1) return null;
  const fields = new Map();
  const order = [];
  const malformed = [];
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (line.trim() === '' || /^\s*#/.test(line)) continue;
    if (/^[ \t]/.test(line)) continue; // leftover indented line; block bodies are consumed below
    const km = line.match(/^([A-Za-z_][A-Za-z0-9_.-]*):[ \t]*(.*)$/);
    if (!km) {
      malformed.push(line);
      continue;
    }
    const key = km[1];
    const raw = km[2].trim();
    const indented = () => i + 1 < end && (lines[i + 1].trim() === '' || /^[ \t]/.test(lines[i + 1]));
    let kind = 'scalar';
    let value = raw;
    if (/^[|>][+-]?\d*$/.test(raw)) {
      kind = 'block';
      const block = [];
      while (indented()) block.push(lines[++i].replace(/^[ \t]+/, ''));
      value = block.join('\n').trim();
    } else if (raw.startsWith('[')) {
      kind = 'flow';
      value = raw
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((s) => stripQuotes(s.trim()))
        .filter(Boolean);
    } else if (raw === '') {
      kind = 'nested'; // key with an indented block beneath it (e.g. a metadata map)
      const block = [];
      while (indented()) block.push(lines[++i]);
      value = block.join('\n').trim();
    } else {
      value = stripQuotes(raw);
    }
    if (fields.has(key)) malformed.push(`duplicate key "${key}"`);
    else order.push(key);
    fields.set(key, { raw, value, kind, quoted: raw !== stripQuotes(raw) });
  }
  return { fields, order, malformed };
}

// --- collect the skills
const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(skillsDir, d.name, 'SKILL.md')))
  .map((d) => d.name)
  .sort();

if (skillDirs.length === 0) {
  console.error('FAIL: no skills/*/SKILL.md found under ' + skillsDir);
  process.exit(1);
}

// An unexpected throw must be reported against the file that caused it -- a bare stack
// trace tells the maintainer nothing, and it would skip every skill still unchecked.
function reportThrow(rel, err) {
  errors.push(`${rel}: internal check error — ${err && err.message ? err.message : String(err)}`);
}

const parsed = new Map();
for (const dir of skillDirs) {
  const rel = `skills/${dir}/SKILL.md`;
  try {
    const fm = parseFrontmatter(readFileSync(join(skillsDir, dir, 'SKILL.md'), 'utf8'));
    if (!fm) {
      errors.push(`${rel}: missing or malformed YAML frontmatter (expected a leading --- ... --- block)`);
      continue;
    }
    for (const bad of fm.malformed) errors.push(`${rel}: unparseable frontmatter line: ${bad}`);
    parsed.set(dir, { rel, ...fm });
  } catch (err) {
    reportThrow(rel, err);
  }
}

function checkSkill(dir, skill) {
  const { rel, fields, order } = skill;
  const has = (k) => fields.has(k);
  const val = (k) => (fields.get(k) || {}).value;

  // --- (0) value shape: a key read as a string must actually BE a string
  const badShape = new Set();
  for (const key of SCALAR_ONLY) {
    const f = fields.get(key);
    if (!f || f.kind === 'scalar' || f.kind === 'block') continue;
    badShape.add(key);
    const shape = f.kind === 'flow' ? `a flow sequence (${f.raw})` : 'an indented block';
    errors.push(`${rel}: "${key}" must be a plain string value, not ${shape}`);
  }

  // --- (1) unknown keys, with a "did you mean" when it is a near miss
  for (const key of order) {
    if (KNOWN_KEYS.includes(key)) continue;
    const near = KNOWN_KEYS.map((k) => [k, editDistance(key, k)])
      .filter(([, d]) => d <= 2)
      .sort((a, b) => a[1] - b[1])[0];
    errors.push(
      `${rel}: unknown frontmatter key "${key}"` +
        (near ? ` — did you mean "${near[0]}"?` : ' — not a Claude Code frontmatter key'),
    );
  }

  // --- (2) this repo's frontmatter policy, as declared in CLAUDE.md
  for (const [key, expected] of [
    ['disable-model-invocation', 'true'],
    ['user-invocable', 'true'],
  ]) {
    if (!has(key)) errors.push(`${rel}: policy requires "${key}: ${expected}" (key is missing)`);
    else if (!badShape.has(key) && String(val(key)) !== expected)
      errors.push(`${rel}: policy requires "${key}: ${expected}" (found "${val(key)}")`);
  }
  if (has('effort'))
    errors.push(`${rel}: policy forbids "effort" — the skills deliberately inherit the session effort level`);
  for (const key of ['allowed-tools', 'disallowed-tools']) {
    if (has(key))
      errors.push(
        `${rel}: policy forbids "${key}" — it pre-approves rather than restricts tools, so it documents nothing here`,
      );
  }
  if (!has('model')) errors.push(`${rel}: policy requires a pinned "model"`);
  if (!has('argument-hint')) errors.push(`${rel}: policy requires "argument-hint"`);
  else if (!fields.get('argument-hint').quoted)
    errors.push(
      `${rel}: "argument-hint" must be quoted in the YAML source so it parses as a string, not a flow sequence (found: ${fields.get('argument-hint').raw})`,
    );
  for (const key of ['license', 'compatibility']) {
    if (!has(key)) errors.push(`${rel}: policy requires "${key}"`);
  }

  // --- (3) Agent Skills spec constraints
  const name = val('name');
  if (badShape.has('name')) {
    // shape already reported; its value cannot be checked as a name
  } else if (!has('name') || !String(name).trim()) {
    errors.push(`${rel}: "name" is required`);
  } else {
    if (name.length > MAX_NAME) errors.push(`${rel}: name is ${name.length} chars (max ${MAX_NAME})`);
    if (!/^[a-z0-9-]+$/.test(name))
      errors.push(`${rel}: name "${name}" may contain only lowercase a-z, 0-9 and hyphens`);
    if (name.startsWith('-') || name.endsWith('-'))
      errors.push(`${rel}: name "${name}" must not start or end with a hyphen`);
    if (name.includes('--')) errors.push(`${rel}: name "${name}" must not contain consecutive hyphens`);
    if (name !== dir) errors.push(`${rel}: name "${name}" must equal the parent directory name "${dir}"`);
  }

  const readable = (k) => (has(k) && !badShape.has(k) ? String(val(k)) : '');

  const description = readable('description');
  if (badShape.has('description')) {
    // shape already reported
  } else if (!description.trim()) errors.push(`${rel}: "description" is required and must be non-empty`);
  else if (description.length > MAX_DESCRIPTION)
    errors.push(`${rel}: description is ${description.length} chars (max ${MAX_DESCRIPTION})`);

  const compatibility = readable('compatibility');
  if (compatibility.length > MAX_COMPATIBILITY)
    errors.push(`${rel}: compatibility is ${compatibility.length} chars (max ${MAX_COMPATIBILITY})`);

  // Advisory only: a repo budget for the `/` menu entry, not a documented runtime limit.
  const whenToUse = readable('when_to_use');
  const listing = description.length + whenToUse.length;
  if (listing > MAX_LISTING)
    notes.push(
      `${rel}\n` +
        `    combined description + when_to_use is ${listing} chars (repo budget ${MAX_LISTING}; keep the key use case first)`,
    );

  // --- informational portability note (a known limitation, not a defect)
  const usedSpec = SPEC_FIELDS.filter((k) => has(k));
  const ccOnly = order.filter((k) => KNOWN_KEYS.includes(k) && !SPEC_FIELDS.includes(k));
  notes.push(
    `${rel}\n` +
      `    Agent Skills spec fields used: ${usedSpec.length ? usedSpec.join(', ') : '(none)'}\n` +
      `    Claude-Code-only keys (a claude.ai upload or the Skills API hard-errors on these): ${ccOnly.length ? ccOnly.join(', ') : '(none)'}`,
  );
}

for (const [dir, skill] of parsed) {
  try {
    checkSkill(dir, skill);
  } catch (err) {
    reportThrow(skill.rel, err);
  }
}

// --- both skills must pin the SAME model
const models = new Map();
for (const [dir, skill] of parsed) {
  const m = (skill.fields.get('model') || {}).value;
  if (m) models.set(dir, m);
}
const distinct = new Set(models.values());
if (distinct.size > 1)
  errors.push(
    `model must be identical across all skills — found ${[...models].map(([d, m]) => `${d}=${m}`).join(', ')}`,
  );

for (const n of notes) console.log('NOTE: ' + n);

if (errors.length) {
  for (const e of errors) console.error('FAIL: ' + e);
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(
  `OK: ${parsed.size} skill(s) — frontmatter keys, repo policy${distinct.size === 1 ? ` (model ${[...distinct][0]})` : ''}, and Agent Skills spec constraints all pass.`,
);
