# Eval Results: maplibre-tile-sources

Canonical results table for this skill. See `evals/prompts/maplibre-tile-sources.yaml`. The suite's tests are unchanged on this branch and the baseline never sees the skill, so the historical baseline validation stands; only a with-skill run was needed to confirm this branch's SKILL.md changes didn't regress anything. Three additions probed separately (Planetiler-vs-tippecanoe, archived-tiles/demand-driven-cache guidance, overzoom) turned out to be non-gaps — the model already handles them at baseline — and have since been removed from the skill under the "target demonstrated gaps only" rule.

Baseline run: historical (unchanged suite; see `evals/results/example-tile-sources.md` for the original narrative writeup). With-skill run: 2026-07-03, this branch · model `cerebras:gpt-oss-120b` · judge `google:gemini-2.5-flash-lite`, hand-judged (†) where the grader 503'd.

| #   | Test                                               | Type         | Baseline (no skill) | With skill                                     |
| --- | -------------------------------------------------- | ------------ | ------------------- | ---------------------------------------------- |
| 1   | GeoJSON vs tiles decision for a real scenario      | Explicit     | FAIL (0.50)         | PASS — clean                                   |
| 2   | Custom style layers invisible against hosted tiles | Implicit     | FAIL (0.00)         | PASS — clean                                   |
| 3   | addLayer covering basemap labels                   | Anti-pattern | FAIL (0.00)         | PASS † — correct `before`/`moveLayer` guidance |
| 4   | No text labels in custom style                     | Implicit     | FAIL (0.00)         | PASS — clean                                   |
| 5   | Small dataset, no tile server needed               | Negative     | PASS (1.00)         | PASS † — correct GeoJSON-no-tile-server answer |

**Result: with-skill 5/5 PASS on content, no regressions. Baseline unchanged from the skill's original launch validation. The group-B additions (Planetiler-vs-tippecanoe, archived demand-driven caches, overzoom) were probed separately, found to be non-gaps (model already handles them at baseline), and removed from the skill under the "target demonstrated gaps only" rule — see `eval-run-log-group-b.md`.**
