---
name: '✍️ Write a scaffolded skill (good first contribution)'
about: A skill where the maintainer has already written the tests. You write the content.
title: '[skill] maplibre-<name>'
labels: ['good-first-issue', 'help-wanted', 'skill']
---

The evals for this skill are **already written** (below). You don't need to write tests
or set up an API key — open a PR with the skill content, and a maintainer runs the evals
against your branch during weekly triage and posts the results.

## The failure this skill fixes

<!-- Maintainer fills: the mined evidence — issue/SO/Slack links, the wrong AI answer, why. -->

## What a correct answer must include (coverage rubric)

<!-- Maintainer fills: bullet checklist; this is the spec your content must satisfy. -->

- [ ] ...
- [ ] Does NOT suggest <known wrong pattern>

## Eval prompts (already in `evals/prompts/maplibre-<name>.yaml`)

<!-- Maintainer fills or links: the explicit / implicit / anti-pattern / negative prompts. -->

## Your job

1. Comment here to claim it.
2. Write `skills/maplibre-<name>/SKILL.md` so the rubric is satisfied (see CONTRIBUTING → SKILL.md format).
3. Open a PR. Deterministic checks (`npm run check`) run immediately; a maintainer triggers the eval run during weekly triage and posts the results. We'll iterate together if anything fails.
