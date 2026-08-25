#!/usr/bin/env node
/**
 * Flips a skill's `status:` frontmatter to match the weekly drift check:
 * provisional -> verified on pass, verified -> provisional on fail.
 *
 * Reads one "skillName:pass" or "skillName:fail" line per skill from the file
 * passed as argv[2] (written by eval.yml's "Run evals" step). Skills with no
 * status field, or status: process, are left alone — this only manages the
 * provisional/verified pair, and only for skills that opted in.
 */
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const verdictsPath = process.argv[2];
if (!verdictsPath) {
  console.error('Usage: node scripts/sync-skill-status.js <verdicts-file>');
  process.exit(1);
}

const lines = readFileSync(verdictsPath, 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean);

const changes = [];

for (const line of lines) {
  const [skill, verdict] = line.split(':');
  const skillFile = `skills/${skill}/SKILL.md`;

  let content;
  try {
    content = readFileSync(skillFile, 'utf8');
  } catch {
    console.warn(`⚠️  ${skill}: no SKILL.md found, skipping`);
    continue;
  }

  const statusMatch = content.match(/^status:\s*(\S+)/m);
  if (!statusMatch) continue; // no status field — not opted into auto-sync
  const status = statusMatch[1];
  if (status === 'process') continue; // eval-exempt, never auto-flipped

  let next = null;
  if (status === 'provisional' && verdict === 'pass') next = 'verified';
  if (status === 'verified' && verdict === 'fail') next = 'provisional';
  if (!next) continue;

  writeFileSync(
    skillFile,
    content.replace(/^status:\s*\S+/m, `status: ${next}`)
  );
  console.log(`${skill}: ${status} -> ${next}`);
  changes.push(`${skill}: ${status} -> ${next}`);
}

console.log(
  changes.length > 0
    ? `\n${changes.length} skill(s) updated.`
    : '\nNo status changes.'
);

// Let the workflow step conditionally open a report issue on the changes.
if (process.env.GITHUB_OUTPUT) {
  const out = [`changed=${changes.length > 0}`];
  if (changes.length > 0) {
    out.push('summary<<SKILL_STATUS_EOF', ...changes, 'SKILL_STATUS_EOF');
  }
  appendFileSync(process.env.GITHUB_OUTPUT, out.join('\n') + '\n');
}
