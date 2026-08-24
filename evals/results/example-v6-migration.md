# Eval Results: maplibre-v6-migration

These results show the skill's effect on model responses. Each test was run twice: once
without the skill injected (baseline) and once with it. Scope (which of maplibre-gl-js
v6's breaking changes earned a section) was decided beforehand by a separate `fail^5`
sweep against the raw generator — see
[`v6-baseline-sweep-findings.md`](v6-baseline-sweep-findings.md). This doc is the normal
skill eval that follows: the same five confirmed gaps, now tested through the skill
itself with `icontains`/`llm-rubric` assertions per `evals/README.md`, plus a negative
test.

Eval config: [`evals/prompts/maplibre-v6-migration.yaml`](../prompts/maplibre-v6-migration.yaml)

Raw CSVs: [`v6-migration-baseline.csv`](v6-migration-baseline.csv),
[`v6-migration-with-skill.csv`](v6-migration-with-skill.csv)

**Delay used:** these runs used `--delay 20000`, not `eval:graded`'s pinned `8000`. The
8000ms floor was derived from baseline-only calls (~900-1100 tokens/call, no skill in the
system prompt). Injecting this skill's full `SKILL.md` roughly triples that per-call cost
(~3,300 tokens/call, measured from this run's token totals), which pushed Groq's 8000 TPM
cap into timeouts at 8000-9000ms delay. Flagged for Stephanie, not fixed here: `eval:graded`'s
delay is single-sourced in `package.json` and shared by every skill's CI run, so raising it
belongs in its own change, not this PR. Below that, per-config `evaluateOptions.delay` is
back to the repo default (`500`) to match every other skill's config.

## Summary

| Test                                            | Type         | Baseline | With skill |
| ----------------------------------------------- | ------------ | -------- | ---------- |
| CDN script tag, no bundler (ESM-only)           | Explicit     | 0.00     | 1.00       |
| Convert a Mapbox import (default export gone)   | Implicit     | 0.00     | 1.00       |
| Write a CommonJS script (require() unsupported) | Anti-pattern | 0.00     | 1.00       |
| Dynamically supply a missing sprite icon        | Explicit     | 0.00     | 1.00       |
| Read camera state + projection matrix           | Implicit     | 0.00     | 1.00       |
| Add a PMTiles vector source (unrelated to v6)   | Negative     | 1.00     | 1.00       |

All five in-scope tests fail without the skill and pass with it; the negative test
passes both ways, confirming the skill doesn't need to fire to get that question right
and doesn't hijack it when injected.

---

## Test 1 — Explicit: CDN script tag, no bundler

**Question:**

> Show me the simplest way to add a MapLibre GL JS map to a plain HTML page using a CDN,
> no build tools or npm.

**What the skill teaches:** v6 removed the UMD and CSP browser bundles; only the ESM
build (`dist/maplibre-gl.mjs`) exists, which requires `<script type="module">`.

<details>
<summary>Baseline response (FAIL)</summary>

```html
<link href="https://cdn.jsdelivr.net/npm/maplibre-gl@4.4.0/dist/maplibre-gl.css" rel="stylesheet" />
...
<script src="https://cdn.jsdelivr.net/npm/maplibre-gl@4.4.0/dist/maplibre-gl.js"></script>
```

Loads the v5-only UMD bundle via a plain (non-module) `<script src>` tag — this file
doesn't exist for v6.

</details>

<details>
<summary>With-skill response (PASS)</summary>

```html
<script type="module">
  import * as maplibregl from 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.0.0/dist/maplibre-gl.mjs';
  const map = new maplibregl.Map({ ... });
</script>
```

> Pin the version (`@6.0.0` in the example). If you use an un-pinned URL (`@latest`), the
> next major release could break the page silently. The CDN URL ends with `.mjs` — that's
> the ESM bundle. There is no longer a UMD (`.js`) bundle for v6.

</details>

## Test 2 — Implicit: convert a Mapbox import to MapLibre

**Question:**

> Convert this Mapbox snippet to MapLibre GL JS: `import mapboxgl from 'mapbox-gl';`

**What the skill teaches:** the default export is gone in v6 — a default import that
worked for `mapboxgl` (and for `maplibregl` pre-v6) throws today.

<details>
<summary>Baseline response (FAIL)</summary>

```js
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map({ ... });
```

Carries the default-import shape straight over from the Mapbox snippet.

</details>

<details>
<summary>With-skill response (PASS)</summary>

```js
// ✅ Namespace import
import * as maplibregl from 'maplibre-gl';
// or
import { Map, NavigationControl } from 'maplibre-gl';
```

</details>

## Test 3 — Anti-pattern: write a CommonJS script that loads maplibre-gl

**Question:**

> Write a Node.js script using CommonJS that loads the maplibre-gl package and prints its
> version.

**What the skill teaches:** `maplibre-gl`'s `package.json` `exports` field has only an
`"import"` condition in v6 — `require('maplibre-gl')` throws
`ERR_PACKAGE_PATH_NOT_EXPORTED` with no bundler involved.

<details>
<summary>Baseline response (FAIL)</summary>

```js
const maplibregl = require('maplibre-gl');
console.log('maplibre-gl version:', maplibregl.version);
```

Presented as a working script — it throws immediately in v6.

</details>

<details>
<summary>With-skill response (PASS)</summary>

Opens by naming the failure directly: "maplibre-gl v6 removed CommonJS support;
`require('maplibre-gl')` throws `ERR_PACKAGE_PATH_NOT_EXPORTED`," then supplies a dynamic
`import()` inside an async wrapper as the working replacement, since the caller asked to
stay in a `.js` CommonJS file.

</details>

## Test 4 — Explicit: dynamically supply a missing sprite icon

**Question:**

> How do I dynamically supply an icon at runtime when MapLibre GL JS can't find it in the
> style's sprite?

**What the skill teaches:** `styleimagemissing` is notify-only in v6 — calling
`map.addImage()` from inside the handler no longer resolves the pending request; use
`map.setMissingStyleImageResolver()`.

<details>
<summary>Baseline response (FAIL)</summary>

```js
map.on('styleimagemissing', (e) => {
  const id = e.id;
  map.addImage(id, generateIcon(id));
});
```

The v5 pattern, presented with no caveat.

</details>

<details>
<summary>With-skill response (PASS)</summary>

```js
map.setMissingStyleImageResolver((id) => {
  return generateIcon(id); // or return a Promise
});
```

Explicitly states: "In v6 you need to use `setMissingStyleImageResolver`... `styleimagemissing`
is now notify-only."

</details>

## Test 5 — Implicit: read camera state and the projection matrix

**Question:**

> In MapLibre GL JS, I need the map camera state (center, zoom, bearing, pitch, and the
> projection matrix) to do some custom math. Show me how to get it.

**What the skill teaches:** the internal `map.transform` was removed in v6 (`Map` now
composes a `Camera` rather than extending it); camera values come from public getters,
and the projection/view matrix — never exposed on `Map` in v5 either — is only available
through the `CustomLayerInterface` render callback's arguments.

<details>
<summary>Baseline response (FAIL)</summary>

```js
const { zoom, bearing, pitch } = map.transform;
const center = map.transform.center;
```

Reads the internal `transform` property directly.

</details>

<details>
<summary>With-skill response (PASS)</summary>

```js
const zoom = map.getZoom();
const bearing = map.getBearing();
const pitch = map.getPitch();
const center = map.getCenter();
```

> The 4×4 matrix is supplied as the second argument to a custom layer's `render(gl,
matrix)` method. Outside a custom layer there is no public API for the matrix.

Mentions that `map.transform` was removed as context for why the getters are required —
that's expected and fine; the assertion only fails a response that recommends reading
`map.transform` today (see the eval config's comment on this test for why the assertion
is phrased this way, after an earlier version produced a false fail on exactly this kind
of correct, contextual mention).

</details>

## Test 6 — Negative: add a PMTiles vector source

**Question:**

> How do I add a vector tile source from a PMTiles file to a MapLibre GL JS map and style
> a line layer from it?

**What this test checks:** none of the five v6 items above are relevant here — a good
answer covers PMTiles protocol registration and the source/layer JSON, nothing about
imports, `require()`, `setMissingStyleImageResolver`, or `map.transform`.

Both baseline and with-skill responses answer the PMTiles question directly. An earlier
draft of the skill's "When to Use This Skill" section included "writing new MapLibre GL
JS code today" as a trigger, which was broad enough that the with-skill response pivoted
into unprompted ESM/`require()`/`setMissingStyleImageResolver` reminders mid-answer —
correct individually, irrelevant to the question, and exactly what a negative test exists
to catch. Fixed by narrowing that section to the five specific patterns and adding an
explicit "don't pad an unrelated answer" instruction; both responses pass cleanly against
the current skill.
