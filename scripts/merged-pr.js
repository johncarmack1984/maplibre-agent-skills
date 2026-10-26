#!/usr/bin/env node
// Merge-time lookup for changelog.yml: which recently merged PRs CHANGELOG.md
// still lacks.
//
// Every PR the file is missing is looked up, not only the one behind the push
// that started this run. GitHub keeps one pending run per concurrency group and
// cancels the rest, so when several PRs merge within a minute only the first
// and last runs survive; the one that does now records what the others would
// have.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setOutputs } from './lib/github-output.js';

const AUTOMATION_PREFIXES = ['chore(changelog):', 'chore(release):'];

// How far back a run looks. A merge whose run never recorded it is caught by
// any later run inside this window.
export const LOOKBACK_DAYS = 7;

export function isAutomationCommit(subject) {
  return AUTOMATION_PREFIXES.some((p) => subject.startsWith(p));
}

/**
 * The merged PRs CHANGELOG.md has no entry for, merged at or after `since`,
 * oldest first so each new entry lands above the one before it. The PR whose
 * merge commit started this run is marked `trigger`, so only its missing
 * Changelog field is worth a warning.
 */
export function unrecordedPulls(pulls, changelog, { since, sha }) {
  return pulls
    .filter((p) => p.merged_at && p.merged_at >= since)
    .filter((p) => !changelog.includes(`[#${p.number}](${p.html_url})`))
    .sort((a, b) => a.merged_at.localeCompare(b.merged_at))
    .map((p) => ({
      number: p.number,
      url: p.html_url,
      body: p.body ?? '',
      trigger: p.merge_commit_sha === sha
    }));
}

export async function fetchRecentlyClosedPulls({ repo, token }) {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/pulls?state=closed&base=main&sort=updated&direction=desc&per_page=50`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  );
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} listing closed PRs`);
  }
  return res.json();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const {
    GITHUB_REPOSITORY: repo,
    GITHUB_SHA: sha,
    GH_TOKEN: token,
    HEAD_COMMIT_MESSAGE: message = '',
    PRS_FILE
  } = process.env;
  if (!repo || !sha || !token || !PRS_FILE) {
    console.error(
      'Required env: GITHUB_REPOSITORY, GITHUB_SHA, GH_TOKEN, PRS_FILE'
    );
    process.exit(1);
  }

  // From the push event rather than git: the checkout is the branch tip, which
  // may already be past the commit that started this run.
  const subject = message.split('\n')[0];
  if (isAutomationCommit(subject)) {
    console.log(`Automation commit ("${subject}") — skipping.`);
    setOutputs({ found: 'false' });
    process.exit(0);
  }

  const since = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const pulls = unrecordedPulls(
    await fetchRecentlyClosedPulls({ repo, token }),
    readFileSync('CHANGELOG.md', 'utf8'),
    { since, sha }
  );
  if (pulls.length === 0) {
    console.log('Every PR merged in the last week is already recorded.');
    setOutputs({ found: 'false' });
    process.exit(0);
  }

  writeFileSync(PRS_FILE, JSON.stringify(pulls));
  setOutputs({ found: 'true' });
  console.log(
    `Not yet recorded: ${pulls.map((p) => `#${p.number}`).join(', ')}`
  );
}
