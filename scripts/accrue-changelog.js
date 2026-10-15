#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setOutputs } from './lib/github-output.js';
import {
  parseChangelogField,
  BUMP_ORDER,
  VALID_CATEGORIES
} from './lib/changelog-field.js';

export function accrueEntry(
  changelog,
  { category, entry, bump, prNumber, prUrl }
) {
  const entryLine = `- ${entry} ([#${prNumber}](${prUrl}))`;

  if (changelog.includes(`[#${prNumber}](${prUrl})`)) {
    return { changelog, changed: false };
  }

  const headingMatch = changelog.match(/^## \[Unreleased\].*$/m);
  if (!headingMatch) {
    throw new Error('No "## [Unreleased]" heading found in CHANGELOG.md');
  }

  const headingEnd = headingMatch.index + headingMatch[0].length;
  const preamble = changelog.substring(0, headingMatch.index);
  const afterHeading = changelog.substring(headingEnd);

  const nextVersionMatch = afterHeading.match(/\n(?=## \[)/);
  let sectionContent, rest;
  if (nextVersionMatch) {
    sectionContent = afterHeading.substring(0, nextVersionMatch.index + 1);
    rest = afterHeading.substring(nextVersionMatch.index + 1);
  } else {
    sectionContent = afterHeading;
    rest = '';
  }

  const markerRegex = /\n<!-- bump:\s*(\w+)\s*-->/;
  const existingMarker = sectionContent.match(markerRegex);
  let effectiveBump = bump;
  if (existingMarker) {
    if ((BUMP_ORDER[existingMarker[1]] || 0) >= (BUMP_ORDER[bump] || 0)) {
      effectiveBump = existingMarker[1];
    }
    sectionContent = sectionContent.replace(markerRegex, '');
  }

  const catRegex = new RegExp(`^### ${category}$`, 'm');

  if (catRegex.test(sectionContent)) {
    sectionContent = sectionContent.replace(
      new RegExp(`(### ${category}\\n)\\n*`),
      `$1\n${entryLine}\n`
    );
  } else {
    let inserted = false;
    const catIdx = VALID_CATEGORIES.indexOf(category);
    for (let i = catIdx + 1; i < VALID_CATEGORIES.length; i++) {
      const nextCatRegex = new RegExp(`^### ${VALID_CATEGORIES[i]}$`, 'm');
      const match = sectionContent.match(nextCatRegex);
      if (match) {
        sectionContent =
          sectionContent.substring(0, match.index) +
          `### ${category}\n\n${entryLine}\n\n` +
          sectionContent.substring(match.index);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      sectionContent =
        sectionContent.trimEnd() + '\n\n' + `### ${category}\n\n${entryLine}\n`;
    }
  }

  const result = `${preamble}## [Unreleased]\n<!-- bump: ${effectiveBump} -->${sectionContent}${rest}`;
  return { changelog: result, changed: true, effectiveBump };
}

/**
 * Records each PR's Changelog field in turn, oldest first. A PR with no usable
 * field, or with `Bump: none`, is skipped. A missing field is a `::warning::`
 * only on the PR that triggered the run: the PR-time check is the gate, and the
 * same PR would otherwise warn on every run for a week.
 */
export function accrueAll(changelog, pulls, log = console.log) {
  const recorded = [];
  let current = changelog;
  for (const pr of pulls) {
    const parsed = parseChangelogField(pr.body ?? '');
    if (parsed.errors.length > 0) {
      const line = `PR #${pr.number} has no usable Changelog field, so nothing was recorded under [Unreleased]: ${parsed.errors.join('; ')}`;
      log(pr.trigger ? `::warning::${line}` : line);
      continue;
    }
    if (parsed.bump === 'none') {
      log(`PR #${pr.number}: Bump is none — no CHANGELOG entry needed.`);
      continue;
    }
    const result = accrueEntry(current, {
      category: parsed.category,
      entry: parsed.entry,
      bump: parsed.bump,
      prNumber: pr.number,
      prUrl: pr.url
    });
    if (!result.changed) continue;
    current = result.changelog;
    recorded.push(pr.number);
    log(
      `Recorded #${pr.number} under ${parsed.category} (bump: ${result.effectiveBump})`
    );
  }
  return { changelog: current, recorded };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const prsFile = process.env.PRS_FILE;
  if (!prsFile) {
    console.error('Required env: PRS_FILE');
    process.exit(1);
  }

  const changelogPath = 'CHANGELOG.md';
  const { changelog, recorded } = accrueAll(
    readFileSync(changelogPath, 'utf8'),
    JSON.parse(readFileSync(prsFile, 'utf8'))
  );
  writeFileSync(changelogPath, changelog);
  setOutputs({ recorded: recorded.map((n) => `#${n}`).join(', ') });
}
