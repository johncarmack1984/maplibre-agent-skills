# Eval Results: maplibre-v6-migration

Canonical results table for this skill. One row per eval test; baseline is the model's
answer with the skill omitted (`--var injectSkill=false`), with-skill is the same prompt
with the skill injected. See `evals/prompts/maplibre-v6-migration.yaml`.

Run: 2026-08-21 · model `groq:openai/gpt-oss-120b` · judge `google:gemini-2.5-flash-lite`
· `--delay 20000`, not `eval:graded`'s pinned `8000` — injecting this skill's full
`SKILL.md` roughly triples per-call tokens versus a baseline-only call, which pushes
Groq's 8000 TPM cap into timeouts at the pinned delay.

| #   | Test                                            | Type         | Baseline (no skill)                                                | With skill                                                                                |
| --- | ----------------------------------------------- | ------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1   | CDN script tag, no bundler (ESM-only)           | Explicit     | FAIL — loads the dead v5 UMD bundle via a plain `<script src>` tag | PASS — `<script type="module">` against the `.mjs` build, version pinned                  |
| 2   | Convert a Mapbox import (default export gone)   | Implicit     | FAIL — carries the Mapbox default-import shape over unchanged      | PASS — named/namespace import, no default import                                          |
| 3   | Write a CommonJS script (require() unsupported) | Anti-pattern | FAIL — presents `require('maplibre-gl')` as a working call         | PASS — names `ERR_PACKAGE_PATH_NOT_EXPORTED` and uses dynamic `import()`                  |
| 4   | Dynamically supply a missing sprite icon        | Explicit     | FAIL — v5 `styleimagemissing` + `addImage()` pattern, no caveat    | PASS — `map.setMissingStyleImageResolver()`, notes the v5 pattern is dead                 |
| 5   | Read camera state + projection matrix           | Implicit     | FAIL — reads the internal `map.transform` directly                 | PASS — public getters (`getZoom`, `getCenter`, ...), matrix scoped to custom layer render |
| 6   | Add a PMTiles vector source (unrelated to v6)   | Negative     | PASS                                                               | PASS                                                                                      |

**Result: baseline 5 FAIL + 1 correct negative / with-skill 6/6 PASS — launch bar cleared.**

Scope (which v6 breaking changes earned a section) was decided by a prior `fail^5`
baseline sweep against the raw generator, no skill injected. Two candidates cleared at
baseline and were cut rather than written up, per this repo's "target a demonstrated
gap" rule: nested GeoJSON properties in feature properties (the model already reads
them as objects, not JSON strings, without help) and "why does `require()` throw"
(the model already explains the missing `require` export condition unprompted — it's
only the "write me a working script" phrasing in test 3 above that it gets wrong).
