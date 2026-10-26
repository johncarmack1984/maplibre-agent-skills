import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Every package a file imports, following its imports of this repo's files.
function packagesImported(file, seen = new Set()) {
  if (seen.has(file)) return [];
  seen.add(file);
  const found = [];
  const source = readFileSync(file, 'utf8');
  for (const [, spec] of source.matchAll(
    /^\s*(?:import|export)\s[^;]*?\sfrom\s+['"]([^'"]+)['"]/gm
  )) {
    if (spec.startsWith('.')) {
      found.push(...packagesImported(resolve(dirname(file), spec), seen));
    } else if (!spec.startsWith('node:')) {
      found.push(`${relative(root, file)} imports ${spec}`);
    }
  }
  return found;
}

describe('the eval publish job', () => {
  // It holds the repo's write token and installs no packages, so a script it
  // runs that imports one fails there.
  it('runs only scripts that import no package', () => {
    const workflow = readFileSync(
      join(root, '.github/workflows/eval.yml'),
      'utf8'
    );
    const publish = workflow.slice(workflow.indexOf('\n  publish:'));
    const scripts = [...publish.matchAll(/node (scripts\/[\w./-]+\.js)/g)].map(
      ([, script]) => script
    );
    assert.ok(scripts.length > 0, 'no node scripts found in the publish job');
    for (const script of scripts) {
      assert.deepEqual(packagesImported(join(root, script)), [], script);
    }
  });
});
