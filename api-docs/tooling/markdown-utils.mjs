import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export function sha256Buffer(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function sha256File(file) {
  return sha256Buffer(fs.readFileSync(file));
}

export function shortHash(value, length = 8) {
  return sha256Buffer(String(value)).slice(0, length);
}

export function stableSlug(value, fallback = 'section') {
  const source = String(value || '').normalize('NFKC').toLowerCase();
  const ascii = source
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  if (ascii && /[a-z0-9]/.test(ascii)) return ascii.slice(0, 100);
  return `${fallback}-${shortHash(source || fallback)}`;
}

export function githubHeadingSlug(value) {
  return String(value || '')
    .trim().toLowerCase()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '')
    .replace(/\s+/g, '-');
}

export function inferLanguage(classText, code) {
  const match = String(classText || '').match(/(?:language-|lang-)([\w+-]+)/i);
  if (match) {
    const lang = match[1].toLowerCase();
    if (lang === 'py') return 'python';
    if (lang === 'js') return 'javascript';
    if (lang === 'shell' || lang === 'bash' || lang === 'sh') return 'bash';
    return lang;
  }
  const text = String(code || '').trim();
  if (/^[\[{][\s\S]*[\]}]$/.test(text) && /"[^"\n]+"\s*:/.test(text)) return 'json';
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|FROM|WHERE)\b/i.test(text)) return 'sql';
  if (/^(?:from\s+\S+\s+import|import\s+\S+|def\s+\w+\s*\(|class\s+\w+|#\s*coding[:=])/m.test(text)) return 'python';
  return '';
}

export function fencedCode(code, language = '') {
  const normalized = String(code || '').replace(/\r\n?/g, '\n');
  const runs = [...normalized.matchAll(/`+/g)].map((match) => match[0].length);
  const fence = '`'.repeat(Math.max(3, (runs.length ? Math.max(...runs) : 0) + 1));
  return `\n\n${fence}${language}\n${normalized}${normalized.endsWith('\n') ? '' : '\n'}${fence}\n\n`;
}

export function frontMatter(metadata) {
  const body = yaml.dump(metadata, {
    noRefs: true,
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
    sortKeys: false,
  }).trimEnd();
  return `---\n${body}\n---\n\n`;
}

export function normalizeMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let fence = null;
  let blankRun = 0;
  for (let line of lines) {
    const match = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (!fence && match) {
      line = line.replace(/[ \t]+$/, '');
      output.push(line);
      fence = match[1];
      blankRun = 0;
      continue;
    }
    if (fence) {
      if (match && match[1][0] === fence[0] && match[1].length >= fence.length) {
        output.push(line.replace(/[ \t]+$/, ''));
        fence = null;
      } else {
        output.push(line);
      }
      continue;
    }
    line = line.replace(/[ \t]+$/, '');
    if (!line) {
      blankRun += 1;
      if (blankRun <= 2) output.push('');
    } else {
      blankRun = 0;
      output.push(line);
    }
  }
  while (output.length && !output[0]) output.shift();
  while (output.length && !output.at(-1)) output.pop();
  return `${output.join('\n')}\n`;
}

export function semanticText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[\u200b-\u200f\ufeff]/g, '');
}

export function textSimilarity(left, right) {
  const a = semanticText(left);
  const b = semanticText(right);
  if (a === b) return 1;
  if (!a || !b) return 0;
  const width = 12;
  const shingles = (text) => {
    const result = new Set();
    for (let i = 0; i <= Math.max(0, text.length - width); i += width) {
      result.add(text.slice(i, i + width));
    }
    return result;
  };
  const sa = shingles(a);
  const sb = shingles(b);
  let intersection = 0;
  for (const item of sa) if (sb.has(item)) intersection += 1;
  return intersection / Math.max(sa.size, sb.size);
}

export function markdownStats(markdown) {
  const text = String(markdown || '');
  return {
    character_count: text.length,
    heading_count: (text.match(/^#{1,6}\s+\S/gm) || []).length,
    fenced_code_block_count: Math.floor((text.match(/^`{3,}[^`]*$/gm) || []).length / 2),
    markdown_table_count: (text.match(/^\|(?:\s*:?-+:?\s*\|)+\s*$/gm) || []).length,
    preserved_html_table_count: (text.match(/<table(?:\s|>)/gi) || []).length,
    image_count: (text.match(/!\[[^\]]*\]\([^\n)]+\)/g) || []).length,
  };
}

export function walkFiles(root, predicate = () => true) {
  if (!fs.existsSync(root)) return [];
  const result = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...walkFiles(file, predicate));
    else if (predicate(file)) result.push(file);
  }
  return result;
}

export function projectRelative(projectRoot, file) {
  return path.relative(projectRoot, file).split(path.sep).join('/');
}
