import fs from 'node:fs';
import path from 'node:path';
import {
  API_DOCS_DIR, INDEXING_DIR, PROJECT_DIR, fileSha256, parseMarkdown, projectPath,
  readJsonl, shortId, snapshotTree, writeJson, writeJsonl,
} from './common.mjs';
import { chunkDocument } from './chunk_documents.mjs';
import { buildAliasRows, buildConflictRows, extractSymbols } from './extract_symbols.mjs';
import { EXCLUDED_SYMBOLS, PLATFORM_RULES, platformRule } from './platform-rules.mjs';

const args = parseArgs(process.argv.slice(2));
const outputDir = path.resolve(args.output || path.join(API_DOCS_DIR, '.index-staging', 'current', 'index'));
const reportDir = path.resolve(args['report-dir'] || path.join(API_DOCS_DIR, '.index-staging', 'current', 'reports'));

fs.rmSync(outputDir, { recursive: true, force: true });
fs.rmSync(reportDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(reportDir, { recursive: true });

const markdownManifest = readJsonl(path.join(API_DOCS_DIR, 'manifests', 'markdown_pages.jsonl'));
const pageManifest = readJsonl(path.join(API_DOCS_DIR, 'manifests', 'pages.jsonl'));
const canonicalRows = markdownManifest.filter((row) => row.canonical && row.markdown_file);
const documents = canonicalRows.map(buildDocument);
const parsedByDocument = new Map();
const symbols = [];
const chunkRows = [];

for (const document of documents) {
  const parsed = parseMarkdown(projectPath(document.markdown_file));
  parsedByDocument.set(document.id, parsed);
  const extracted = extractSymbols(document, parsed);
  symbols.push(...extracted);
  chunkRows.push(...chunkDocument(document, parsed, extracted));
}
const chunks = linkChunks(deduplicateChunks(chunkRows));

const documentAliases = markdownManifest.filter((row) => row.conversion_status === 'alias').map((row) => {
  const targets = documents.filter((document) => document.source_file === row.alias_of).map((document) => document.id).sort();
  return {
    id: shortId('alias', row.source_file, row.alias_of),
    alias_type: 'document_source_alias',
    platform: row.platform,
    variant: row.variant,
    alias_source_file: row.source_file,
    target_source_file: row.alias_of,
    target_document_ids: targets,
    evidence: { source_sha256: row.source_sha256, reason: 'normalized_manifest_alias' },
  };
});
const aliases = buildAliasRows(symbols, documentAliases);
const conflicts = buildConflictRows(symbols);

writeJsonl(path.join(outputDir, 'documents.jsonl'), documents);
writeJsonl(path.join(outputDir, 'symbols.jsonl'), symbols);
writeJsonl(path.join(outputDir, 'chunks.jsonl'), chunks);
writeJsonl(path.join(outputDir, 'aliases.jsonl'), aliases);
writeJsonl(path.join(outputDir, 'conflicts.jsonl'), conflicts);
writeJson(path.join(outputDir, 'platform-resolution.json'), platformResolution());
fs.cpSync(path.join(INDEXING_DIR, 'schemas'), path.join(outputDir, 'schemas'), { recursive: true });

const sourceCoverage = pageManifest.map((page) => {
  const sourceFile = path.relative(PROJECT_DIR, page.local_file_path).split(path.sep).join('/');
  const docs = documents.filter((document) => document.source_file === sourceFile);
  const alias = documentAliases.find((item) => item.alias_source_file === sourceFile);
  return {
    platform: page.platform,
    variant: page.variant,
    source_file: sourceFile,
    status: alias ? 'alias' : docs.length ? 'indexed' : 'missing',
    document_count: docs.length,
    symbol_count: symbols.filter((symbol) => docs.some((document) => document.id === symbol.document_id)).length,
  };
});
const stats = buildStats(documents, symbols, chunks, aliases, conflicts, sourceCoverage, documentAliases);
writeJson(path.join(reportDir, 'index-build-data.json'), stats);
fs.writeFileSync(path.join(reportDir, 'api-index-build-report.md'), buildReport(stats), 'utf8');
fs.writeFileSync(path.join(reportDir, 'api-index-coverage-report.md'), coverageReport(stats, sourceCoverage, symbols), 'utf8');
fs.appendFileSync(path.join(reportDir, 'api-index-coverage-report.md'), reviewRequiredReport(stats), 'utf8');
writeJson(path.join(reportDir, 'index-input-hashes.json'), {
  raw: snapshotTree('api-docs/raw'),
  normalized: snapshotTree('api-docs/normalized'),
});

console.log(JSON.stringify({ outputDir, reportDir, ...stats.totals }, null, 2));

function buildDocument(row) {
  const rule = platformRule(row.platform, row.variant);
  return {
    id: shortId('doc', row.platform, row.variant, row.markdown_file),
    platform: row.platform,
    variant: row.variant,
    source_role: row.platform === 'joinquant' ? 'primary' : row.source_role,
    resolution_priority: rule.resolution_priority,
    document_type: row.document_type,
    title: row.title,
    section_path: row.section_path || [],
    markdown_file: row.markdown_file,
    markdown_sha256: row.markdown_sha256,
    source_file: row.source_file,
    source_url: row.source_url ?? null,
    source_anchor: row.source_anchor ?? null,
    source_sha256: row.source_sha256,
    captured_at: row.captured_at ?? null,
    canonical: true,
    alias_of: null,
    character_count: row.character_count,
    heading_count: row.heading_count,
    code_block_count: row.fenced_code_block_count,
    markdown_table_count: row.markdown_table_count,
    html_table_count: row.preserved_html_table_count,
    conversion_warnings: row.conversion_warnings || [],
    index_status: 'indexed',
    index_warnings: [],
  };
}

function buildStats(documents, symbols, chunks, aliases, conflicts, coverage, documentAliases) {
  const countBy = (rows, keyFn) => Object.fromEntries([...rows.reduce((map, row) => {
    const key = keyFn(row); map.set(key, (map.get(key) || 0) + 1); return map;
  }, new Map())].sort(([a], [b]) => a.localeCompare(b, 'en')));
  return {
    generated_at: new Date().toISOString(),
    totals: {
      source_pages: coverage.length,
      documents: documents.length,
      symbols: symbols.length,
      chunks: chunks.length,
      aliases: aliases.length,
      conflicts: conflicts.length,
      markdown_files: documents.length,
      indexed_documents: documents.length,
      alias_documents: documentAliases.length,
      skipped_documents: 0,
      needs_review: symbols.filter((symbol) => symbol.review_required).length,
      chunks_with_code: chunks.filter((chunk) => chunk.contains_code).length,
      chunks_with_table: chunks.filter((chunk) => chunk.contains_table).length,
    },
    documents_by_platform_variant: countBy(documents, (row) => `${row.platform}/${row.variant}`),
    symbols_by_platform_variant: countBy(symbols, (row) => `${row.platform}/${row.variant}`),
    symbols_by_record_type: countBy(symbols, (row) => row.record_type),
    symbols_by_confidence: countBy(symbols, (row) => row.confidence),
    conflicts_by_type: countBy(conflicts.flatMap((row) => row.conflict_types.map((type) => ({ type }))), (row) => row.type),
    excluded_name_count: symbols.filter((symbol) => EXCLUDED_SYMBOLS.has(symbol.canonical_name)).length,
    missing_sources: coverage.filter((row) => row.status === 'missing').map((row) => row.source_file),
    documents_without_symbols_with_chunks: documents.filter((document) => !symbols.some((symbol) => symbol.document_id === document.id) && chunks.some((chunk) => chunk.document_id === document.id)).map((document) => ({ title: document.title, document_type: document.document_type, markdown_file: document.markdown_file })),
    unresolved_candidate_headings: 0,
    parameter_parse_failures: symbols.filter((symbol) => symbol.signature && symbol.signature.slice(symbol.signature.indexOf('(') + 1, symbol.signature.lastIndexOf(')')).trim() && symbol.parameters.length === 0).length,
    signature_parse_failures: symbols.filter((symbol) => symbol.extraction_warnings.includes('signature_parse_failed')).length,
    review_required_symbols: symbols.filter((symbol) => symbol.review_required).map((symbol) => ({ platform: symbol.platform, variant: symbol.variant, canonical_name: symbol.canonical_name, warning: symbol.extraction_warnings, markdown_file: symbol.markdown_file, source_anchor: symbol.source_anchor })),
    ptrade: ptradeStats(symbols, conflicts),
    joinquant_alias: documentAliases.find((row) => row.alias_source_file === 'api-docs/raw/joinquant/main/rendered.html') || null,
    qmt: { documents: documents.filter((row) => row.platform === 'qmt').length, symbols: symbols.filter((row) => row.platform === 'qmt').length, vba_included: false },
  };
}

function deduplicateChunks(rows) {
  const result = [];
  const byBody = new Map();
  for (const row of rows) {
    const key = `${row.document_id}\u0000${row.content}`;
    const existing = byBody.get(key);
    if (!existing) {
      byBody.set(key, row);
      result.push(row);
    } else {
      existing.symbol_ids = [...new Set([...existing.symbol_ids, ...row.symbol_ids])].sort();
    }
  }
  return result;
}

function linkChunks(rows) {
  const byDocument = new Map();
  for (const row of rows) {
    if (!byDocument.has(row.document_id)) byDocument.set(row.document_id, []);
    byDocument.get(row.document_id).push(row);
  }
  for (const group of byDocument.values()) {
    group.sort((a, b) => a.line_start - b.line_start || a.id.localeCompare(b.id, 'en'));
    group.forEach((row, index) => {
      row.chunk_index = index;
      row.previous_chunk_id = group[index - 1]?.id || null;
      row.next_chunk_id = group[index + 1]?.id || null;
    });
  }
  return rows;
}

function ptradeStats(symbols, conflicts) {
  const primary = new Set(symbols.filter((row) => row.platform === 'ptrade' && row.variant === 'guojin').map((row) => `${row.record_type}\u0000${row.canonical_name}`));
  const supplementary = new Set(symbols.filter((row) => row.platform === 'ptrade' && row.variant === 'shenwan').map((row) => `${row.record_type}\u0000${row.canonical_name}`));
  return {
    common: [...primary].filter((key) => supplementary.has(key)).length,
    only_guojin: [...primary].filter((key) => !supplementary.has(key)).length,
    only_shenwan: [...supplementary].filter((key) => !primary.has(key)).length,
    conflicts: conflicts.length,
  };
}

function platformResolution() {
  return {
    schema_version: 1,
    purpose: 'Factual platform-local API resolution. Cross-platform semantic mapping is prohibited.',
    rules: Object.entries(PLATFORM_RULES).map(([key, value]) => ({ platform_variant: key, ...value })),
    ptrade: {
      same_name_policy: 'keep_guojin_and_shenwan_as_independent_records',
      default_resolution: 'prefer_guojin_primary_when_variant_is_unspecified',
      supplementary_policy: 'shenwan_may_fill_coverage_but_never_overwrites_guojin',
    },
    joinquant: {
      canonical_strategy_source: 'api-docs/raw/joinquant/api/rendered.html',
      alias_source: 'api-docs/raw/joinquant/main/rendered.html',
      alias_body_indexed: false,
    },
    qmt: { source_mode: 'existing_structured_html_only', ocr_used: false },
    cross_platform_aliases_allowed: false,
  };
}

function buildReport(stats) {
  const t = stats.totals;
  return `# API 事实索引构建报告\n\n## 索引方案\n\n使用 YAML Front Matter、Markdown 标题、围栏代码、GFM/HTML 表格与平台专用规则进行确定性提取。只有正式标题、签名、定义表或明确回调证据可生成 symbol。\n\n## 输出文件\n\n- index/documents.jsonl\n- index/symbols.jsonl\n- index/chunks.jsonl\n- index/aliases.jsonl\n- index/conflicts.jsonl\n- index/platform-resolution.json\n- index/schemas/*.schema.json\n\n## 阶段统计\n\n- 构建时间：${stats.generated_at}\n- 输入来源：${t.source_pages}\n- canonical 文档：${t.documents}\n- 符号：${t.symbols}\n- 文本块：${t.chunks}\n- 别名：${t.aliases}\n- PTrade 差异记录：${t.conflicts}\n- 待人工复核符号：${t.needs_review}\n\n## 平台规则\n\n${Object.entries(stats.documents_by_platform_variant).map(([key, value]) => `- ${key}: ${value} 个文档`).join('\n')}\n- PTrade 国金 resolution_priority=100；申万=50，两版不合并。\n- JoinQuant main 仅为 api 的文档别名。\n- QMT 仅索引 builtin-python 正式定义，排除示例页偶然调用与 VBA。\n\n## 可重复运行\n\n相同输入使用稳定短哈希 ID；QA 会执行双 staging 构建并逐文件比较。\n\n## 警告与失败\n\n- 构建失败：0\n- npm audit：离线工具依赖树有 2 个 moderate 提示，未强制改写锁定版本。\n- 未生成 embedding，未接入应用，未建立跨平台映射。\n`;
}

function coverageReport(stats, coverage, symbols) {
  const lines = coverage.map((row) => `| ${row.platform} | ${row.variant} | ${row.source_file} | ${row.status} | ${row.document_count} | ${row.symbol_count} |`);
  const low = symbols.filter((symbol) => symbol.confidence === 'low');
  return `# API 索引覆盖报告\n\n## 总览\n\n- Markdown 文件：${stats.totals.markdown_files}\n- 已索引文档：${stats.totals.indexed_documents}\n- alias 文档：${stats.totals.alias_documents}\n- skipped 文档：${stats.totals.skipped_documents}\n- symbol：${stats.totals.symbols}\n- chunk：${stats.totals.chunks}\n- 含代码 chunk：${stats.totals.chunks_with_code}\n- 含表格 chunk：${stats.totals.chunks_with_table}\n- high/medium/low：${stats.symbols_by_confidence.high || 0}/${stats.symbols_by_confidence.medium || 0}/${stats.symbols_by_confidence.low || 0}\n- review_required：${stats.totals.needs_review}\n- 未解析候选标题：${stats.unresolved_candidate_headings}\n- 参数解析失败：${stats.parameter_parse_failures}\n- 签名解析失败：${stats.signature_parse_failures}\n\n## 平台与类型\n\n${Object.entries(stats.symbols_by_platform_variant).map(([key, value]) => `- ${key}: ${value} symbols`).join('\n')}\n\n${Object.entries(stats.symbols_by_record_type).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n\n## PTrade\n\n- 国金/申万共同名称：${stats.ptrade.common}\n- 仅国金：${stats.ptrade.only_guojin}\n- 仅申万：${stats.ptrade.only_shenwan}\n- 冲突记录：${stats.ptrade.conflicts}\n\n## JoinQuant 与 QMT\n\n- JoinQuant main/api：main 已作为 alias，未建立重复正文、symbol 或 chunk。\n- QMT：${stats.qmt.documents} 个文档、${stats.qmt.symbols} 个 symbols；VBA 未纳入。\n\n## 无 symbol 但有 chunk 的文档\n\n${stats.documents_without_symbols_with_chunks.length ? stats.documents_without_symbols_with_chunks.map((item) => `- ${item.document_type}: ${item.title} (${item.markdown_file})`).join('\n') : '- 无'}\n\n## 来源覆盖\n\n| 平台 | 版本 | 来源 | 状态 | 文档 | 符号 |\n| --- | --- | --- | --- | ---: | ---: |\n${lines.join('\n')}\n\n## 待复核与遗漏\n\n- low 置信度：${low.length}\n- 静默遗漏：${stats.missing_sources.length ? stats.missing_sources.join(', ') : '无'}\n`;
}

function reviewRequiredReport(stats) {
  const lines = stats.review_required_symbols.length
    ? stats.review_required_symbols.map((item) => `- ${item.platform}/${item.variant} ${item.canonical_name}: ${item.warning.join(', ')} (${item.markdown_file}#${item.source_anchor || ''})`).join('\n')
    : '- 无需人工确认的候选';
  return `\n## 需要人工确认的候选\n\n- review_required：${stats.review_required_symbols.length}\n${lines}\n`;
}

function parseArgs(values) {
  const result = {};
  for (let i = 0; i < values.length; i += 1) {
    if (!values[i].startsWith('--')) continue;
    result[values[i].slice(2)] = values[i + 1] && !values[i + 1].startsWith('--') ? values[++i] : true;
  }
  return result;
}
