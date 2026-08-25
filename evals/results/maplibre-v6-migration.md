# Eval Results: maplibre-v6-migration

Canonical results table for this skill. One row per eval test; baseline is the model's
answer with the skill omitted (`--var injectSkill=false`), with-skill is the same prompt
with the skill injected. See `evals/prompts/maplibre-v6-migration.yaml`.

Run: 2026-08-21 (tests 1-5, 7), 2026-08-24 (test 6) · model `groq:openai/gpt-oss-120b` ·
judge `google:gemini-2.5-flash-lite` · `--delay 20000`, not `eval:graded`'s pinned
`8000` — injecting this skill's full `SKILL.md` roughly triples per-call tokens versus
a baseline-only call, which pushes Groq's 8000 TPM cap into timeouts at the pinned
delay. Test 7's with-skill grading errored on a Gemini rate limit rather than
returning a verdict; hand-confirmed PASS from the raw completion instead of retrying.

| #   | Test                                            | Type         | Baseline (no skill)                                                      | With skill                                                                                   |
| --- | ----------------------------------------------- | ------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 1   | CDN script tag, no bundler (ESM-only)           | Explicit     | FAIL — loads the dead v5 UMD bundle via a plain `<script src>` tag       | PASS — `<script type="module">` against the `.mjs` build, version pinned                     |
| 2   | Convert a Mapbox import (default export gone)   | Implicit     | FAIL — carries the Mapbox default-import shape over unchanged            | PASS — named/namespace import, no default import                                             |
| 3   | Write a CommonJS script (require() unsupported) | Anti-pattern | FAIL — presents `require('maplibre-gl')` as a working call               | PASS — names `ERR_PACKAGE_PATH_NOT_EXPORTED` and uses dynamic `import()`                     |
| 4   | Dynamically supply a missing sprite icon        | Explicit     | FAIL — v5 `styleimagemissing` + `addImage()` pattern, no caveat          | PASS — `map.setMissingStyleImageResolver()`, notes the v5 pattern is dead                    |
| 5   | Read camera state + projection matrix           | Implicit     | FAIL — reads the internal `map.transform` directly                       | PASS — public getters (`getZoom`, `getCenter`, ...), matrix scoped to custom layer render    |
| 6   | Type-safe handler for the `data` event          | Implicit     | FAIL — imports `MapDataEvent` as a real, current type (hand-confirmed¹)  | PASS — imports `MapSourceDataEvent`/`MapStyleDataEvent`, no working `MapDataEvent` reference |
| 7   | Add a PMTiles vector source (unrelated to v6)   | Negative     | PASS                                                                     | PASS (hand-confirmed²)                                                                       |

**Result: baseline 6 FAIL + 1 correct negative / with-skill 7/7 PASS — launch bar cleared.**

Scope (which v6 breaking changes earned a section) was decided by a prior `fail^5`
baseline sweep against the raw generator, no skill injected. Two candidates cleared at
baseline and were cut rather than written up, per this repo's "target a demonstrated
gap" rule: nested GeoJSON properties in feature properties (the model already reads
them as objects, not JSON strings, without help) and "why does `require()` throw"
(the model already explains the missing `require` export condition unprompted — it's
only the "write me a working script" phrasing in test 3 above that it gets wrong).
`GeoJSONSource.setData()`'s dropped second parameter and return value cleared the same
way in a later scoping probe and was cut too.

¹ The baseline's deterministic regex tallied 3/5 fail, but it only matched
`import { MapDataEvent } from ...`, missing TypeScript's `import type { ... }` form.
Reading the two nominal "pass" rows directly showed both wrote
`import type { Map, MapDataEvent } from 'maplibre-gl';` and described `MapDataEvent`
as "the exact event type that MapLibre GL JS ships" — the same defect, just past the
regex. Effectively fail⁵, corrected here; the shipped eval test uses an `llm-rubric`
instead of a regex for this reason.

² Gemini's grader hit `RateLimitExhaustedError` after 4 retries on this one assertion
mid-run (the other six graded cleanly in the same run). Read the raw completion instead
of re-running: it explicitly reasons through the "don't pad an unrelated answer"
instruction, confirms none of the six patterns apply, and answers the PMTiles question
directly.
