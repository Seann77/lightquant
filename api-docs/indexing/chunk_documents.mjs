import { sha256, shortId } from './common.mjs';

export function chunkDocument(document, parsed, symbols) {
  const symbolHeadings = new Set(symbols.map((symbol) => symbol.evidence.line_start - 1));
  const boundaries = parsed.headings
    .filter((heading) => heading.level <= 2 || symbolHeadings.has(heading.fileLine))
    .sort((a, b) => a.line - b.line);
  if (!boundaries.length) {
    return createChunk(document, parsed, symbols, 0, parsed.lines.length, document.title, document.section_path, document.source_anchor);
  }
  const chunks = [];
  if (boundaries[0].line > 0) {
    chunks.push(...createChunk(document, parsed, symbols, 0, boundaries[0].line, document.title, document.section_path, document.source_anchor));
  }
  for (let i = 0; i < boundaries.length; i += 1) {
    const heading = boundaries[i];
    const end = boundaries[i + 1]?.line ?? parsed.lines.length;
    chunks.push(...createChunk(document, parsed, symbols, heading.line, end, heading.title, heading.path, heading.anchor || document.source_anchor));
  }
  return chunks;
}

function createChunk(document, parsed, symbols, start, end, title, sectionPath, sourceAnchor) {
  const content = parsed.lines.slice(start, end).join('\n').trim();
  if (!content) return [];
  const fileStart = start + parsed.bodyLineOffset;
  const fileEnd = end + parsed.bodyLineOffset;
  const symbolIds = symbols
    .filter((symbol) => symbol.evidence.line_start - 1 >= fileStart && symbol.evidence.line_start - 1 < fileEnd)
    .map((symbol) => symbol.id)
    .sort();
  return [{
    id: shortId('chk', document.id, String(start), String(end), title),
    document_id: document.id,
    platform: document.platform,
    variant: document.variant,
    source_role: document.source_role,
    resolution_priority: document.resolution_priority,
    document_type: document.document_type,
    title,
    heading_path: sectionPath,
    symbol_ids: symbolIds,
    content,
    content_sha256: sha256(content),
    markdown_file: document.markdown_file,
    source_url: document.source_url,
    source_anchor: sourceAnchor || null,
    line_start: start + parsed.bodyLineOffset + 1,
    line_end: end + parsed.bodyLineOffset,
    chunk_index: null,
    previous_chunk_id: null,
    next_chunk_id: null,
    character_count: content.length,
    token_estimate: Math.ceil(content.length / 4),
    contains_code: /^\s*(`{3,}|~{3,})/m.test(content),
    contains_table: /<table\b/i.test(content) || /^\s*\|.+\|\s*$/m.test(content),
    contains_warning: /(?:警告|注意|warning|deprecated|弃用)/i.test(content),
    index_warnings: [],
  }];
}
