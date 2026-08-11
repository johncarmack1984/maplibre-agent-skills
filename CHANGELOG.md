# Changelog

Notable changes to this repo's skills and tooling. Loosely follows [Keep a Changelog](https://keepachangelog.com/), adapted for a skills repo — skills are additive markdown, so there's no real "breaking change" axis; entries are grouped by what changed, not by semver category.

## [Unreleased]

### Added

- `maplibre-cartography` skill
- `maplibre-terrain-patterns` skill

### Changed

- `maplibre-pmtiles-patterns`: added zoom-range guidance for `url:` vs. hand-wired `tiles:` sources

### Internal

- Judge-graded evals now run from a single `eval.yml`: a weekly cron on the default branch, plus a maintainer `workflow_dispatch` taking `ref`, `configs`, and `baseline`. They deliberately sit off the PR path, because GitHub withholds repo secrets from a `pull_request` triggered by a fork; `check.yml` remains the only fork-safe merge gate. Dispatching against a contributor ref checks out untrusted code in a job that holds secrets, so the install uses `--ignore-scripts` and the workflow definition always comes from the default branch.
- The generator pin lives in one place, `evals/prompts/lib/providers.yaml`, referenced by all five skill configs and `TEMPLATE.yaml`; `npm run lint:model-pins` fails on any provider id that drifts from it. This also standardized sampling across the suite: `max_tokens: 8192` (previously 8192 in `maplibre-cartography.yaml` and `maplibre-pmtiles-patterns.yaml`, and unset in `maplibre-terrain-patterns.yaml`, where the Promptfoo default truncated answers mid-code and graded as a content failure) and `temperature: 0` (previously unset everywhere). **Eval results recorded before this change were produced without `temperature: 0`.**
