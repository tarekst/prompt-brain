#!/usr/bin/env node
// Verifies the facts a release depends on that are duplicated by hand across four
// files and can therefore drift silently: the version (plugin.json vs CHANGELOG.md),
// the plugin identity fields duplicated between plugin.json and the marketplace entry
// (CLAUDE.md: plugin.json is the single source of truth, so the marketplace entry must
// carry no `version` of its own), and the README's assertions about the repo -- the
// guide count it advertises and the relative links it points at.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pluginPath = join(root, '.claude-plugin', 'plugin.json');
const marketplacePath = join(root, '.claude-plugin', 'marketplace.json');
const changelogPath = join(root, 'CHANGELOG.md');
const readmePath = join(root, 'README.md');
const guidesDir = join(root, 'skills', 'migrate-prompt', 'model-guides');

const errors = [];

// https://semver.org — the official recommended regex, minus the named groups.
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`FAIL: cannot read ${label}: ${e.message}`);
    process.exit(1);
  }
}

const plugin = readJson(pluginPath, '.claude-plugin/plugin.json');
const marketplace = readJson(marketplacePath, '.claude-plugin/marketplace.json');
const changelog = readFileSync(changelogPath, 'utf8').replace(/\r\n/g, '\n');
const readme = readFileSync(readmePath, 'utf8').replace(/\r\n/g, '\n');

// --- version: plugin.json vs the newest CHANGELOG heading
const version = plugin.version;
if (!version) errors.push('plugin.json has no "version"');
else if (!SEMVER.test(version)) errors.push(`plugin.json version "${version}" is not valid semver`);

const headings = [...changelog.matchAll(/^##\s*\[([^\]]+)\]/gm)].map((m) => m[1].trim());
const newest = headings.find((h) => h.toLowerCase() !== 'unreleased');
if (!newest) errors.push('CHANGELOG.md has no "## [x.y.z]" release heading');
else {
  if (!SEMVER.test(newest)) errors.push(`newest CHANGELOG heading "[${newest}]" is not valid semver`);
  if (version && newest !== version)
    errors.push(`version mismatch: plugin.json is "${version}", newest CHANGELOG heading is "[${newest}]"`);
}

// --- the marketplace entry for this plugin
const entries = Array.isArray(marketplace.plugins) ? marketplace.plugins : [];
let entry = entries.find((p) => p && p.name === plugin.name);
if (!entry && entries.length === 1) entry = entries[0]; // single-entry catalog: report the name mismatch below
if (!entry) {
  errors.push(`marketplace.json has no entry for "${plugin.name}"`);
} else {
  if (entry.name !== plugin.name)
    errors.push(`name mismatch: plugin.json is "${plugin.name}", marketplace entry is "${entry.name}"`);
  if (Object.prototype.hasOwnProperty.call(entry, 'version'))
    errors.push(
      `marketplace entry carries "version": "${entry.version}" — plugin.json is the single source of truth and a stale duplicate would mask it`,
    );
  if (entry.description !== plugin.description)
    errors.push(
      'description differs between plugin.json and the marketplace entry\n' +
        `    plugin.json: ${JSON.stringify(plugin.description)}\n` +
        `    marketplace: ${JSON.stringify(entry.description)}`,
    );
  const a = JSON.stringify(plugin.keywords ?? null);
  const b = JSON.stringify(entry.keywords ?? null);
  if (a !== b)
    errors.push(
      'keywords differ between plugin.json and the marketplace entry\n' +
        `    plugin.json: ${a}\n    marketplace: ${b}`,
    );
}

// --- the guide count the README advertises
const guideCount = existsSync(guidesDir)
  ? readdirSync(guidesDir).filter((f) => f.endsWith('.md')).length
  : 0;
const claim = readme.match(/Supported\s+models\s*\(\s*(\d+)\s+guides?\s*\)/);
if (!claim) {
  errors.push(
    'README.md: could not find the "Supported models (N guides)" sentence — the guide-count assertion went missing, so nothing checks it any more',
  );
} else if (Number(claim[1]) !== guideCount) {
  errors.push(
    `README.md claims ${claim[1]} model guides, but skills/migrate-prompt/model-guides/ holds ${guideCount}`,
  );
}

// --- every relative markdown link in the README must resolve
let linkCount = 0;
for (const m of readme.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
  const target = m[1];
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) continue; // absolute URL, protocol-relative, or anchor
  linkCount++;
  const path = decodeURIComponent(target.split('#')[0].split('?')[0]);
  if (!path) continue;
  if (!existsSync(join(root, path))) errors.push(`README.md: relative link "${target}" does not resolve to an existing path`);
}

if (errors.length) {
  for (const e of errors) console.error('FAIL: ' + e);
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(
  `OK: v${version} — plugin.json, marketplace.json and CHANGELOG.md agree; README.md matches ${guideCount} guides and ${linkCount} relative link(s) resolve.`,
);
