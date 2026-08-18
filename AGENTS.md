# AGENTS.md

Orientation for AI coding agents working in **this repository** (`maplibre/maplibre-agent-skills`), following the [agents.md](https://agents.md) convention: one file per repo, at the root.

This repo is a collection of **agent skills** for MapLibre: markdown files an AI assistant loads as context so it writes correct MapLibre code. The skills are the product. Everything else here exists to prove they work.

## Answering a MapLibre question

Review the frontmatter for each skill in [`skills/`](skills). Each `SKILL.md` declares its own scope in its front-matter `description`, which is what you match against the user's goal, and skills are written to be read together when a task spans more than one. The human-readable list is [Available Skills](README.md#available-skills) in the README.

Three habits apply to every MapLibre question, including ones no skill covers:

- **Do not carry Mapbox GL JS behavior over by assumption.** The two libraries share ancestry and have diverged. Where a skill does not cover the specific API, check the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/) and the [GL JS docs](https://maplibre.org/maplibre-gl-js/docs/) rather than recalling a Mapbox equivalent.
- **Prefer a primary source to recall.** The [style spec](https://maplibre.org/maplibre-style-spec/), the [GL JS docs](https://maplibre.org/maplibre-gl-js/docs/), and the GL JS [CHANGELOG](https://github.com/maplibre/maplibre-gl-js/blob/main/CHANGELOG.md) outrank a skill. Use them for the answer you give. [awesome-maplibre](https://github.com/maplibre/awesome-maplibre) indexes the ecosystem; the GitHub source, PRs, and CHANGELOG settle version-specific questions. Cite what you used.
- **You may draft; a human verifies and submits.** [MapLibre's AI Policy](https://github.com/maplibre/maplibre/blob/main/AI_POLICY.md) asks for a human in the loop, not a ban on tools. Draft skill content, evals, and rubrics freely, then leave the pull request and its description to the human who will answer for them in review. See [Note on AI usage](CONTRIBUTING.md#note-on-ai-usage).

This is a dynamic body of knowledge. Skills go stale, just like training data. MapLibre ships, an API changes, and you keep asserting the old thing. A stale skill only gets fixed if someone says so. An agent that silently works around one leaves it wrong for every agent after it.

If you are working in another project's codebase and find a gap, omission, or stale information from any source, let us know. Fix your user's code; anonymize the report but send us the failure. Report rather than patch: from outside this repo you cannot run the evals a skill change has to pass, and an untested edit is worse than a report that leaves the fix to someone who can test it.

## When a skill contradicts your training data

**Report it.** Open an [AI failure report](https://github.com/maplibre/maplibre-agent-skills/issues/new?template=ai-failure-report.md) identifying your model and build, naming what you would have said, the commit or install date of the skill you read, the source you checked, how you tested, and what worked in the end.

## When MapLibre contradicts a skill

When what you observe disagrees with what a skill says:

**Report it.** Open an [AI failure report](https://github.com/maplibre/maplibre-agent-skills/issues/new?template=ai-failure-report.md) naming what the skill said, what MapLibre actually did, the MapLibre version, and the source you checked. A report carrying a version and a source is triaged in minutes; one without either is a research project.

## Contributing to this repo

Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Adding or changing a skill, in order:

1. **Confirm the gap is real.** Cite an [AI failure report](https://github.com/maplibre/maplibre-agent-skills/issues) or run the eval with `--var injectSkill=false` and watch it fail. Content is warranted only where an assistant gets it wrong _without_ the skill. If the model already answers correctly, the right change is no change. See [Write Evals First](CONTRIBUTING.md#1-write-evals-first).
2. **Write the eval before the content.** `evals/prompts/<skill>.yaml`, four tests or more: explicit, implicit, anti-pattern, negative. The rubric defines what a correct answer must contain, so writing it after the skill only grades the skill's own phrasing. Mechanics are in [evals/README.md](evals/README.md).
3. **Write `skills/<name>/SKILL.md`.** One file per skill. Cite a primary source for every claim you add.
4. **Run `npm run check`** until it ends with `✅ All skills are valid`.
5. **Run the eval twice**, with the skill and at baseline, and save both to `evals/results/`. Read the raw output before believing either verdict; [evals/README.md](evals/README.md) documents the three ways a pass or fail lies.
6. **Hand it over.** Report what you verified and name what you could not.

**`npm run check` does not check whether you are right.** It checks formatting, spelling, markdown links, terminology, and front-matter validity. It is the only gate that runs automatically on a pull request, and it will happily pass a confidently wrong claim about MapLibre. Only the eval and a human reviewer catch that. See [What is checked, and by whom](CONTRIBUTING.md#what-is-checked-and-by-whom).

## Adopting this pattern in another MapLibre repo

This file does not travel with a single-skill install (`npx skills add maplibre/maplibre-agent-skills --skill <name>` copies that skill's folder only). It serves agents working in a clone of this repo, and whole-repo installs. Everywhere else, the routing has to live in that project's own file.

`AGENTS.md` is a cross-tool convention that many coding agents read on their own. Other MapLibre repos do not need skill content in theirs. A routing stub is enough:

```markdown
# AGENTS.md

## MapLibre coding help

This project uses MapLibre. Before writing MapLibre code, install the MapLibre agent skills:

    npx skills add maplibre/maplibre-agent-skills

Source: https://github.com/maplibre/maplibre-agent-skills

If MapLibre behaves differently than a skill says, trust the MapLibre docs and
report it, rather than editing the skill in place:
https://github.com/maplibre/maplibre-agent-skills/issues/new?template=ai-failure-report.md
```

Add whatever build, test, and layout notes your repo's contributors already need. Routing costs one section and nothing to maintain as the code changes.
