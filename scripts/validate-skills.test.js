import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FOOTER, validateSkill } from './validate-skills.js';

function skill({
  frontmatter = 'name: maplibre-x\ndescription: X. Use when testing.\nmetadata:\n  status: verified',
  body = `# X\n\nContent.\n\n${FOOTER}\n`
} = {}) {
  return `---\n${frontmatter}\n---\n\n${body}`;
}

describe('validateSkill', () => {
  it('accepts a skill that follows the spec and the repo rules', () => {
    assert.deepEqual(validateSkill('maplibre-x', skill()), []);
  });

  it('rejects a top-level key the spec does not allow', () => {
    const errors = validateSkill(
      'maplibre-x',
      skill({
        frontmatter:
          'name: maplibre-x\ndescription: X. Use when testing.\nstatus: verified'
      })
    );
    assert.match(errors[0], /outside the spec: status/);
    assert.match(errors[1], /metadata\.status must be one of/);
  });

  it('rejects a name that breaks the format or differs from the directory', () => {
    const errors = validateSkill(
      'maplibre-x',
      skill({
        frontmatter:
          'name: MapLibre--X\ndescription: X. Use when testing.\nmetadata:\n  status: verified'
      })
    );
    assert.equal(errors.length, 2);
    assert.match(errors[0], /lowercase letters and digits/);
    assert.match(errors[1], /name mismatch/);
  });

  it('rejects a description over 1024 characters', () => {
    const errors = validateSkill(
      'maplibre-x',
      skill({
        frontmatter: `name: maplibre-x\ndescription: ${'x'.repeat(1025)}\nmetadata:\n  status: verified`
      })
    );
    assert.deepEqual(errors, [
      'description is 1025 characters; the spec allows 1024'
    ]);
  });

  it('rejects a compatibility string over 500 characters', () => {
    const errors = validateSkill(
      'maplibre-x',
      skill({
        frontmatter: `name: maplibre-x\ndescription: X. Use when testing.\ncompatibility: ${'x'.repeat(501)}\nmetadata:\n  status: verified`
      })
    );
    assert.deepEqual(errors, [
      'compatibility must be a string of at most 500 characters'
    ]);
  });

  it('rejects a status outside the three this repo uses', () => {
    const errors = validateSkill(
      'maplibre-x',
      skill({
        frontmatter:
          'name: maplibre-x\ndescription: X. Use when testing.\nmetadata:\n  status: done'
      })
    );
    assert.match(
      errors[0],
      /metadata\.status must be one of verified, provisional, process/
    );
  });

  it('rejects a body without the standard footer', () => {
    const errors = validateSkill(
      'maplibre-x',
      skill({ body: '# X\n\nContent.\n' })
    );
    assert.match(errors[0], /standard footer/);
  });

  it('reports front matter that does not parse, or is missing', () => {
    assert.match(
      validateSkill('maplibre-x', '---\nname: [unclosed\n---\n\n# X\n')[0],
      /does not parse/
    );
    assert.match(
      validateSkill('maplibre-x', '# X\n')[0],
      /Missing YAML frontmatter/
    );
  });
});
