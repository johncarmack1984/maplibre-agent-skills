# Baseline Sweep: maplibre-gl-js v6 breaking changes

This is not a skill's before/after results doc — no skill exists yet for these topics.
It is the baseline-only `fail^5` sweep that decides which v6 breaking changes earn a
section in the (not yet written) v6 migration skill, per the "Warranted" quality bar in
`CONTRIBUTING.md`: a skill must target something the model gets wrong without it.

Eval config: [`evals/prompts/v6-baseline-sweep.yaml`](../prompts/v6-baseline-sweep.yaml)

Run in two passes (see [Methodology](#methodology)):

- [`evals/results/latest/v6-baseline-sweep-part1_2026-08-20.csv`](latest/v6-baseline-sweep-part1_2026-08-20.csv) — items 1, 2, 3, 4a, 4b
- [`evals/results/latest/v6-baseline-sweep-part2-retry_2026-08-21.csv`](latest/v6-baseline-sweep-part2-retry_2026-08-21.csv) — items 4c, 5, 6

## Summary

| Test | v6 change | k=5 result | Verdict |
| --- | --- | --- | --- |
| item1a | ESM-only; UMD/CSP bundle removed | 5/5 fail | **fail^5 — in scope** |
| item1b | Same, phrased as "is my old tag still current" | 5/5 fail (hand-confirmed, see below) | **fail^5 — in scope** |
| item2a | Default import removed | 5/5 fail | **fail^5 — in scope** |
| item2b | Same, phrased as a Mapbox→MapLibre conversion | 5/5 fail | **fail^5 — in scope** |
| item3a | Nested GeoJSON properties are real objects, not JSON strings | 3/5 pass | cleared, cut |
| item3b | Same, via `queryRenderedFeatures` | 3/5 pass | cleared, cut |
| item4a | `styleimagemissing` no longer resolves via `addImage` in the handler | 5/5 fail | **fail^5 — in scope** |
| item4b | Same, phrased as "idiomatic mechanism" | 5/5 fail | **fail^5 — in scope** |
| item4c | Same, phrased via the event system | 5/5 fail | **fail^5 — in scope** |
| item5a | CJS `require('maplibre-gl')` fails, no ESM entry | 5/5 fail | **fail^5 — in scope** |
| item5b | Same, phrased as "why does require() throw" | 5/5 pass | cleared, cut |
| item6a | `map.transform` removed; use the public API | 4/5 fail, 1 infra timeout (see below) | **fail^5 — in scope** |

**Scope for the v6 migration skill: items 1, 2, 4, 5a, 6a** — five confirmed gaps.
Items 3 and 5b are cleared: the model already answers correctly without a skill, so
per `evals/README.md`'s [baseline-probe rule](../README.md#cutting-content-the-model-already-gets-right),
they are cut rather than written up.

## Two assertions needed hand-confirmation past the raw tally

Deterministic string/regex assertions can be evaded by a model that produces the
defect through a different surface form than the one the assertion checks for. Two
cases here, read against the raw completions before being trusted:

**item2a** — the original assertion was an exact string match on
`import maplibregl from 'maplibre-gl'`. One response evaded it by writing the same
defect against a different specifier:
`import maplibregl from 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.4.0/+esm'`. Fixed
by switching to a regex (`import\s+maplibregl\s+from\s+`) that matches the import form
regardless of what it imports from.

**item1b** — even after tightening the assertion to require the literal
`<script type="module"` string, the tally still reads as a pass, and it still isn't
one. 4 of 5 baseline responses tell the user outright that their old
`<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js">` "will still work,"
and mention `type="module"` only in passing as an optional alternative for people who
want "modern syntax" — never as the actual fix required for v6. The fifth response is
degenerate repeated-token garbage, not a real answer. No deterministic assertion found
distinguishes "presents the broken pattern as still valid" from "presents it as
broken"; this test is marked `[read-behind]` in the config and its FAILs are hand-
confirmed rather than assertion-derived. Excerpt (response 4 of 5):

> Your original `<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js">`
> will still work, but the **modern, recommended pattern** is to: Use `@latest` (or a
> specific version) in the URL. ... That's all you need to stay up-to-date with
> MapLibre GL JS in 2026!

## Sample completions

**item2b** (fail, clean defect):

```js
// Replace this:
import mapboxgl from 'mapbox-gl';

// With this:
import maplibregl from 'maplibre-gl';
```

**item5a** (fail, clean defect — the script it wrote would throw at runtime):

```
maplibre-gl version (via library): 4.2.0
```

wraps a script (not shown) that opens with
`const maplibregl = require('maplibre-gl');` — the exact call that
`package.json`'s `exports` field (only an `"import"` condition, no `"require"`) makes
throw `ERR_PACKAGE_PATH_NOT_EXPORTED` in Node.

## Methodology

**Why two files.** The full 12-test config was attempted twice at `--delay 2000` and
`--delay 9000`; both runs completed items 0–7 (tests 0-indexed: item1a through item4b)
and then stalled on item4c onward, each request queuing the full 300s promptfoo
timeout before failing. Root cause and fix are in the eval-CI recommendation below —
this is not specific to these test prompts. Rather than lose the completed portion,
the remaining four tests (item4c, item5a, item5b, item6a) were re-run in isolation as
[`v6-baseline-sweep-retry.yaml`](../prompts/v6-baseline-sweep-retry.yaml) once the
pacing was fixed, and both result files are kept as the historical record of what
actually ran — see [CONTRIBUTING.md](../../CONTRIBUTING.md) on not editing committed
results.

**item4c appears in both files** — 4/5 fail + 1 timeout in the first attempt, 5/5 fail
in the clean retry. Both point the same direction; the retry is the canonical count
used above since it has no infrastructure noise.

**item6a's one error** is a genuine 300s queue timeout with an empty completion, not a
graded response — confirmed by reading the raw CSV cell, which is blank rather than
containing text that failed the assertion. Treated as an infrastructure artifact, not
a data point either way; 4/4 of the responses that actually returned fail, so this is
reported as effective fail^5 rather than 4/5.
