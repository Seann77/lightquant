import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

export const INDEXING_DIR = path.dirname(fileURLToPath(import.meta.url));
export const API_DOCS_DIR = path.resolve(INDEXING_DIR, '..');
export const PROJECT_DIR = path.resolve(API_DOCS_DIR, '..');

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function fileSha256(file) {
  return sha256(fs.readFileSync(file));
}

export function shortId(prefix, ...parts) {
  return `${prefix}:${sha256(parts.join('\u0000')).slice(0, 16)}`;
}

export function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`${file}:${index + 1}: ${error.message}`);
    }
  });
}

export function writeJsonl(file, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sorted = [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id), 'en'));
  fs.writeFileSync(file, `${sorted.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
}

export function stableObject(value) {
  if (Array.isArray(value)) return value.map(stableObject);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableObject(value[key])]));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(stableObject(value), null, 2)}\n`, 'utf8');
}

export function parseMarkdown(file) {
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.startsWith('---\n')) throw new Error(`Missing front matter: ${file}`);
  const end = raw.indexOf('\n---\n', 4);
  if (end < 0) throw new Error(`Unclosed front matter: ${file}`);
  const frontMatter = yaml.load(raw.slice(4, end)) || {};
  const body = raw.slice(end + 5);
  const bodyLineOffset = (raw.slice(0, end + 5).match(/\n/g) || []).length;
  const lines = body.split(/\r?\n/);
  const headings = [];
  const anchors = new Map();
  let pendingAnchor = null;
  let inFence = false;
  let fence = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fence = fenceMatch[1][0];
      } else if (fenceMatch[1][0] === fence) {
        inFence = false;
        fence = null;
      }
      continue;
    }
    if (inFence) continue;
    const anchor = line.match(/^<a\s+id="([^"]+)"\s*><\/a>\s*$/i);
    if (anchor) {
      pendingAnchor = anchor[1];
      continue;
    }
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (match) {
      const heading = {
        level: match[1].length,
        raw: match[2],
        title: cleanMarkdownText(match[2]),
        line: i,
        fileLine: i + bodyLineOffset,
        anchor: pendingAnchor,
      };
      headings.push(heading);
      if (pendingAnchor) anchors.set(pendingAnchor, heading);
      pendingAnchor = null;
    } else if (line.trim()) {
      pendingAnchor = null;
    }
  }
  headings.forEach((heading, index) => {
    let endLine = lines.length;
    for (let i = index + 1; i < headings.length; i += 1) {
      if (headings[i].level <= heading.level) {
        endLine = headings[i].line;
        break;
      }
    }
    heading.endLine = endLine;
    heading.endFileLine = endLine + bodyLineOffset;
    heading.path = headingPath(headings, index);
  });
  return { raw, frontMatter, body, bodyLineOffset, lines, headings, anchors };
}

function headingPath(headings, index) {
  const current = headings[index];
  const result = [];
  let maxLevel = current.level + 1;
  for (let i = index; i >= 0; i -= 1) {
    if (headings[i].level < maxLevel) {
      result.unshift(headings[i].title);
      maxLevel = headings[i].level;
    }
  }
  return result;
}

export function cleanMarkdownText(value) {
  return String(value)
    .replace(/<[^>]+>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\\([_\[\]().#-])/g, '$1')
    .replace(/[`*~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripMarkdown(value) {
  return cleanMarkdownText(String(value)
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<table[\s\S]*?<\/table>/gi, ' '));
}

export function firstParagraph(lines) {
  const result = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || /^\s*(<a\s|#{1,6}\s|\|)/i.test(line)) continue;
    const cleaned = cleanMarkdownText(line.replace(/^[-*+]\s+/, ''));
    if (!cleaned) {
      if (result.length) break;
      continue;
    }
    if (/^(python|md|json|sql)$/i.test(cleaned)) continue;
    result.push(cleaned);
    if (result.join(' ').length >= 320) break;
  }
  return result.join(' ').slice(0, 500) || null;
}

export function snapshotTree(relativeDir, exclude = []) {
  const root = path.join(PROJECT_DIR, relativeDir);
  const rows = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(PROJECT_DIR, full).split(path.sep).join('/');
      if (exclude.some((item) => rel.startsWith(item))) continue;
      if (entry.isDirectory()) walk(full);
      else rows.push({ file: rel, sha256: fileSha256(full) });
    }
  }
  walk(root);
  return rows;
}

export function projectPath(relativeFile) {
  return path.join(PROJECT_DIR, relativeFile);
}

export function relativeProjectPath(file) {
  return path.relative(PROJECT_DIR, file).split(path.sep).join('/');
}

export function extractAnchorBefore(lines, line) {
  for (let i = line - 1; i >= Math.max(0, line - 4); i -= 1) {
    const match = lines[i].match(/^<a\s+id="([^"]+)"/i);
    if (match) return match[1];
    if (lines[i].trim() && !/^\s*$/.test(lines[i])) break;
  }
  return null;
}
