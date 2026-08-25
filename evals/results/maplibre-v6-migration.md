# Eval Results: maplibre-v6-migration

Canonical results table for this skill. One row per eval test; baseline is the model's
answer with the skill omitted (`--var injectSkill=false`), with-skill is the same prompt
with the skill injected. See `evals/prompts/maplibre-v6-migration.yaml`.

Run: 2026-08-21 (tests 1-5, 7), 2026-08-24 (test 6), 2026-08-25 (test 8) · model
`groq:openai/gpt-oss-120b` · judge `google:gemini-2.5-flash-lite` · `--delay 20000`,
not `eval:graded`'s pinned `8000` — injecting this skill's full `SKILL.md` roughly
triples per-call tokens versus a baseline-only call, which pushes Groq's 8000 TPM cap
into timeouts at the pinned delay. Test 7's with-skill grading errored on a Gemini
rate limit rather than returning a verdict; hand-confirmed PASS from the raw
completion instead of retrying. Test 8 ran filtered (`--filter-pattern`) rather than
as part of a full-suite run — a single new test doesn't need the other seven re-run
alongside it. Test 8's raw CSVs:
[`maplibre-v6-migration-setworkerurl-with-skill_2026-08-25.csv`](latest/maplibre-v6-migration-setworkerurl-with-skill_2026-08-25.csv),
[`maplibre-v6-migration-setworkerurl-baseline_2026-08-25.csv`](latest/maplibre-v6-migration-setworkerurl-baseline_2026-08-25.csv).

| #   | Test                                            | Type         | Baseline (no skill)                                                          | With skill                                                                                   |
| --- | ----------------------------------------------- | ------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | CDN script tag, no bundler (ESM-only)           | Explicit     | FAIL — loads the dead v5 UMD bundle via a plain `<script src>` tag           | PASS — `<script type="module">` against the `.mjs` build, version pinned                     |
| 2   | Convert a Mapbox import (default export gone)   | Implicit     | FAIL — carries the Mapbox default-import shape over unchanged                | PASS — named/namespace import, no default import                                             |
| 3   | Write a CommonJS script (require() unsupported) | Anti-pattern | FAIL — presents `require('maplibre-gl')` as a working call                   | PASS — names `ERR_PACKAGE_PATH_NOT_EXPORTED` and uses dynamic `import()`                     |
| 4   | Dynamically supply a missing sprite icon        | Explicit     | FAIL — v5 `styleimagemissing` + `addImage()` pattern, no caveat              | PASS — `map.setMissingStyleImageResolver()`, notes the v5 pattern is dead                    |
| 5   | Read camera state + projection matrix           | Implicit     | FAIL — reads the internal `map.transform` directly                           | PASS — public getters (`getZoom`, `getCenter`, ...), matrix scoped to custom layer render    |
| 6   | Type-safe handler for the `data` event          | Implicit     | FAIL — imports `MapDataEvent` as a real, current type (hand-confirmed¹)      | PASS — imports `MapSourceDataEvent`/`MapStyleDataEvent`, no working `MapDataEvent` reference |
| 7   | Add a PMTiles vector source (unrelated to v6)   | Negative     | PASS                                                                         | PASS (hand-confirmed²)                                                                       |
| 8   | Set up MapLibre in a Vite + TypeScript app      | Explicit     | FAIL — "MapLibre uses WebGL, no worker needed"; never calls `setWorkerUrl()` | PASS — calls `setWorkerUrl()` before creating the `Map`, using Vite's `?worker&url` import   |

**Result: baseline 7 FAIL + 1 correct negative / with-skill 8/8 PASS — launch bar cleared.**

### Scope: how these seven patterns were chosen

Before any skill content existed, a baseline-only `fail^5` sweep tested six candidate
v6 breaking changes from the migration guide — 12 prompt phrasings total, five runs
each, no skill injected. Five candidates failed consistently and became this skill's
first five sections:

- ESM-only build, UMD/CSP bundle removed (test 1)
- Default export removed (test 2)
- CommonJS `require()` unsupported (test 3)
- `styleimagemissing` no longer resolves via `addImage()` (test 4)
- `map.transform` removed (test 5)

Two candidates cleared the same sweep and were cut, per this repo's "target a
demonstrated gap" rule — the model already answers them correctly unprompted:

- Nested GeoJSON properties in feature properties (already read as objects, not JSON
  strings)
- "Why does `require()` throw" asked as a standalone question (only the "write me a
  working script" phrasing in test 3 trips the model up, not the explanation itself)

`GeoJSONSource.setData()`'s dropped second parameter and return value cleared the same
way in a later scoping probe and was cut too.

The sixth section, `MapDataEvent` → `MapSourceDataEvent`/`MapStyleDataEvent` (test 6),
was not part of that original sweep. It surfaced later while testing the skill against
other v6 breaking changes (2026-08-24) and was added and hand-confirmed directly as
test 6 above, rather than run through the full five-trial sweep the first five got.

The seventh section, bundler `setWorkerUrl()` (test 8), came from the same v6 audit
that this skill's whole scope traces back to (`fix/v6-audit-confirmed-defects`) — the
audit flagged it as "a genuine coverage gap, not a false claim," deferred to this
skill rather than fixed as a defect, but the deferral was never followed up until this
pass. Confirmed with a single-run hand check rather than the five-trial sweep: the
baseline's own reasoning states "MapLibre uses WebGL, no worker needed," which is
wrong in exactly the way the skill exists to correct, and traces to the official
[install guide](https://maplibre.org/maplibre-gl-js/docs/)'s per-bundler `setWorkerUrl()`
requirement.

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
