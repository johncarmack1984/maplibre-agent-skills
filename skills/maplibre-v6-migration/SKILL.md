---
name: maplibre-v6-migration
description: Upgrading a MapLibre GL JS app from v5 to v6 — the ESM-only build, the removed default export, CommonJS require() breakage, the styleimagemissing/setMissingStyleImageResolver change, the removal of the internal map.transform, the MapDataEvent → MapSourceDataEvent/MapStyleDataEvent split, and the bundler-only setWorkerUrl() requirement. Use when a v5 app breaks after upgrading to v6, or before pinning a v6 install.
---

# MapLibre GL JS v5 → v6 Migration

MapLibre GL JS v6 (released 2026-07-22) removed several things v5 code relied on: the UMD/CSP browser bundles, the default export, CommonJS support, the internal `map.transform`, and the `MapDataEvent` type. Training data for most models predates v6, so the natural-sounding answer to "how do I do X in MapLibre GL JS" is likely the v5 answer, whereas a new implementation using that answer on v6 will break.

**Primary reference:** [MapLibre GL JS v5→v6 migration guide](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/). This skill covers the same ground the guide does, or covers gaps a model tends to fill in with v5-era defaults regardless of what the guide says. Where the guide and this skill disagree, follow the guide and [report it](https://github.com/maplibre/maplibre-agent-skills/issues/new?template=ai-failure-report.md).

## When to Use This Skill

- Upgrading an existing MapLibre GL JS v5 app to v6
- A user reports a MapLibre map that "used to work" breaking after a dependency update
- Writing a `<script>` tag, an import statement, a `require()` call, a `styleimagemissing` handler, code that reads `map.transform`, a typed handler for the `data`/`dataloading`/`dataabort` events, or setting up MapLibre GL JS with a bundler (Vite, webpack, esbuild, Rspack, Rollup) — the seven specific patterns below
- Debugging errors like `ERR_PACKAGE_PATH_NOT_EXPORTED`, a blank map after a CDN update, a sprite icon that never appears, a TypeScript error naming `MapDataEvent`, or a map that never renders with a worker-loading error in the console

**Do not use this skill to pad an unrelated answer.** It covers seven narrow breaking changes, not general MapLibre v6 best practice. A question about sources, layers, styling, terrain, or anything else that doesn't touch one of the seven patterns below should get a normal, focused answer with no migration reminders attached.

## 1. CDN script tag: ESM-only now

v6 removed the UMD bundle and the separate CSP build. There is no `dist/maplibre-gl.js` to point a plain `<script src="...">` tag at anymore — only the ESM build, `dist/maplibre-gl.mjs`, which requires `type="module"`.

```html
<!-- ❌ v5 — dist/maplibre-gl.js no longer exists in v6 -->
<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>

<!-- ✅ v6 — ESM build, type="module" required -->
<script type="module">
  import maplibregl from 'https://unpkg.com/maplibre-gl@^6.0.0/dist/maplibre-gl.mjs';
  const map = new maplibregl.Map({ container: 'map', style: '...' });
</script>
```

**Always pin an explicit major** (`@^6.0.0`, or a specific version), never `@latest` or a bare unversioned specifier. An unpinned CDN URL means the next major release breaks the page silently the moment it publishes — this already happened at the v5→v6 boundary.

## 2. No default export — named or namespace import only

v5's `import maplibregl from 'maplibre-gl'` (a default import) no longer works in v6.

```js
// ❌ v5 — default export removed
import maplibregl from 'maplibre-gl';

// ✅ v6 — namespace import
import * as maplibregl from 'maplibre-gl';

// ✅ v6 — or import only what you use
import { Map, NavigationControl } from 'maplibre-gl';
```

This applies whether the code is being written fresh or converted from a Mapbox GL JS snippet (`import mapboxgl from 'mapbox-gl'`) — do not carry the default-import shape over.

## 3. No CommonJS — `require('maplibre-gl')` throws

`maplibre-gl`'s `package.json` `exports` field has only an `"import"` condition in v6, no `"require"` condition. `require('maplibre-gl')` throws `ERR_PACKAGE_PATH_NOT_EXPORTED` in Node, with no bundler involved — this is not a bug in the caller's setup.

```js
// ❌ throws ERR_PACKAGE_PATH_NOT_EXPORTED in v6
const maplibregl = require('maplibre-gl');

// ✅ convert the file to ESM (named/namespace import — see item 2)
import { Map } from 'maplibre-gl';

// ✅ or, if the caller must stay CommonJS, load it dynamically
const { Map } = await import('maplibre-gl');
```

If you hit this while a bundler _is_ involved (webpack, Vite, etc.), the fix is different — check the bundler's own ESM-interop config first; this section is specifically about a bare Node `require()` call.

## 4. `styleimagemissing` no longer resolves the request — use `setMissingStyleImageResolver`

In v5, listening for `styleimagemissing` and calling `map.addImage()` synchronously from inside the handler would supply the missing icon. In v6, `styleimagemissing` is **notify-only** — calling `addImage` from the handler no longer resolves the pending request.

```js
// ❌ v5 pattern — no longer resolves the request in v6
map.on('styleimagemissing', (e) => {
  map.addImage(e.id, generateIcon(e.id));
});

// ✅ v6 — register a resolver
map.setMissingStyleImageResolver((id) => {
  return generateIcon(id); // or return a Promise
});
```

Use this whenever a style references `icon-image` names that are not in the sprite sheet and need to be generated or fetched at runtime.

## 5. `map.transform` is gone — use the public Camera API

v6 refactored `Map` to compose a `Camera` instead of extending it (`Map` now extends `Evented` directly and forwards the camera API). The internal `map.transform` property was removed.

```js
// ❌ v5 — reaching into the internal transform
const { zoom, bearing, pitch } = map.transform;
const center = map.transform.center;

// ✅ v6 — public accessors
const zoom = map.getZoom();
const bearing = map.getBearing();
const pitch = map.getPitch();
const center = map.getCenter();
```

**There is no general public replacement for the raw projection/view matrix.** It was never exposed on `Map` itself, in v5 or v6 — it only ever lived on the internal `map.transform`. The one place a matrix is still available is inside a custom layer's `render()` callback: MapLibre passes it as part of the callback's arguments (`CustomRenderMethodInput.getProjectionData()` / `defaultProjectionData`, see the [custom layers API](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/)). Outside a custom layer, use the public getters above; if you need something else that isn't exposed by the public API at all, that's a real gap — MapLibre's changelog invites opening an issue or PR for it rather than reintroducing a private accessor.

## 6. `MapDataEvent` removed — use `MapSourceDataEvent` / `MapStyleDataEvent`

v6 made every fired event a real class instantiated per event. The old catch-all `MapDataEvent` type is gone; the `data`, `dataloading`, and `dataabort` events are now typed as `MapSourceDataEvent | MapStyleDataEvent`, so a source data event carries its full source info (`sourceId`, `tile`, `sourceDataType`, ...) directly on its own type instead of a generic shared shape.

```ts
// ❌ v5 — MapDataEvent no longer exists in v6
import type { MapDataEvent } from 'maplibre-gl';
map.on('data', (e: MapDataEvent) => {
  /* ... */
});

// ✅ v6 — narrow on the union MapLibre now exports
import type { MapSourceDataEvent, MapStyleDataEvent } from 'maplibre-gl';
map.on('data', (e: MapSourceDataEvent | MapStyleDataEvent) => {
  if ('sourceId' in e) {
    // e is MapSourceDataEvent — e.sourceId, e.sourceDataType, e.tile are available
  } else {
    // e is MapStyleDataEvent
  }
});
```

Applies equally to `dataloading` and `dataabort` handlers — anywhere a type import or annotation names `MapDataEvent`.

## 7. Bundled builds still need `setWorkerUrl()` — CDN ESM does not

v6 changed how the source-processing worker is located, but only for bundled apps. A plain browser `<script type="module">` CDN import (item 1) auto-detects the worker's URL from `import.meta.url` and needs no extra setup. Inside a bundler (Vite, webpack, esbuild, Rspack, Rsbuild, Rollup), `import.meta.url` doesn't reliably resolve to the worker file within the bundler's own module graph — each of these setups needs one explicit `setWorkerUrl()` call, made once before creating the `Map`.

```ts
// ❌ v6 with a bundler, no setWorkerUrl() call — worker fails to load, map never renders
import { Map } from 'maplibre-gl';
const map = new Map({
  /* ... */
});

// ✅ Vite — the `?worker&url` query bundles the worker's own dependencies with it
import { Map, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);
const map = new Map({
  /* ... */
});

// ✅ Webpack 5+ (Rspack and Rsbuild use the same pattern)
import { Map, setWorkerUrl } from 'maplibre-gl';

setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).toString());
const map = new Map({
  /* ... */
});
```

In Vite, use `?worker&url`, not plain `?url` — the worker file imports a sibling `maplibre-gl-shared.mjs`, and `?url` emits the worker verbatim without it, so the worker fails on its first import in production and no vector tiles load. Esbuild, Rollup, and Turbopack need the same one-time call with their own asset-handling syntax; Next.js needs a different approach entirely. See the [install guide](https://maplibre.org/maplibre-gl-js/docs/) for current per-bundler snippets — this changes with tooling versions faster than the rest of this skill.

**Do not carry this into item 1's CDN case** — a plain `<script type="module">` import from a CDN URL never needs `setWorkerUrl()`.

## Reference

- [MapLibre GL JS v5→v6 migration guide](https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/)
- [MapLibre GL JS CHANGELOG](https://github.com/maplibre/maplibre-gl-js/blob/main/CHANGELOG.md) — search for the v6.0.0 section
- [CustomLayerInterface API docs](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/)
- [Install guide](https://maplibre.org/maplibre-gl-js/docs/) — per-bundler `setWorkerUrl()` snippets
