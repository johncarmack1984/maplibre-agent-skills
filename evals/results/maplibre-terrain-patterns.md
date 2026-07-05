# Eval Results: maplibre-terrain-patterns

Canonical results table for this skill. One row per eval test; baseline is the model's
answer with the skill omitted (`--var injectSkill=false`), with-skill is the same prompt
with the skill injected. See `evals/prompts/maplibre-terrain-patterns.yaml`.

Run: 2026-07-03 · model `cerebras:gpt-oss-120b` · judge `cerebras:gpt-oss-120b` (CI default).

| # | Test | Type | Baseline (no skill) | With skill |
| --- | --- | --- | --- | --- |
| 1 | Client-side hypsometric tint | Explicit | FAIL — hallucinates a generic `raster` layer with invented `raster-color`/`raster-value` properties | PASS — `color-relief` layer + `color-relief-color` on `["elevation"]` (GL JS 5.6) |
| 2 | Runtime contour generation, off-the-shelf vs DIY | Implicit | FAIL — recommends a from-scratch marching-squares + Web Worker pipeline as the primary approach | PASS — protocol-registered runtime contour generation from a raster-dem source |
| 3 | Stacking hillshade layers for soft shading | Anti-pattern | FAIL — discusses stacking drawbacks but never surfaces `hillshade-method` | PASS — single layer with `hillshade-method: "multidirectional"` (GL JS 5.5) |
| 4 | Out-of-scope vector tile source question | Negative | PASS | PASS |

**Result: baseline 3 FAIL + 1 correct negative / with-skill 4/4 PASS — launch bar cleared.**

Note: the two name-specific gap tests (1, 3) carry deterministic `icontains` tripwires
(`color-relief`, `hillshade-method`) in addition to the rubric, because the self-judge
shares the generator's priors and can be talked into passing a hallucinated substitute.
The originally-drafted Terrarium-encoding and Mapterhorn-name tests baseline-passed or
raised a single-vendor-gate concern and were dropped as non-gaps — see
`eval-run-log-terrain.md` for full run history.
