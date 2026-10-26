/**
 * A skill's YAML front matter. The Agent Skills spec
 * (https://agentskills.io/specification) allows six top-level keys and puts
 * any key of a client's own under `metadata`, so this repo's `status` lives
 * at `metadata.status`.
 */
import { load } from 'js-yaml';

export const ALLOWED_KEYS = [
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools'
];

export const STATUSES = ['verified', 'provisional', 'process'];

// The YAML between the opening and closing `---`, and where the body starts.
function split(content) {
  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return null;
  return { yaml: content.substring(4, end), bodyStart: end + 5 };
}

/**
 * The parsed front matter and the body after it, or null when the file has
 * no front matter block. Throws on YAML that does not parse.
 */
export function parseFrontmatter(content) {
  const parts = split(content);
  if (!parts) return null;
  const data = load(parts.yaml);
  return {
    data: data && typeof data === 'object' && !Array.isArray(data) ? data : {},
    body: content.substring(parts.bodyStart)
  };
}

export function statusOf(data) {
  const status = data?.metadata?.status;
  return typeof status === 'string' ? status : undefined;
}

// The skills CLI hides a skill whose `metadata.internal` is the boolean true.
export function isInternal(data) {
  return data?.metadata?.internal === true;
}

/**
 * The file with its `metadata.status` set to `next`, every other byte kept.
 * Edits only the front matter, so a `status:` line in the body is never
 * touched.
 */
export function withStatus(content, next) {
  const parts = split(content);
  if (!parts) return content;
  const yaml = parts.yaml.replace(/^([ \t]+status:[ \t]*)\S+/m, `$1${next}`);
  return `---\n${yaml}\n---\n${content.substring(parts.bodyStart)}`;
}
