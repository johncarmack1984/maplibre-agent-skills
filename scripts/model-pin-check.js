#!/usr/bin/env node
/**
 * Scans tracked files for provider-id-shaped strings and fails on any that isn't one
 * of the two pinned models. Reads the pins from their source of truth —
 * evals/prompts/lib/providers.yaml (generator) and the `eval:graded` script in
 * package.json (judge) — so rotating a pin there is the only edit; this script
 * just finds what didn't get updated to match.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const EXCLUDED_PATHS = [/^evals\/results\//, /^CHANGELOG\.md$/];

const PROVIDER_PREFIXES = [
  'cerebras',
  'google',
  'openai',
  'anthropic',
  'groq',
  'ollama',
  'openrouter',
  'azure',
  'mistral',
  'cohere',
  'replicate',
  'huggingface',
  'bedrock',
  'vertex',
  'deepseek',
  'together',
  'xai',
  'perplexity'
];
const ID_PATTERN = new RegExp(
  `\\b(?:${PROVIDER_PREFIXES.join('|')}):[a-zA-Z0-9._/-]+`,
  'g'
);

const providersFileContent = readFileSync(
  'evals/prompts/lib/providers.yaml',
  'utf8'
);
const generatorMatch = providersFileContent.match(/^id:\s*(\S+)/m);
if (!generatorMatch) {
  console.error(
    '❌ Could not find a top-level "id:" field in evals/prompts/lib/providers.yaml'
  );
  process.exit(1);
}
const generatorPin = generatorMatch[1];

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const graderMatch =
  packageJson.scripts?.['eval:graded']?.match(/--grader\s+(\S+)/);
if (!graderMatch) {
  console.error(
    '❌ Could not find "--grader <id>" in the eval:graded script in package.json'
  );
  process.exit(1);
}
const judgePin = graderMatch[1];

const pinnedIds = new Set([generatorPin, judgePin]);

const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((file) => !EXCLUDED_PATHS.some((pattern) => pattern.test(file)));

let errors = 0;

for (const file of trackedFiles) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue; // binary or unreadable — not a doc mention
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const match of lines[i].matchAll(ID_PATTERN)) {
      if (!pinnedIds.has(match[0])) {
        console.error(`${file}:${i + 1}: stale provider id "${match[0]}"`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(
    `\n${errors} stale provider id(s). Pinned: ${[...pinnedIds].join(', ')}.`
  );
  process.exit(1);
}

console.log(
  `✅ All provider ids match the pins (${[...pinnedIds].join(', ')})`
);
