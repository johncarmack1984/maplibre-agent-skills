---
name: maplibre-cartography
description: Cartographic principles for MapLibre GL JS — label and symbol legibility on imagery vs. vector basemaps, figure-ground for point icons, styling vector roads over aerial imagery, visual hierarchy, typography (glyphs/font stacks), sprites and route shields, layer ordering for data injection, and accessibility. Use when styling a map, choosing text or symbol colors, making markers or roads readable on satellite/aerial imagery, setting up fonts or icons, debugging shields, or ordering layers correctly.
---

# MapLibre Cartography

MapLibre renders exactly what you describe in your style JSON. This skill covers how to describe it well: choosing label colors for readability on any basemap, building a coherent visual hierarchy, sourcing and self-hosting fonts and icons, and ordering layers correctly.

## When to Use This Skill

- Choosing label `text-color` and `text-halo-color` for a new or migrated style
- Map labels are hard to read against a background (imagery, dark basemap, complex vector)
- Setting up `glyphs` and `sprite` for a custom or self-hosted style
- Injecting your own data layers into an existing basemap without covering labels
- Making point symbols, markers, or custom icons readable on satellite/aerial imagery
- Restyling roads from a light-basemap vector palette so they sit in (not on top of) imagery
- Route shields render as bare numbers or missing badges
- Auditing a style for contrast accessibility

## Basemap Type Determines Label Colors

The single most impactful cartographic choice in a MapLibre style is whether your labels are readable against the background. The right approach depends on what is behind the text.

| Basemap type                                   | Background                                                 | Recommended text color          | Recommended halo                                 |
| ---------------------------------------------- | ---------------------------------------------------------- | ------------------------------- | ------------------------------------------------ |
| Light vector (streets, OpenFreeMap positron)   | Pale/white                                                 | Dark (`#333` or similar)        | Light semi-transparent (`rgba(255,255,255,0.8)`) |
| Dark vector (dark-matter, navigation night)    | Dark                                                       | White or near-white (`#ffffff`) | Dark semi-transparent (`rgba(0,0,0,0.75)`)       |
| Satellite or aerial imagery (NAIP, Sentinel-2) | Unpredictable — bright crops, dark forests, urban rooftops | White (`#ffffff`)               | **Dark semi-transparent (`rgba(0,0,0,0.75)`)**   |

The imagery case is the one most often misconfigured. Styles generated for light vector basemaps use dark text with a light halo — that combination works on pale backgrounds but fails completely over dark terrain, forests, or water in aerial imagery. **On imagery, always use white text and a dark halo.**

```json
{
  "paint": {
    "text-color": "#ffffff",
    "text-halo-width": 1.2,
    "text-halo-color": "rgba(0,0,0,0.75)"
  }
}
```

For tinted labels (parks, water, POIs), use a light tint of the semantic color rather than the dark saturated version:

```json
{ "text-color": "#c8f5cc" }
{ "text-color": "#a8d8ff" }
```

These read against dark halos while conveying semantic meaning. Full-saturation colors (`#00ff00`, `#0000ff`) are too vivid and contrast poorly with white neighbors at small sizes.

### Halo width

Wider halos increase legibility but add visual weight. Typical values:

| Context                               | `text-halo-width` |
| ------------------------------------- | ----------------- |
| Body labels (city, town, village)     | 1.0–1.5           |
| Country / continent (large text)      | 1.5–2.0           |
| Small POI or peak labels              | 1.0–1.2           |
| Water / park labels with colored text | 1.2–1.5           |

Halo width is in pixels relative to the text, not map units. The halo must not bleed into adjacent labels; keep it tight at small text sizes.

## Point Symbols and Icons on Imagery

Markers face the same figure-ground problem as labels, but with different tools. A colored icon on aerial imagery competes with an unpredictable, busy, _desaturated_ photographic background.

- **You cannot separate a symbol from a background that owns its hue.** A green icon over green parkland, a brown icon over bare soil: both camouflage. Most aerial imagery is low-saturation, so the axis the background is weakest on is **chroma**. A saturated fill (amber, terracotta) separates while still reading as a natural, earthy color. Shifting hue alone, toward a different earth tone, does not help if that hue is also in the scene.
- **Carve the symbol out with a casing**, exactly as you would halo a label. A thin light casing reads against dark canopy and water; a darker edge holds against bright soil and rooftops. Keep it thin: a fat ring reads as a sticker. Terminology: a _halo_ contrasts the background to lift the symbol off it; a _knockout_ matches the background to mask busy texture immediately around the symbol. Both buy separation.
- **Flat fills read as stickers on a photo.** Give landform or 3D symbols dimensional cues. A gradient (lighter on the lit slope, darker on the shaded slope) models form. A _contact shadow_, a blurred flattened ellipse pooled under the base, anchors the symbol to the ground far better than an offset drop-shadow, which makes it look like it floats. Match the symbol's lighting and shadow direction to the basemap's `hillshade-illumination-direction` (commonly NW, 315°) so the symbol sits in the same light as the terrain.

**SVG icons via `addImage`:** when loading an SVG into a sprite image at runtime (fetch the SVG, decode it as an `Image`, then `map.addImage`), the SVG rasterizes at decode time, so `linearGradient` and `feDropShadow` filters bake in correctly.[10], [11] Two gotchas: pad the `viewBox` so halos and shadows are not clipped at the icon edge, and keep `width`/`height` proportional to the `viewBox` or the glyph distorts. Use `"icon-allow-overlap": true` for dense point data.

## Visual Hierarchy

A well-ordered label hierarchy means the most important features dominate at the appropriate zoom level. MapLibre controls hierarchy through text size, font weight, letter spacing, and zoom-range visibility.

### Text size by feature class

Text size should decrease as feature importance decreases. These stops are a starting point; adjust for your tile schema and zoom range:

| Label type       | Base zoom | Max zoom | Size range (px) |
| ---------------- | --------- | -------- | --------------- |
| Continent        | 1         | 4        | 14–20           |
| Country          | 2         | 7        | 11–17           |
| City             | 7         | 11       | 14–24           |
| Town             | 10        | 14       | 11–16           |
| Village / hamlet | 11        | 16       | 10–14           |
| Airport / POI    | 10        | 16       | 12–14           |
| Peak / summit    | 8         | 13       | 10–11           |

POI and peak labels should be visually lighter (smaller, thinner weight) than settlement labels at the same zoom. On an imagery map showing gentle terrain like rolling hills, keep peak labels smaller than airport labels — these are elevation markers, not dominant landmarks.

### Font weight

Use font weight to reinforce hierarchy:

- **Bold** — countries, capital cities
- **Regular** — towns, cities, most labels
- **Italic** — water bodies, parks, regions (conventional cartographic usage)

```json
{ "text-font": ["Noto Sans Bold"] }
{ "text-font": ["Noto Sans Regular"] }
{ "text-font": ["Noto Sans Italic"] }
```

### Multi-line labels

For compact two-line labels (e.g. a symbol character above a name), reduce `text-line-height` below 1.0 to avoid excessive spacing:

```json
{
  "text-field": "△\n{name:latin}",
  "text-line-height": 0.9,
  "text-max-width": 8
}
```

`text-line-height` defaults to 1.2.[12] Values around 0.9 produce tight, readable two-line labels at small sizes. Do not go below ~0.8 or lines will overlap.

### Text transform and spacing

- Use `"text-transform": "uppercase"` for country and continent labels — a conventional cartographic practice
- Use `"text-letter-spacing": 0.05–0.1` for region labels to spread them across a territory

## Styling Vector Roads Over Imagery

Vector road palettes from light-basemap styles (OSM Bright, OSM Liberty) are tuned to pop on pale paper. Dropped on imagery they dominate: high saturation against a desaturated photo, warm hues advance toward the eye, full opacity. Invert the priority. The imagery is the subject; roads are a reference overlay.

- **Desaturate hard.** Move fills and casings toward neutral greys or muted tones. The bright orange/yellow road hierarchy (`#f90`, `#fd4`, `#b06010`) is the most common offender; replace fills with light greys and casings with a darker grey or a deep same-hue color.
- **Keep hierarchy in width and value, not hue.** The width ramps already encode motorway > residential; you do not need loud color to say it.
- **Opaque, not transparent.** Semi-transparent roads let imagery texture bleed through and flatten the whole map. Prefer opaque fills with a value-contained casing for crisp, layered roads.
- **The casing contains the road.** A casing darker than the fill draws the median line that keeps dual carriageways from merging into one blob. A _knockout casing_, a deeper shade of the fill's own hue rather than a foreign black, defines the edge without a harsh cartoon outline.
- **Control brightness by zoom.** Roads tuned at high zoom often read too heavy at the opening (low) zoom, where only thin major roads show and the casing dominates. Interpolate color by zoom: casing dark at low zoom lightening as you zoom in, fills the lightest element brightening as the network fills in.

```json
{
  "line-color": ["interpolate", ["linear"], ["zoom"], 10, "#454545", 12, "#5a5a5a", 14, "#6e6e6e"]
}
```

## Typography: Glyphs and Font Stacks

MapLibre renders text using **SDF (signed-distance field) glyphs** — precomputed font files that scale cleanly at any zoom or screen density. Glyphs are served from a URL matching the pattern in the style's `glyphs` field. **In MapLibre GL JS ≥ 5.11.0** ([PR #4564](https://github.com/maplibre/maplibre-gl-js/pull/4564)) [5], a missing glyph PBF is no longer fatal — MapLibre renders the glyph locally via TinySDF instead, treating `text-font` as a cascading list of local/web font names. That fallback is environment-dependent (it needs a matching font available to the browser or OS) and **GL JS only** — **MapLibre Native still requires glyphs served from a URL matching this field.** Production styles should still serve glyphs explicitly rather than relying on the fallback.

### Setting the glyphs URL

```json
{
  "glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf"
}
```

`{fontstack}` is the URL-encoded, comma-joined list of font names from a layer's `text-font` array (e.g. `Noto Sans Bold,Noto Sans Regular`); `{range}` is a Unicode range (e.g. `0-255`). Full mechanics: [style spec — glyphs](https://maplibre.org/maplibre-style-spec/glyphs/). `text-font` is itself a fallback list — see [Noto for global maps](#noto-for-global-maps) below.

### Font options

| Source                                | Fonts available                                                                          | Notes                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `demotiles.maplibre.org/font`         | Noto Sans (Latin, Arabic, CJK, etc.), Noto Sans Bold, Italic                             | Free, publicly hosted; good for prototyping              |
| OpenMapTiles `fonts.openmaptiles.org` | Klokantech Noto Sans family                                                              | Matched to OMT schema styles                             |
| Self-hosted, existing font            | Reuse prebuilt PBFs (openmaptiles/fonts, UNDP-Data/fonts, or your current server's tree) | Full control; no generation needed for standard fonts    |
| Self-hosted, custom font              | Generate PBFs from your own TTF/OTF                                                      | Only needed when no prebuilt PBF set exists for the font |

**For standard fonts (Noto Sans, Open Sans, Roboto, and similar), you do not need to generate anything.** The simplest no-generation path is to copy the `{fontstack}/{range}.pbf` tree a glyph server already serves (e.g. the one your style currently points at) onto your own origin. Projects such as [openmaptiles/fonts](https://github.com/openmaptiles/fonts) [2] and [UNDP-Data/fonts](https://github.com/UNDP-Data/fonts) [3] package the common standard fonts as glyph PBFs you can build or pull — note both also run hosted endpoints, which are themselves third-party servers to avoid if self-hosting is the point. Point the style's `glyphs` field at your own URL template; the font names in your `text-font` arrays must exactly match the served font-stack folder names.

**Generating glyphs from a TTF/OTF is a separate, heavier task** — only needed for a custom or brand font with no existing PBF set. Use [Font Maker](https://maplibre.github.io/font-maker/) [4] or [fontnik](https://github.com/mapbox/fontnik) to produce the `.pbf` files, then serve and reference them the same way as above.

### Noto for global maps

Noto ("no tofu") is Google's open-source family built for near-universal Unicode coverage[15]: Noto Sans covers Latin/Greek/Cyrillic, and script-specific fonts (Noto Sans Arabic, Noto Sans Devanagari, Noto Sans Thai, the region-specific Noto Sans CJK SC/TC/JP/KR) extend it. How you handle non-Latin text depends on the script, and CJK is the case people most often get wrong.

**CJK (Chinese, Japanese, Korean) — rendered locally by default; do not serve CJK glyph PBFs.** MapLibre GL JS's `localIdeographFontFamily` map option defaults to `'sans-serif'`, so CJK characters are generated on-device (TinySDF) and the style's `text-font` is **ignored** for them (except the weight keyword). This exists because CJK text has poor locality across Unicode ranges — a single tile can otherwise trigger dozens of large glyph requests.[16] Leave it on; optionally point it at a nicer on-device CJK font. Setting `localIdeographFontFamily: false` restores served glyphs for CJK, which is much slower — only do it if you specifically need the served font's shapes.

```javascript
const map = new maplibregl.Map({
  // ...
  localIdeographFontFamily: '"Noto Sans CJK SC", sans-serif' // optional; default is 'sans-serif'
});
```

**Other non-Latin scripts (Arabic, Hebrew, Devanagari, Thai, …) — need real glyphs.** `localIdeographFontFamily` does not apply here. Add the relevant Noto script font to the layer's `text-font` fallback list and serve its glyph PBFs (or rely on the GL JS ≥ 5.11.0 local fallback, which is environment-dependent — see the top of this section). Font names must match those the glyph server knows.

```json
{ "text-font": ["Noto Sans Regular", "Noto Sans Devanagari Regular"] }
```

**Arabic and Hebrew additionally need the RTL text plugin** for correct right-to-left shaping and ordering — glyph coverage alone is not enough. MapLibre GL JS does not handle RTL by default[13]:

```javascript
import { setRTLTextPlugin } from 'maplibre-gl';
setRTLTextPlugin('https://unpkg.com/maplibre-gl/dist/maplibre-gl-rtl-text.js', null, true);
```

Call this before initializing the map.

## Sprites: Icons and Markers

**Sprites** are spritesheets (a single PNG + JSON metadata) that MapLibre uses for `icon-image` in symbol layers. Full fetch mechanics (`.json`/`.png`/`@2x`): [style spec — sprite](https://maplibre.org/maplibre-style-spec/sprite/).

```json
{
  "sprite": "https://demotiles.maplibre.org/styles/osm-bright-gl-style/sprite"
}
```

### Icon sources

| Source                                                                          | Description                                                                                                                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Maki](https://github.com/mapbox/maki) [6]                                      | OpenStreetMap-focused icon set; the most widely used in MapLibre/Mapbox styles                                                                                                              |
| [Temaki](https://github.com/ideditor/temaki)                                    | Extended community set, complements Maki                                                                                                                                                    |
| [OpenMapTiles sprites](https://github.com/openmaptiles/maptiler-basic-gl-style) | OMT-schema styles include a compatible sprite                                                                                                                                               |
| Custom SVG → sprite                                                             | Generate with [spritezero](https://github.com/mapbox/spritezero), [spreet](https://github.com/flother/spreet), or [MapLibre Sprite Generator](https://maplibre.github.io/sprite-generator/) |

### Self-hosted sprites

For a self-hosted stack, generate a spritesheet from SVG icons and serve the `.json` and `.png` files at the sprite URL. If you are adapting an existing style, download and host the existing sprite to avoid a third-party dependency. The sprite origin must be public and send CORS headers: a sprite committed to a **private** GitHub repo returns 404 from `raw.githubusercontent.com` and GitHub Pages to an anonymous browser (and `raw` does not honor browser login), so the map cannot fetch it.[17] Host the sprite on a public origin, or keep it local and serve it from the same origin as the style.

The `sprite` field must be a **base path without any file extension**. MapLibre appends `.json`, `.png`, and `@2x` variants automatically to construct the actual request URLs. Setting `sprite` to `https://example.com/sprites/basic.json` causes MapLibre to request `basic.json.json` and `basic.json.png` — both 404. Set it to the base path: `https://example.com/sprites/basic`.

Icon names in `icon-image` must exactly match the keys in the sprite JSON. A missing icon is silently omitted.

### Broken route shields

Broken-looking route shields (bare floating numbers, missing badges) are almost always a **missing sprite image**. The shield number is text (font) and usually renders fine; the badge behind it is an `icon-image` from the sprite. Diagnose in this order:

1. **Confirm glyphs load.** Probe the `glyphs` server for the exact `text-font` names and expect HTTP 200. If they 200, the font is not the problem.
2. **Confirm the sprite carries the shield images.** OpenMapTiles and OSM Liberty shield layers use `icon-image: "{network}_{ref_length}"` for known networks (e.g. `us-interstate_2`, `us-highway_3`, `us-state_2`) and `road_{ref_length}` for generic refs. A missing icon is silently omitted, so grep the sprite JSON for those keys.

Not every sprite carries shields localized for the US, so grep the sprite JSON for the `{network}_{ref_length}` keys before assuming they exist. Both the `demotiles.maplibre.org/styles/osm-bright-gl-style/sprite` and `openmaptiles.github.io/osm-bright-gl-style/sprite` sheets currently include `us-interstate_*`, `us-highway_*`, and `us-state_*` (alongside the generic `road_1`–`road_6`), but a minimal or custom sprite may ship only the generic `road_*`. If yours lacks the shield images and your tiles populate `network`, `ref`, and `ref_length` (the OSM US OpenMapTiles tiles do), point `sprite` at one that has them — the `{network}_{ref_length}` layers then resolve with no layer edits.

## Layer Ordering

MapLibre renders layers in the order they appear in the style `layers` array — first item is drawn first (bottom), last is drawn last (top).[1] Getting this wrong is the most common cause of data layers obscuring basemap labels.

### The injection pattern

When adding your own data to an existing basemap style at runtime, insert your layers **before the first symbol layer** so your geometry renders under labels:

```javascript
map.on('load', () => {
  const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;

  map.addSource('my-data', { type: 'geojson', data: '/my-data.geojson' });
  map.addLayer(
    { id: 'my-fill', type: 'fill', source: 'my-data', paint: { 'fill-color': '#0080ff', 'fill-opacity': 0.4 } },
    firstSymbol
  );
});
```

Without the second argument to `addLayer`, your layer goes above everything including labels[14] — which looks wrong on any map with labels and is confusing to users.

### Canonical layer order for custom styles

When building a style from scratch, follow this ordering bottom to top:

1. `background`
2. Raster imagery (if using satellite/aerial source)
3. Hillshade layers (if any — see [maplibre-terrain-patterns](../maplibre-terrain-patterns/SKILL.md) for configuration)
4. Terrain fill (water, land, parks — polygon layers)
5. Line layers (roads, boundaries, rivers)
6. Your data polygon and line layers
7. Symbol layers from the basemap (place labels, road labels)
8. Your data symbol/label layers (if any)

Hillshade must sit directly above raster imagery and below all vector layers. Hillshade applied over vector layers washes out line and fill colors.

### Boundary lines on imagery

On imagery basemaps, administrative boundary lines should be thin and semi-transparent — thick opaque lines fight with the imagery texture. Scale line width with zoom using stops:

```json
{
  "line-color": "hsl(248, 7%, 66%)",
  "line-width": {
    "base": 1,
    "stops": [
      [0, 0.3],
      [4, 0.6],
      [5, 0.9],
      [12, 3]
    ]
  }
}
```

## Accessibility

MapLibre styles are rendered in the browser as a WebGL canvas. Accessibility considerations:

- **Text contrast:** WCAG 2.1 AA requires 4.5:1 contrast for normal text, 3:1 for large text.[9] White text on a `rgba(0,0,0,0.75)` halo satisfies this for most backgrounds. Check contrast ratios with a tool like the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) [8] using the combined text+halo color.
- **Do not rely on color alone:** Use shape, size, or pattern to convey information in addition to color. A viewer with deuteranopia cannot distinguish green park labels from red danger zones by hue alone.
- **Minimum label size:** Labels below 10px are difficult to read at standard DPI. Prefer stops that start at 10px even at low zoom levels.
- **Screen readers and the WebGL canvas:** MapLibre's canvas is not inherently accessible to screen readers. For accessible map experiences, provide an accessible alternative such as a data table or a text description of the map contents, and use [maplibre-gl-accessibility](https://github.com/maplibre/maplibre-gl-accessibility) [7] for keyboard navigation and ARIA roles.

## Related Skills

- [**maplibre-tile-sources**](../maplibre-tile-sources/SKILL.md) — Setting up glyphs, sprites, and source configuration.
- [**maplibre-pmtiles-patterns**](../maplibre-pmtiles-patterns/SKILL.md) — Serving imagery (raster) and terrain sources from PMTiles files.
- [**maplibre-terrain-patterns**](../maplibre-terrain-patterns/SKILL.md) — Hillshade configuration, multi-pass techniques, 3D terrain, DEM sources.

## References

1. **MapLibre Style Specification** — layer properties, paint/layout fields, expression syntax — [maplibre.org/maplibre-style-spec/](https://maplibre.org/maplibre-style-spec/)
2. **openmaptiles/fonts** — prebuilt glyph PBFs for standard fonts (Noto Sans, Open Sans, PT Sans, Roboto, Metropolis) — [github.com/openmaptiles/fonts](https://github.com/openmaptiles/fonts)
3. **UNDP-Data/fonts** — prebuilt glyph PBFs maintained for MapLibre GL JS — [github.com/UNDP-Data/fonts](https://github.com/UNDP-Data/fonts)
4. **Font Maker (MapLibre)** — browser-based SDF glyph generator, for custom fonts only — [maplibre.github.io/font-maker/](https://maplibre.github.io/font-maker/)
5. **PR #4564** — GL JS local glyph rendering fallback (≥5.11.0) — [github.com/maplibre/maplibre-gl-js/pull/4564](https://github.com/maplibre/maplibre-gl-js/pull/4564)
6. **Maki icon set** — [github.com/mapbox/maki](https://github.com/mapbox/maki)
7. **maplibre-gl-accessibility** — [github.com/maplibre/maplibre-gl-accessibility](https://github.com/maplibre/maplibre-gl-accessibility)
8. **WebAIM Contrast Checker** — [webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/)
9. **WCAG 2.1 contrast requirements** — [w3.org/TR/WCAG21/#contrast-minimum](https://www.w3.org/TR/WCAG21/#contrast-minimum)
10. **`Map.addImage()` (MapLibre GL JS API)** — accepted input types (HTMLImageElement, ImageData, ImageBitmap) — [maplibre.org/maplibre-gl-js/docs/API/classes/Map/#addimage](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#addimage)
11. **`CanvasRenderingContext2D.drawImage()` (MDN)** — SVG rasterizes (filters included) at draw time — [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)
12. **MapLibre Style Spec: `text-line-height`** — default `1.2` — [maplibre.org/maplibre-style-spec/layers/#text-line-height](https://maplibre.org/maplibre-style-spec/layers/#text-line-height)
13. **`setRTLTextPlugin` (MapLibre GL JS API)** — required for correct Arabic/Hebrew shaping — [maplibre.org/maplibre-gl-js/docs/API/functions/setRTLTextPlugin/](https://maplibre.org/maplibre-gl-js/docs/API/functions/setRTLTextPlugin/)
14. **`Map.addLayer()` (MapLibre GL JS API)** — `beforeId` behavior; omitted = appended above everything — [maplibre.org/maplibre-gl-js/docs/API/classes/Map/#addlayer](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#addlayer)
15. **Noto fonts overview (Wikipedia)** — universal Unicode coverage from inception, "no tofu" etymology — [en.wikipedia.org/wiki/Noto_fonts](https://en.wikipedia.org/wiki/Noto_fonts)
16. **Use locally generated ideographs (MapLibre GL JS example)** — `localIdeographFontFamily` default and CJK rendering behavior — [maplibre.org/maplibre-gl-js/docs/examples/use-locally-generated-ideographs/](https://maplibre.org/maplibre-gl-js/docs/examples/use-locally-generated-ideographs/)
17. **`raw.githubusercontent.com` and private repositories (GitHub Community Discussion)** — private-repo raw URLs return 404/403 to anonymous requests — [github.com/orgs/community/discussions/69281](https://github.com/orgs/community/discussions/69281)

## Further Reading (not currently cited in this skill — for review)

- **Noto fonts** — [fonts.google.com/noto](https://fonts.google.com/noto)
- **Spreet** — sprite sheet generator from SVG — [github.com/flother/spreet](https://github.com/flother/spreet)
