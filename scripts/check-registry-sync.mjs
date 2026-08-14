#!/usr/bin/env node
// Verifies the invariant CLAUDE.md declares for migrate-prompt: the model registry
// table in skills/migrate-prompt/SKILL.md (the resolver's source of truth) must be
// an exact mirror of the model-guides/*.md frontmatter, and every token must be
// resolvable under the skill's whitespace-tokenized, case-insensitive matching.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillPath = join(root, 'skills', 'migrate-prompt', 'SKILL.md');
const guidesDir = join(root, 'skills', 'migrate-prompt', 'model-guides');

const errors = [];

// --- registry table between the BEGIN/END markers
const skill = readFileSync(skillPath, 'utf8');
const block = skill.match(/<!-- BEGIN model-registry[\s\S]*?<!-- END model-registry -->/);
if (!block) {
  console.error('FAIL: model-registry BEGIN/END markers not found in ' + skillPath);
  process.exit(1);
}
const registry = new Map();
for (const line of block[0].split('\n')) {
  const m = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*$/);
  if (!m || m[1] === 'id' || /^-+$/.test(m[1])) continue;
  const id = m[1];
  const aliases = m[2].split(',').map((s) => s.trim()).filter(Boolean);
  if (registry.has(id)) errors.push(`registry: duplicate row for "${id}"`);
  registry.set(id, aliases);
}
if (registry.size === 0) errors.push('registry: no rows parsed from the table');

// --- guide frontmatter
const guides = new Map();
for (const f of readdirSync(guidesDir).filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(join(guidesDir, f), 'utf8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    errors.push(`${f}: missing YAML frontmatter`);
    continue;
  }
  const get = (k) => (fm[1].match(new RegExp(`^${k}:\\s*(.+?)\\s*$`, 'm')) || [])[1];
  const id = get('model');
  if (!id) {
    errors.push(`${f}: missing "model:" in frontmatter`);
    continue;
  }
  if (f !== `${id}.md`) errors.push(`${f}: filename does not match model id "${id}"`);
  const aliases = (get('aliases') || '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  for (const key of ['vendor', 'family']) {
    if (!get(key)) errors.push(`${f}: missing "${key}:" in frontmatter`);
  }
  const lastVerified = get('last_verified');
  if (!lastVerified || !/^\d{4}-\d{2}-\d{2}$/.test(lastVerified))
    errors.push(`${f}: missing or malformed last_verified (expected YYYY-MM-DD)`);
  const status = get('status');
  if (!status) errors.push(`${f}: missing "status:" (expected current|legacy)`);
  else if (status !== 'current' && status !== 'legacy')
    errors.push(`${f}: invalid status "${status}" (expected current|legacy)`);
  const successor = get('successor');
  if (successor && status !== 'legacy') errors.push(`${f}: successor set but status is not legacy`);

  // Body schema: the six sections, in order, exactly as CLAUDE.md documents them.
  const EXPECTED_SECTIONS = [
    '## Reasoning / Thinking',
    '## Prompting-Stil',
    '## Stärken & Schwächen (prompt-relevant)',
    '## Output- & Format-Konventionen',
    '## Migrations-Hinweise',
    '## Quellen',
  ];
  const sections = (text.match(/^## .+$/gm) || []).map((s) => s.trim());
  if (sections.join('\n') !== EXPECTED_SECTIONS.join('\n'))
    errors.push(`${f}: section headings do not match the schema exactly, in order\n    got:      ${sections.join(' | ')}\n    expected: ${EXPECTED_SECTIONS.join(' | ')}`);

  const quellen = text.split(/^## Quellen\s*$/m)[1];
  if (!quellen || !/https?:\/\//.test(quellen)) {
    errors.push(`${f}: missing "## Quellen" section with at least one URL`);
  } else {
    for (const line of quellen.split('\n')) {
      if (/^-\s*https?:\/\//.test(line) && !line.includes(' — '))
        errors.push(`${f}: Quellen entry lacks a " — " note: ${line.trim().slice(0, 70)}`);
    }
  }

  // "(unbelegt)" is the uncertainty marker the skill keys on; near-misses silently disable it.
  const nearMiss = text.match(/\((unbeleg[a-zä]*|unbelastet)\)/g)?.filter((m) => m !== '(unbelegt)');
  if (nearMiss?.length) errors.push(`${f}: near-miss uncertainty marker(s) ${[...new Set(nearMiss)].join(', ')} — use "(unbelegt)" or unambiguous wording`);

  guides.set(id, { aliases, successor, status });
}

// --- exact two-way sync registry <-> guides
for (const id of registry.keys()) {
  if (!guides.has(id)) errors.push(`registry row "${id}" has no guide file`);
}
for (const [id, g] of guides) {
  if (!registry.has(id)) {
    errors.push(`guide "${id}" has no registry row`);
    continue;
  }
  const reg = new Set(registry.get(id));
  const own = new Set(g.aliases);
  for (const a of reg) if (!own.has(a)) errors.push(`${id}: registry alias "${a}" missing from guide frontmatter`);
  for (const a of own) if (!reg.has(a)) errors.push(`${id}: guide alias "${a}" missing from registry`);
  if (g.successor) {
    if (!guides.has(g.successor)) errors.push(`${id}: successor "${g.successor}" has no guide`);
    else if (guides.get(g.successor).status === 'legacy')
      errors.push(`${id}: successor "${g.successor}" is itself marked legacy`);
  }
}

// --- token invariants the resolver depends on
const claimedBy = new Map();
for (const [id, aliases] of registry) {
  if (/\s/.test(id)) errors.push(`registry id "${id}" contains whitespace (can never match)`);
  const row = new Set();
  for (const a of aliases) {
    if (/\s/.test(a)) errors.push(`${id}: alias "${a}" contains whitespace (can never match)`);
    const key = a.toLowerCase();
    if (key === id.toLowerCase()) errors.push(`${id}: alias "${a}" duplicates its own id`);
    if (row.has(key)) errors.push(`${id}: duplicate alias "${a}" within the row`);
    row.add(key);
  }
  for (const tok of [id.toLowerCase(), ...row]) {
    const owner = claimedBy.get(tok);
    if (owner && owner !== id) errors.push(`token "${tok}" is claimed by both "${owner}" and "${id}"`);
    claimedBy.set(tok, id);
  }
}

if (errors.length) {
  for (const e of errors) console.error('FAIL: ' + e);
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
const aliasCount = [...registry.values()].reduce((n, a) => n + a.length, 0);
console.log(`OK: ${registry.size} models, ${aliasCount} aliases — registry and guides are in sync.`);
