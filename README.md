# MapLibre Agent Skills

Curated guidance for AI assistants building MapLibre applications — covering ecosystem and open-source best practices.

Agent skills are markdown files that AI coding assistants read as context. When you ask an AI agent to implement something using MapLibre, these skills give the AI the judgment to avoid common API gotchas, and suggest patterns that work.

New skills are prioritized based on periodic demand mining — tracking documented AI failures in GitHub issues, Stack Overflow, and community Slack. Each skill is tested with [Promptfoo](https://promptfoo.dev/) evals to verify it improves AI responses on real developer questions.

## Available Skills

🧪 **Provisional** skills carry useful, community-contributed knowledge that hasn't yet passed our eval suite. See [Provisional skills](CONTRIBUTING.md#provisional-skills) in CONTRIBUTING.md.

| Skill                                                                    | Use when                                                                                                                             | Status      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| [`maplibre-tile-sources`](skills/maplibre-tile-sources/SKILL.md)         | Choosing how to supply map data; deciding between GeoJSON and tiles; configuring a basemap; debugging blank maps or missing labels   | ✅ Verified |
| [`maplibre-pmtiles-patterns`](skills/maplibre-pmtiles-patterns/SKILL.md) | Hosting tiles without a tile server; static or serverless deployments; converting from MBTiles; generating tiles from OSM or GeoJSON | ✅ Verified |
| [`maplibre-mapbox-migration`](skills/maplibre-mapbox-migration/SKILL.md) | Moving an existing Mapbox GL JS app to MapLibre; evaluating MapLibre as an open-source alternative                                   | ✅ Verified |
| [`maplibre-terrain-patterns`](skills/maplibre-terrain-patterns/SKILL.md) | Adding elevation context, hillshade, or 3D terrain; choosing raster-dem sources and encodings; self-hosting DEM tiles                | ✅ Verified |
| [`maplibre-cartography`](skills/maplibre-cartography/SKILL.md)           | Styling a map; making labels, markers, or roads readable on imagery or vector basemaps; setting up fonts, sprites, or shields        | ✅ Verified |

## Development

Each skill lives under `skills/<skill-name>/` as a single **SKILL.md**: YAML front-matter (`name`, `description`, `status`) plus markdown content.

The repo root carries one [**AGENTS.md**](AGENTS.md), the router that orients an AI agent working in a clone of this repo and points it at the right skill. Skills do not get their own; see [The AGENTS.md convention](CONTRIBUTING.md#the-agentsmd-convention).

See [CONTRIBUTING.md](CONTRIBUTING.md) to add or improve a skill. All experience levels welcome, but please note, since we are trying to improve on genAI baseline contributions to MapLibre development, skills or contributions generated entirely by AI agents will likely be rejected.

## Note on AI usage

Please take a moment to review [MapLibre's AI Policy](https://github.com/maplibre/maplibre/blob/main/AI_POLICY.md). tl;dr: do not let AI speak for you, verify all generated content before requesting a review and disclose AI usage in pull requests.

## Install

Installing skills into your project means AI assistants automatically pick them up when you describe a task — no need to define context manually each time.

### Without the CLI

Skills are plain markdown.

- **Paste into chat**: Open any `SKILL.md` above and paste it directly into your AI assistant's context window.
- **Copy to your project**: Drop a `SKILL.md` into `.claude/skills/`, `.cursor/rules/`, or append it to `.github/copilot-instructions.md`.
- **Symlink for local development**:

```bash
mkdir -p .claude
ln -s /path/to/maplibre-agent-skills/skills .claude/skills
```

### Via the skills CLI

The [skills CLI](https://github.com/vercel-labs/skills) is a package manager for AI agent skills. It places skill files in the right location for your tool automatically, and supports 40+ agents.

```bash
# List available skills
npx skills add maplibre/maplibre-agent-skills --list

# Install all skills
npx skills add maplibre/maplibre-agent-skills

# Install a single skill
npx skills add maplibre/maplibre-agent-skills --skill maplibre-tile-sources
```

By default, skills are installed per project. To install globally (e.g. to your user profile):

```bash
npx skills add maplibre/maplibre-agent-skills -g
```

To install for a specific agent:

```bash
npx skills add maplibre/maplibre-agent-skills -a claude-code
npx skills add maplibre/maplibre-agent-skills -a cursor
npx skills add maplibre/maplibre-agent-skills -a vscode
```

See [Supported Agents](https://github.com/vercel-labs/skills?tab=readme-ov-file#supported-agents) for the full list.

Once installed, you can manage skills with:

| Command                      | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `npx skills list`            | List installed skills (alias: `ls`)            |
| `npx skills find [query]`    | Search for skills interactively or by keyword  |
| `npx skills remove [skills]` | Remove installed skills from agents            |
| `npx skills check`           | Check for available skill updates              |
| `npx skills update`          | Update all installed skills to latest versions |
| `npx skills init [name]`     | Create a new SKILL.md template                 |

## License

MIT License. Copyright (c) MapLibre and contributors. See [LICENSE.md](LICENSE.md) and [NOTICE](NOTICE) for more information.
