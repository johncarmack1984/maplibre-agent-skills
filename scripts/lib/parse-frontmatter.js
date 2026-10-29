import { load } from 'js-yaml';
import { splitFrontmatter } from './frontmatter.js';

/**
 * The parsed front matter and the body after it, or null when the file has
 * no front matter block. Throws on YAML that does not parse.
 */
export function parseFrontmatter(content) {
  const parts = splitFrontmatter(content);
  if (!parts) return null;
  const data = load(parts.yaml);
  return {
    data: data && typeof data === 'object' && !Array.isArray(data) ? data : {},
    body: content.substring(parts.bodyStart)
  };
}
