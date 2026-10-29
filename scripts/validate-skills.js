#!/usr/bin/env node
/**
 * Validates every skills/<name>/SKILL.md against the Agent Skills spec
 * (https://agentskills.io/specification) and this repo's own rules:
 *
 * - front matter holds only the spec's six top-level keys, so claude.ai
 *   uploads and the Skills API accept the file
 * - `name` is lowercase words joined by single hyphens, at most 64
 *   characters, and equal to the directory name
 * - `description` is non-empty and at most 1024 characters, and
 *   `compatibility`, when present, at most 500
 * - `metadata.status` is verified, provisional, or process
 * - the body ends with the footer every skill carries (CONTRIBUTING.md,
 *   "SKILL.md format"), an installed copy's only route back to this repo
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED_KEYS, STATUSES, statusOf } from './lib/frontmatter.js';
import { parseFrontmatter } from './lib/parse-frontmatter.js';

export const FOOTER =
  "---\n\n**This skill is a snapshot.** Where a primary source contradicts it — the References above, MapLibre's current documentation, or what MapLibre does when you run it — that source wins. Follow it, then [report the disagreement](https://github.com/maplibre/maplibre-agent-skills/issues/new?template=ai-failure-report.md), citing the source and your MapLibre version: editing your installed copy helps no one else and is overwritten on the next update.";

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Every problem with one SKILL.md, as messages; empty when it is valid. */
export function validateSkill(dirName, content) {
  let parsed;
  try {
    parsed = parseFrontmatter(content);
  } catch (error) {
    return [
      `YAML frontmatter does not parse: ${error.reason ?? error.message}`
    ];
  }
  if (!parsed) {
    return ['Missing YAML frontmatter (the file must open with a --- block)'];
  }

  const { data, body } = parsed;
  const errors = [];

  const extra = Object.keys(data).filter((key) => !ALLOWED_KEYS.includes(key));
  if (extra.length > 0) {
    errors.push(
      `Frontmatter keys outside the spec: ${extra.join(', ')}. Only ${ALLOWED_KEYS.join(', ')} are allowed; put anything else under metadata`
    );
  }

  const { name, description, metadata, compatibility } = data;
  if (typeof name !== 'string' || name === '') {
    errors.push('Missing required field: name');
  } else {
    if (!NAME.test(name) || name.length > 64) {
      errors.push(
        `name "${name}" must be at most 64 characters of lowercase letters and digits joined by single hyphens`
      );
    }
    if (name !== dirName) {
      errors.push(
        `Skill name mismatch: directory is "${dirName}" but YAML name is "${name}"`
      );
    }
  }

  if (typeof description !== 'string' || description.trim() === '') {
    errors.push('Missing required field: description');
  } else if (description.length > 1024) {
    errors.push(
      `description is ${description.length} characters; the spec allows 1024`
    );
  }

  if (
    metadata !== undefined &&
    (metadata === null ||
      typeof metadata !== 'object' ||
      Array.isArray(metadata))
  ) {
    errors.push('metadata must be a map of keys to values');
  } else if (!STATUSES.includes(statusOf(data))) {
    errors.push(
      `metadata.status must be one of ${STATUSES.join(', ')} (README.md, "What Status Means")`
    );
  }

  if (
    compatibility !== undefined &&
    (typeof compatibility !== 'string' || compatibility.length > 500)
  ) {
    errors.push('compatibility must be a string of at most 500 characters');
  }

  if (body.trim() === '') {
    errors.push('No content found after YAML frontmatter');
  } else if (!body.trimEnd().endsWith(FOOTER)) {
    errors.push(
      'Body does not end with the standard footer (CONTRIBUTING.md, "SKILL.md format")'
    );
  }

  return errors;
}

function main(skillsDir = 'skills') {
  let entries;
  try {
    entries = readdirSync(skillsDir, { withFileTypes: true });
  } catch (error) {
    console.error(`❌ Error reading skills directory: ${error.message}`);
    process.exit(1);
  }

  const skillDirs = entries.filter((entry) => entry.isDirectory());
  if (skillDirs.length === 0) {
    console.error('❌ No skill directories found in skills/');
    process.exit(1);
  }
  console.log(`Found ${skillDirs.length} skill directories\n`);

  let failed = false;
  for (const dir of skillDirs) {
    console.log(`Validating ${dir.name}...`);
    let errors;
    try {
      const content = readFileSync(
        join(skillsDir, dir.name, 'SKILL.md'),
        'utf8'
      );
      errors = validateSkill(dir.name, content);
    } catch (error) {
      errors = [
        error.code === 'ENOENT'
          ? 'Missing SKILL.md file'
          : `Error reading file: ${error.message}`
      ];
    }
    for (const error of errors) console.error(`  ❌ ${error}`);
    if (errors.length === 0) console.log('  ✅ Valid');
    else failed = true;
    console.log('');
  }

  if (failed) {
    console.error('❌ Skill validation failed');
    process.exit(1);
  }
  console.log('✅ All skills are valid');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
