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

// --- dates. A shape check alone accepts dates the calendar cannot represent (2026-02-31) and
// year typos (2026 -> 2062); the round-trip through Date rejects the former, and the
// future-dated check on last_verified below rejects the latter. Both matter because a guide
// whose age comes out negative silently drops out of the staleness report and out of
// --strict-age -- the exact guide the report exists to surface.
const isCalendarDate = (s) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10))).toISOString().slice(0, 10) === s;
const utcDay = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const todayEnv = process.env.PROMPT_BRAIN_TODAY;
if (todayEnv && !isCalendarDate(todayEnv)) {
  console.error(`FAIL: PROMPT_BRAIN_TODAY="${todayEnv}" is not a real YYYY-MM-DD calendar date`);
  process.exit(1);
}
const now = new Date();
const today = todayEnv ? utcDay(todayEnv) : Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
const todayIso = new Date(today).toISOString().slice(0, 10);

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
  // Frontmatter accessors. Both are deliberately line-local: `\s*` around the value would
  // match across newlines, so a key with an empty value would silently capture the next line.
  const fmLines = fm[1].split('\n').map((l) => l.replace(/\r$/, ''));
  const keyLine = (k) => fmLines.findIndex((l) => l.startsWith(`${k}:`));
  const unquote = (s) => s.trim().replace(/^["']|["']$/g, '').trim();
  const get = (k) => {
    const i = keyLine(k);
    if (i === -1) return undefined;
    const v = fmLines[i].slice(k.length + 1).trim();
    return v === '' ? undefined : v;
  };
  // A list key may be written inline (`aliases: [a, b]`) or as a YAML block list (`aliases:`
  // followed by `- a` lines). Both are valid YAML and equally readable to the skill, which is
  // the guide's actual runtime consumer, so accept either form.
  const getList = (k) => {
    const i = keyLine(k);
    if (i === -1) return [];
    const inline = fmLines[i].slice(k.length + 1).trim();
    if (inline !== '')
      return inline.replace(/^\[|\]$/g, '').split(',').map(unquote).filter(Boolean);
    const items = [];
    for (let j = i + 1; j < fmLines.length; j++) {
      const item = fmLines[j].match(/^[ \t]*-[ \t]+(.*)$/);
      if (!item) break;
      const v = unquote(item[1]);
      if (v) items.push(v);
    }
    return items;
  };
  const id = get('model');
  if (!id) {
    errors.push(`${f}: missing "model:" in frontmatter`);
    continue;
  }
  if (f !== `${id}.md`) errors.push(`${f}: filename does not match model id "${id}"`);
  const aliases = getList('aliases');
  const family = get('family');
  for (const key of ['vendor', 'family']) {
    if (!get(key)) errors.push(`${f}: missing "${key}:" in frontmatter`);
  }
  const lastVerified = get('last_verified');
  if (!lastVerified || !isCalendarDate(lastVerified))
    errors.push(`${f}: missing or malformed last_verified (expected a real YYYY-MM-DD calendar date)`);
  else if (utcDay(lastVerified) > today)
    errors.push(`${f}: last_verified ${lastVerified} is in the future (today is ${todayIso}) — a guide cannot have been verified in the future; a future date also hides the guide from the age report and from --strict-age`);
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

  guides.set(id, { aliases, family, successor, status, lastVerified });
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

// --- bare family aliases must sit on the guide they name, and on its current generation
// SKILL.md's alias policy: a bare family alias (`opus`, `sonnet`, `mistral-large`) always
// resolves to the newest guide of that family. "Bare" is read conservatively here: the alias
// carries no version/generation token at all (no digits) AND is the guide's own id stripped of
// its version tokens, or a trailing run of it -- `opus` for claude-opus-5, `mistral-large` for
// mistral-large-3. A family-level `…-latest` that names no generation (`mistral-large-latest`)
// is a rolling pointer, so it is governed by the same rule; a `…-latest` that names a specific
// generation (`grok-4-latest`, `grok-4.3-latest`) carries digits, so the digit test below
// rejects it and it stays version-pinned. Aliases that name a variant the id does not (`deepseek-chat`
// on deepseek-v3) are pinned vendor strings, not family shorthands, and are left alone.
// `status` is the ordering signal, not version numbers in ids: it is what the corpus maintains.
const tokensOf = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const stemOf = (id) => tokensOf(id).filter((t) => !/\d/.test(t));
const trails = (a, stem) => a.length <= stem.length && a.every((t, i) => t === stem[stem.length - a.length + i]);
const isBareFamilyAlias = (alias, id) => {
  const a = tokensOf(alias);
  if (!a.length || a.some((t) => /\d/.test(t))) return false;
  const stem = stemOf(id);
  return trails(a, stem) || trails(a, [...stem, 'latest']);
};

// A bare alias must sit on a guide whose own stem it names. `family:` is a vendor-wide bucket
// (Claude covers opus, sonnet, haiku AND fable; GPT covers gpt-5, sol, terra), so the
// legacy-placement check below cannot tell an alias's rightful owner from its bucket-mates:
// on its own it would accept `opus` parked on claude-haiku-4-5, and `opus <target>` would then
// silently load the Haiku guide. Inverting the predicate over every guide closes that.
const stemOwners = (alias) => [...guides.keys()].filter((cand) => isBareFamilyAlias(alias, cand));
for (const [id, g] of guides) {
  for (const alias of g.aliases) {
    const owners = stemOwners(alias);
    if (!owners.length || owners.includes(id)) continue;
    const targets = owners.filter((o) => guides.get(o).status === 'current');
    errors.push(
      `${id}: bare family alias "${alias}" names another guide's stem, not its own\n` +
      `    "${alias}" is the family shorthand for ${owners.map((o) => `${o}.md`).join(', ')}, so on ${id}.md it silently\n` +
      `    resolves "${alias}" to the wrong model\n` +
      `    fix: delete "${alias}" from ${id}.md aliases AND its registry row, then add it to ` +
      (targets.length
        ? `${targets.map((t) => `${t}.md`).join(' or ')} and that guide's registry row`
        : `whichever of those guides is status: current (none is today) and that guide's registry row`)
    );
  }
}
const families = new Map();
for (const [id, g] of guides) {
  if (!g.family) continue;
  if (!families.has(g.family)) families.set(g.family, []);
  families.get(g.family).push(id);
}
for (const [family, ids] of families) {
  const current = ids.filter((i) => guides.get(i).status === 'current');
  const legacy = ids.filter((i) => guides.get(i).status === 'legacy');
  if (!current.length || !legacy.length) continue;
  for (const id of legacy) {
    const g = guides.get(id);
    for (const alias of g.aliases) {
      if (!isBareFamilyAlias(alias, id)) continue;
      // Fall back to the alias's own stem kin, never to every current guide in the vendor
      // bucket: offering "claude-haiku-4-5.md or claude-opus-5.md" for `opus` would walk the
      // maintainer straight into the mis-placement the check above exists to catch.
      const kin = stemOwners(alias).filter((o) => current.includes(o));
      const targets = g.successor && current.includes(g.successor) ? [g.successor] : kin;
      errors.push(
        `${id}: bare family alias "${alias}" sits on a status: legacy guide (family ${family})\n` +
        `    fix: delete "${alias}" from ${id}.md aliases AND its registry row, then add it to ` +
        (targets.length
          ? `${targets.map((t) => `${t}.md`).join(' or ')} and that guide's registry row`
          : `the current guide of that same stem and its registry row (none is status: current today)`) + `\n` +
        `    (if the old generation still needs a name, leave a version-pinned alias on ${id})`
      );
    }
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

// --- guide-age report: advisory by default, a gate under --strict-age.
// The skill warns users once a guide passes six months; this gives the maintainer a head start.
const AGE_WARN_DAYS = 150;
const AGE_STALE_DAYS = 180;
// Dates, `today` included, are resolved and validated at the top of the file: every
// last_verified here is a real calendar date at or before today, so no age can be negative.
const strictAge = process.argv.slice(2).includes('--strict-age');
const ages = [...guides]
  .map(([id, g]) => ({ id, lastVerified: g.lastVerified, age: Math.floor((today - utcDay(g.lastVerified)) / 86400000) }))
  .sort((a, b) => b.age - a.age);
const aging = ages.filter((a) => a.age > AGE_WARN_DAYS);
const crossingSoon = aging.filter((a) => a.age < AGE_STALE_DAYS).length;
for (const a of aging) {
  const past = a.age >= AGE_STALE_DAYS ? ` — already past the ${AGE_STALE_DAYS}-day line the skill warns users at` : '';
  console.error(
    `${strictAge ? 'FAIL' : 'WARN'}: ${a.id}: last_verified ${a.lastVerified} is ${a.age} days old${past}; re-verify against the vendor docs and bump last_verified`
  );
}
const oldest = ages[0];
console.log(
  `AGE: ${ages.length} guides, oldest ${oldest.age} days (${oldest.id}, ${oldest.lastVerified}); ` +
  `${aging.length} over ${AGE_WARN_DAYS} days; ${crossingSoon} will cross ${AGE_STALE_DAYS} days within 30 days.`
);
if (strictAge && aging.length) {
  console.error(`\n${aging.length} guide(s) past the ${AGE_WARN_DAYS}-day age line (--strict-age).`);
  process.exit(1);
}

const aliasCount = [...registry.values()].reduce((n, a) => n + a.length, 0);
console.log(`OK: ${registry.size} models, ${aliasCount} aliases — registry and guides are in sync.`);
