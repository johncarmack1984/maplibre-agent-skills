/**
 * A skill's YAML front matter. The Agent Skills spec
 * (https://agentskills.io/specification) allows six top-level keys and puts
 * any key of a client's own under `metadata`, so this repo's `status` lives
 * at `metadata.status`.
 *
 * This module imports no package: the scheduled eval's publish job installs
 * none, and it runs sync-skill-status.js. The YAML parser is in
 * parse-frontmatter.js.
 */

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
export function splitFrontmatter(content) {
  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return null;
  return { yaml: content.substring(4, end), bodyStart: end + 5 };
}

export function statusOf(data) {
  const status = data?.metadata?.status;
  return typeof status === 'string' ? status : undefined;
}

// The skills CLI hides a skill whose `metadata.internal` is the boolean true.
export function isInternal(data) {
  return data?.metadata?.internal === true;
}

// The index of the `status:` line inside the `metadata:` block, or -1.
function statusLine(lines) {
  const start = lines.findIndex((line) => /^metadata:[ \t]*$/.test(line));
  if (start === -1) return -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    if (!/^[ \t]/.test(lines[i])) return -1; // the next top-level key
    if (/^[ \t]+status:/.test(lines[i])) return i;
  }
  return -1;
}

/** `metadata.status` read from the text, without a YAML parser. */
export function statusIn(content) {
  const parts = splitFrontmatter(content);
  if (!parts) return undefined;
  const lines = parts.yaml.split('\n');
  const i = statusLine(lines);
  if (i === -1) return undefined;
  return /^[ \t]+status:[ \t]*['"]?([A-Za-z]+)['"]?[ \t]*$/.exec(lines[i])?.[1];
}

/**
 * The file with its `metadata.status` set to `next`, every other byte kept.
 * Edits only that line of the front matter, so a `status:` line in the body or
 * under another key is never touched.
 */
export function withStatus(content, next) {
  const parts = splitFrontmatter(content);
  if (!parts) return content;
  const lines = parts.yaml.split('\n');
  const i = statusLine(lines);
  if (i === -1) return content;
  lines[i] = lines[i].replace(/^([ \t]+status:[ \t]*)\S+/, `$1${next}`);
  return `---\n${lines.join('\n')}\n---\n${content.substring(parts.bodyStart)}`;
}
