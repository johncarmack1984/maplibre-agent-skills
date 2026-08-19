# Contributing to MapLibre Agent Skills

Thank you for your interest in contributing! This repository helps AI assistants build better MapLibre applications with open tile sources and open-source tooling through structured domain expertise.

We welcome:

- **New skills** — Add expertise in areas not yet covered
- **Skill improvements** — Better examples, patterns, or guidance for existing skills
- **Bug fixes** — Correct errors in instructions or examples
- **Eval rubrics** - Suggest rubrics to test whether the pinned LLM can answer a specific question completely and accurately
- **Documentation** — Clearer code samples or in-skill examples
- **Questions** — Open an issue or contact the maintainers as appropriate

Providers, API keys, commands, and how to write prompts and rubrics all live in [`evals/README.md`](evals/README.md).

## Three ways to contribute (pick your lane)

You do **not** need to learn our eval setup to help. Choose the lane that fits:

| Lane                            | You provide                                     | You need                                       | Effort       |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------- | ------------ |
| **1. Report a failure**         | A wrong AI answer + (if you know) the right one | A GitHub account                               | 2 minutes    |
| **2. Write a scaffolded skill** | The skill _content_, against a rubric we wrote  | A GitHub account; willingness to edit Markdown | An afternoon |
| **3. Full skill + evals**       | Content _and_ the eval prompts/rubric           | Local setup + API keys (see below)             | A day+       |

Most contributors should start at Lane 1 or 2. Eval rigor still applies — we just run it for
you (a maintainer, at weekly triage) or write the tests for you (scaffolded issues). Lane 3 is
for when you want to own the whole thing.

- **Lane 1:** open an [AI failure report](https://github.com/maplibre/maplibre-agent-skills/issues/new?template=ai-failure-report.md) — no code, no evals.
- **Lane 2:** claim an open [good first skill](https://github.com/maplibre/maplibre-agent-skills/labels/good-first-issue) issue — the eval prompts and rubric are already written; you write `SKILL.md`.
- **Lane 3:** follow the full workflow below, starting with [Contribute a Skill](#contribute-a-skill).

Have valuable knowledge but don't want to write evals right now? See [Provisional skills](#provisional-skills) — you can land content first, and a maintainer adds the evals later.

## Contribute a Skill

We’d love your help expanding this collection. Whether you’re a student still learning or a seasoned professional building with MapLibre every day — **your experience can help AI assistants guide developers better**.

**Why contribute?**

- Share your hard-won knowledge with the open mapping community
- Learn once and for all how to do that _thing_ by explaining it concisely with a code sample
- Shape how AI assistants recommend MapLibre patterns and open-source tools
- Small, focused contributions are welcome — even a single well-documented pattern helps

**How to get started:**

1. **Check existing skills** — Review [skills/](./skills) to see what is already covered
2. **Browse open issues** — Check [open issues](https://github.com/maplibre/maplibre-agent-skills/issues) for planned skills and comment with any requirements, resources or gotchas you think should also be covered
3. **Open an issue** — Use the [issue template](https://github.com/maplibre/maplibre-agent-skills/issues/new?template=skill_request.md) if you have an idea not yet on the list — we’re happy to help refine scope and requirements
4. **Understand the requirements** — Review this page for skill structure, format, and quality guidelines
5. **Pick up a task** — Comment in the relevant issue — to confirm a maintainer is available to review, be explicit about how much of the outline you can cover
6. **Review examples** — Use existing skills (e.g. [maplibre-tile-sources](skills/maplibre-tile-sources/SKILL.md)) as a reference for style and depth
7. **Start with evals** _(Lane 3)_ — Get set up with an LLM API and write or revise prompts first, to demonstrate where AI agents are failing. In Lanes 1 and 2 a maintainer does this for you

New to [Agent Skills](https://agentskills.io)? The [specification](https://agentskills.io/specification) describes the general format. See [SKILL.md format](#3-skillmd-format) for how skills are structured in this repo specifically.

## Editing Skills

### Skill Quality Standards

Skills in this repo must be:

- **Accurate** — Matches MapLibre and referenced APIs/docs
- **Actionable** — Clear guidance, not just general, declarative descriptions
- **Warranted** — Targets something the model gets wrong without the skill. Content that passes at baseline is cut, however well written (see [Cutting content the model already gets right](evals/README.md#cutting-content-the-model-already-gets-right))
- **Attribution** — Reference primary sources wherever possible, and always preserve Mapbox copyright (see [A note about adapted content](#a-note-about-adapted-content))
- **Consistent** — Format and style in line with existing skills

If you spot an error, omission, or quality gap, open an issue or comment on an existing one.

### What is checked, and by whom

Correctness is established two ways, neither of them automatic on a pull request:

- **Evals** — [Promptfoo](https://promptfoo.dev/) prompts and rubrics that test whether an AI assistant answers correctly with the skill loaded and incorrectly without it. The rubric is written before the skill and defines what a correct answer must contain, independent of the skill's phrasing. Judge-graded evals showing prompt responses that fail without the skill and pass with the skill are stored in [`evals/results/`](evals/results). The prompts are re-run and skills are adjusted whenever there is turnover in the pinned model.
- **Human review** — every merged claim is one a maintainer read and can defend. See [Note on AI usage](#note-on-ai-usage).

**`npm run check` is the only automated gate.** It runs on every pull request and as a pre-push hook, and it checks structure and style: formatting, spelling, markdown links, terminology, and that each `SKILL.md` has valid front-matter. **It does not check whether anything a skill says about MapLibre is true.**

`status: verified` in a skill's front-matter means precisely that: the eval was run and its results are committed. `status: provisional` means content has landed and that has not happened yet. See [Provisional skills](#provisional-skills). `status: process` is reserved internally for skills pertaining only to maintaining `maplibre-agent-skills`.

What that adds to each lane, on top of what [Three ways to contribute](#three-ways-to-contribute-pick-your-lane) already lists:

| You are                                 | You also owe                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Reporting a failure (Lane 1)            | Nothing further                                                                                   |
| Writing a scaffolded skill (Lane 2)     | `npm run check` passing                                                                           |
| Contributing content and evals (Lane 3) | `npm run check` passing, and both runs (with the skill and at baseline) saved to `evals/results/` |
| A maintainer                            | The judge-graded run, and the `verified` or `provisional` call                                    |

When modifying an existing skill: update or add eval tests to cover the change, and do not remove tests to make a PR pass. Update them with reviewer sign-off instead.

Adding a section to an existing skill requires the same process: a probe at baseline to confirm the model fails to answer correctly without the addition. See [Cutting content the model already gets right](evals/README.md#cutting-content-the-model-already-gets-right) for a worked example from `maplibre-tile-sources`.

### Development Setup

**1. Clone the repo and install dependencies:**

```bash
git clone https://github.com/maplibre/maplibre-agent-skills.git
cd maplibre-agent-skills
npm install
```

`npm install` installs a pre-push git hook that runs checks before every push.

**2. Set up eval providers** — See [evals/README.md](evals/README.md#setup) for current recommended providers, API keys, and setup instructions.

### Running evals locally

Developing and testing against your own eval rubrics is recommended and encouraged. It is as simple as setting up your own free API keys. See [`evals/README.md`](evals/README.md#setup) for instructions.

### Check format and spelling

Run `npm run check` frequently while developing — it runs all checks and stops at the first failure:

1. **Formatting** — Prettier (`.md`, `.json`, `.js`)
2. **Spelling** — cspell (markdown)
3. **Markdown linting** — markdownlint
4. **Terminology** — proper noun capitalization (e.g. `MapLibre` not `Maplibre`)
5. **Skills validation** — YAML frontmatter and structure

All checks pass when the output ends with:

```text
✅ All skills are valid
```

See [Fixing Issues](#fixing-issues) below for how to resolve errors from each check.

### Fixing Issues

Most issues are auto-fixable:

| Check            | Fix                                                                       |
| ---------------- | ------------------------------------------------------------------------- |
| Formatting       | `npm run format`                                                          |
| Terminology      | `npm run fix:terminology`                                                 |
| Markdown linting | `npm run format` fixes MD060 (table spacing); others require manual edits |
| Spell check      | Correct manually                                                          |

**Markdown linting details:** Error output includes the rule ID and line number. The most common manual fix is **MD051** (invalid link fragment) — verify the heading exists and the anchor is lowercase with hyphens.

**Terminology details:** Flags incorrect capitalization of proper nouns in prose (e.g. `maplibre` → `MapLibre`). Applies to standalone words only; package names and URL paths are ignored.

**Adding new words:** When a check flags a word that is correct:

- **Proper nouns** — add to [`terminology.txt`](terminology.txt) (used by both the spell checker and terminology checker)
- **Other technical terms** — add to the `words` array in [`cspell.config.json`](cspell.config.json), alphabetically sorted
- **Do not add URL slugs** — fix the link text instead (e.g. `[Service Name](https://...)`)

**Bypass pre-push:** `git push --no-verify`. Use this if you are stuck or unsure how to resolve a check. CI will still run checks; your reviewer can help resolve them before merge.

### Submitting a Change

For bug fixes, typos, and documentation edits:

1. Create a branch: `git checkout -b fix-your-description`
2. Make your edit.
3. Run `npm run check` and fix any issues.
4. If you edited skill content, run evals to confirm nothing regressed — see [Running evals locally](#running-evals-locally).
5. Push and open a PR describing what you changed and why.

For new skills, follow the full workflow in [Creating a New Skill](#creating-a-new-skill).

## Creating a New Skill

Follow these steps to add a new skill to the collection.

### 1. Write Evals First

Before writing any skill content, write the eval prompts and rubric. Evals define what a correct answer must include — independently of what the skill says. This is the quality control mechanism.

1. Copy `evals/prompts/TEMPLATE.yaml`, rename it to `evals/prompts/maplibre-your-skill-name.yaml`.
2. Write a set of at least 4, up to 10 prompts. See [evals/README.md](evals/README.md#writing-eval-prompts) for test types and assertion guidance.
3. Create a branch: `git checkout -b add-maplibre-your-skill-name`
4. Open a draft PR with only the eval and prompt files for reviewer sign-off.
5. Run a baseline check — see [Proving tests fail without the skill](evals/README.md#proving-tests-fail-without-the-skill). Explicit, implicit, and anti-pattern tests must all fail; negative test results require judgment.
6. Write the skill to make the evals pass.
7. Run evals locally to confirm all pass (see [Running evals locally](#running-evals-locally)), then push.

### 2. Skill Structure

```text
skills/maplibre-your-skill-name/
└── SKILL.md              # Required: the whole skill
```

### 3. SKILL.md Format

Every SKILL.md must have YAML frontmatter followed by markdown:

```markdown
---
name: maplibre-example-skill
description: Expert guidance on [domain] for MapLibre applications
status: provisional
---

# MapLibre [Domain] Skill

Use this skill when:

- [Use case 1]
- [Use case 2]

## Core principles

[Guidance, examples, decision tables]

## Reference

- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [Other links]
```

- `name` must match the directory name exactly (e.g. `maplibre-tile-sources`).
- `description` should be concise (1–2 sentences).
- `status` is `verified` (evals pass in CI) or `provisional` (content lands before evals — see [Provisional skills](#provisional-skills)).
- Content must include actionable guidance, not just reference text.

### 4. Content Guidelines

**Good skills have:**

- Clear structure with headings
- Actionable guidance (“Use X when Y”)
- Decision tables or trees where helpful
- Code examples (MapLibre GL JS, open APIs) with ✅/❌ where useful
- Concrete thresholds or scenarios where relevant
- Links to MapLibre docs or other open-source docs

**Avoid:**

- Generic text that only repeats official docs
- Lists without context or prioritization
- Vague guidance (“might want to”, “could consider”)

**Reference:** Include links to primary sources wherever possible. See [Attribution and References](#attribution-and-references) for a curated list.

### 5. Test Your Skill

Before publishing your PR:

1. **Test with an AI assistant:** confirm and document the AI failure or gap you are responding to, and then use `npx skills add .` to install your new skill or revision. Ask the questions the skill should answer, including from any existing eval rubric.
2. Assuming you have the eval framework set up locally, **run the evals**, with the skill and at baseline, and commit both result files. See [Running evals locally](#running-evals-locally). If you are in Lane 1 or Lane 2, ok to skip this, a reviewer will do this for you.
3. **Run all checks:** `npm run check` (fix any issues before continuing).

## Note on AI usage

Please take a moment to review [MapLibre's AI Policy](https://github.com/maplibre/maplibre/blob/main/AI_POLICY.md). tl;dr: do not let AI speak for you, verify all generated content before requesting a review and disclose AI usage in pull requests.

**What that means in this repo.** The policy is not a prohibition. Its first line: “contributors can use whatever tools they would like to craft their contributions, but there must be a **human in the loop**.” It then makes each contributor responsible for aligning with “repository-specific contribution guidelines,” which is this section. So, concretely: an AI agent may draft skill content, eval prompts, and rubrics. What it may not do is submit them, or speak for you in the pull request.

Before you mark a pull request ready for review:

- **Verify every claim against a primary source.** The [style spec](https://maplibre.org/maplibre-style-spec/), the [GL JS docs](https://maplibre.org/maplibre-gl-js/docs/), and the GL JS [CHANGELOG](https://github.com/maplibre/maplibre-gl-js/blob/main/CHANGELOG.md) decide correctness. A fluent draft that cites nothing is the exact failure mode this repo exists to correct.
- **Be able to answer questions about it** during review. If you cannot explain why a section says what it says, it is not ready.
- **Write the PR description yourself**, and disclose the AI usage in it, noting the models and prompts used. The pull request template has a line for this. Disclosure is not penalized.

Agent-drafted content meets the same gate as everything else, and the gate is the point: a skill must close a [demonstrated gap](#1-write-evals-first) and pass evals that failed at baseline. Nothing enters this collection because it reads well.

## Attribution and References

Reference these sources in skill content wherever possible:

**MapLibre — core:**

- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) — web maps JavaScript library. For MapLibre code patterns to reference while writing skills, see the [MapLibre GL JS examples](https://maplibre.org/maplibre-gl-js/docs/examples/).
- [MapLibre Style Spec](https://maplibre.org/maplibre-style-spec/) — JSON style schema for GL JS and Native
- [MapLibre Native](https://maplibre.org/maplibre-native/docs/book/) — C++ library for Android, iOS, and desktop, see [main README on GitHub](https://github.com/maplibre/maplibre-native) for instructions on how to _use_ MapLibre Native.
- [Martin tile server](https://maplibre.org/martin/) — PostGIS, MBTiles, and PMTiles tile server
- [MapLibre Tile Spec](https://maplibre.org/maplibre-tile-spec/) — next-generation vector tile format

**MapLibre — framework bindings:**

- [MapLibre React Native](https://maplibre.org/maplibre-react-native/docs/setup/getting-started/) — Expo and React Native (Android & iOS)
- [maplibre-compose](https://maplibre.org/maplibre-compose/) — Jetpack Compose (Android)
- [ngx-maplibre-gl](https://maplibre.org/ngx-maplibre-gl/) — Angular
- [flutter-maplibre-gl](https://github.com/maplibre/flutter-maplibre-gl) — Flutter
- [swiftui-dsl](https://github.com/maplibre/swiftui-dsl) — SwiftUI

**MapLibre — plugins and tools:**

- [maplibre-gl-geocoder](https://maplibre.org/maplibre-gl-geocoder/) — geocoding UI control for GL JS
- [maplibre-gl-directions](https://maplibre.org/maplibre-gl-directions/) — routing/directions plugin for GL JS
- [Maputnik](https://maplibre.org/maputnik/) — visual style editor
- [awesome-maplibre](https://github.com/maplibre/awesome-maplibre) — curated ecosystem list

**Tile sources and map data:**

- [OpenFreeMap](https://openfreemap.org/quick_start/) — free hosted OpenStreetMap tiles with MapLibre-ready styles
- [OpenStreetMap US Tileservice](https://tiles.openstreetmap.us/) - vector and raster tilesets and fonts for the OpenStreetMap community
- [PMTiles / Protomaps](https://docs.protomaps.com/) — single-file tile archive format for serverless deployments
- [Overture Maps](https://docs.overturemaps.org/) — open, structured map data

**Geocoding and routing:**

- [Nominatim API](https://nominatim.org/release-docs/latest/api/Overview/) — OpenStreetMap geocoding and reverse geocoding
- [OSRM API](https://project-osrm.org/docs/v5.24.0/api/) — open source routing engine

**Tile generation:**

- [tippecanoe](https://github.com/felt/tippecanoe) — build vector tilesets from GeoJSON

### A note about adapted content

Due to similarities and shared history, though it shouldn’t strictly be necessary, we acknowledge that this project may adapt structure or content from [mapbox-agent-skills](https://github.com/mapbox/mapbox-agent-skills) (MIT © Mapbox). Please, if you find yourself adding or change content that is adapted from that repository:

- **Preserve Mapbox’s copyright.** The [NOTICE](NOTICE) file and [LICENSE.md](LICENSE.md) already state that portions are adapted from mapbox-agent-skills and remain Copyright (c) Mapbox, Inc.
- For a skill or file that is substantially adapted from a Mapbox skill, you may add a short line at the top of the file, e.g.:
  `Adapted from mapbox-agent-skills. Copyright (c) Mapbox, Inc. Modifications (c) MapLibre and contributors.`
- New, original content only needs the project’s usual license (see [LICENSE.md](LICENSE.md)).

## Code of Conduct

This project follows the [MapLibre Code of Conduct](https://github.com/maplibre/.github/blob/main/CODE_OF_CONDUCT.md). Please read it before contributing.

- Be respectful, constructive, and collaborative
- No harassment, spam, or unprofessional behavior

Issues or PRs that violate these standards may be closed; repeat offenders may be blocked.

## AI-Generated Contributions

This project follows the [MapLibre AI Generated Contributions Policy](https://github.com/maplibre/maplibre/blob/main/AI_POLICY.md). In brief: AI tools are permitted, but contributors are responsible for the content they submit — including correctness, licensing, and the ability to explain and maintain it during review.

## License

By contributing, you agree that your contributions will be licensed under the MIT License (see [LICENSE.md](LICENSE.md)).

Thank you for helping improve MapLibre guidance for AI assistants and developers.
