import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isAutomationCommit, unrecordedPulls } from './merged-pr.js';

describe('isAutomationCommit', () => {
  it('skips changelog and release commits', () => {
    assert.equal(isAutomationCommit('chore(changelog): record #12'), true);
    assert.equal(isAutomationCommit('chore(release): v0.2.0'), true);
  });
  it('keeps everything else', () => {
    assert.equal(
      isAutomationCommit('feat(skills): add fonts skill (#12)'),
      false
    );
    assert.equal(isAutomationCommit('chore(deps): bump prettier'), false);
  });
});

describe('unrecordedPulls', () => {
  const url = (n) =>
    `https://github.com/maplibre/maplibre-agent-skills/pull/${n}`;
  const pull = (number, merged_at, extra = {}) => ({
    number,
    html_url: url(number),
    merged_at,
    merge_commit_sha: `sha${number}`,
    body: `body ${number}`,
    ...extra
  });
  const since = '2026-10-08T19:00:00Z';

  it('returns the merged PRs the changelog lacks, oldest first', () => {
    const changelog = `- recorded ([#118](${url(118)}))`;
    const pulls = [
      pull(120, '2026-10-15T19:32:37Z'),
      pull(118, '2026-10-15T19:32:17Z'),
      pull(110, '2026-10-15T19:32:21Z'),
      pull(117, null),
      pull(90, '2026-09-30T00:00:00Z')
    ];
    assert.deepEqual(
      unrecordedPulls(pulls, changelog, { since, sha: 'sha120' }),
      [
        { number: 110, url: url(110), body: 'body 110', trigger: false },
        { number: 120, url: url(120), body: 'body 120', trigger: true }
      ]
    );
  });

  it('reads a missing body as empty', () => {
    const [found] = unrecordedPulls(
      [pull(5, '2026-10-15T00:00:00Z', { body: null })],
      '',
      { since, sha: 'x' }
    );
    assert.equal(found.body, '');
  });
});
