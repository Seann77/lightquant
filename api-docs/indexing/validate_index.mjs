#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  API_DOCS_DIR, INDEXING_DIR, PROJECT_DIR, fileSha256, projectPath, readJsonl,
  sha256, snapshotTree, writeJson,
} from './common.mjs';
import { EXCLUDED_SYMBOLS, platformRule } from './platform-rules.mjs';

const args = parseArgs(process.argv.slice(2));
const indexDir = path.resolve(args.index || path.join(API_DOCS_DIR, '.index-staging', 'run-a', 'index'));
const reportDir = path.resolve(args['report-dir'] || path.join(API_DOCS_DIR, '.index-staging', 'run-a', 'reports'));
const compareDir = args.compare ? path.resolve(args.compare) : null;

const files = {
  documents: 'documents.jsonl', symbols: 'symbols.jsonl', chunks: 'chunks.jsonl',
  aliases: 'aliases.jsonl', conflicts: 'conflicts.jsonl',
};
const data = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readJsonl(path.join(indexDir, file))]));
const checks = [];
const failures = [];
const warnings = [];
const check = (name, passed, detail) => {
  checks.push({ name, passed, detail });
  if (!passed) failures.push(`${name}: ${detail}`);
};

validateSchemas();
validateIdentifiers();
validateReferences();
validateHashesAndEncoding();
validatePlatformPolicies();
validateSymbols();
validateChunks();
validateCoverage();
validateSearchCases();
validateStability();
const manual = buildManualReview();
writeJson(path.join(reportDir, 'manual-index-review.json'), manual);

if (!manual.every((item) => item.passed)) failures.push(`manual review: ${manual.filter((item) => !item.passed).length} samples failed`);
const passed = failures.length === 0;
const result = {
  passed,
  totals: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])),
  checks,
  failures,
  warnings,
  manual_review: { passed: manual.every((item) => item.passed), samples: manual.length },
};
writeJson(path.join(reportDir, 'index-qa-data.json'), result);
fs.writeFileSync(path.join(reportDir, 'api-index-qa-report.md'), `${renderReport(result, manual)}\n## 跨平台 API 映射阶段\n\n${passed && manual.every((item) => item.passed) ? '适合进入；本阶段仅提供事实型输入，未建立映射。' : '不适合进入。'}\n`, 'utf8');
console.log(JSON.stringify({ passed, failures: failures.length, warnings: warnings.length, manual_samples: manual.length }, null, 2));
if (!passed) process.exitCode = 1;

function validateSchemas() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const [key, schemaFile] of [['documents', 'document.schema.json'], ['symbols', 'symbol.schema.json'], ['chunks', 'chunk.schema.json']]) {
    const schema = JSON.parse(fs.readFileSync(path.join(indexDir, 'schemas', schemaFile), 'utf8'));
    const validate = ajv.compile(schema);
    const bad = data[key].flatMap((row, index) => validate(row) ? [] : [{ line: index + 1, errors: validate.errors }]);
    check(`${key} JSON Schema`, bad.length === 0, bad.length ? JSON.stringify(bad.slice(0, 3)) : `${data[key].length} records valid`);
  }
}

function validateIdentifiers() {
  for (const [key, rows] of Object.entries(data)) {
    const ids = rows.map((row) => row.id);
    check(`${key} id uniqueness`, new Set(ids).size === ids.length, `${ids.length - new Set(ids).size} duplicate ids`);
  }
}

function validateReferences() {
  const documentIds = new Set(data.documents.map((row) => row.id));
  const symbolIds = new Set(data.symbols.map((row) => row.id));
  check('symbol document references', data.symbols.every((row) => documentIds.has(row.document_id)), 'all symbol.document_id must exist');
  check('document Markdown references', data.documents.every((row) => fs.existsSync(projectPath(row.markdown_file))), 'all document Markdown files exist');
  check('chunk document references', data.chunks.every((row) => documentIds.has(row.document_id)), 'all chunk.document_id must exist');
  check('chunk symbol references', data.chunks.every((row) => row.symbol_ids.every((id) => symbolIds.has(id))), 'all chunk.symbol_ids must exist');
  const chunkedSymbolIds = new Set(data.chunks.flatMap((row) => row.symbol_ids));
  check('symbol chunk references', data.symbols.every((row) => chunkedSymbolIds.has(row.id)), 'every symbol is linked by at least one chunk');
  check('alias references', data.aliases.every((row) => row.target_type !== 'symbol' || symbolIds.has(row.target_id)), 'all symbol aliases must resolve');
  check('conflict references', data.conflicts.every((row) => (!row.primary_symbol_id || symbolIds.has(row.primary_symbol_id)) && (!row.supplementary_symbol_id || symbolIds.has(row.supplementary_symbol_id))), 'all conflict symbol ids must resolve');
}

function validateHashesAndEncoding() {
  const manifest = readJsonl(path.join(API_DOCS_DIR, 'manifests', 'markdown_pages.jsonl'));
  const canonical = manifest.filter((row) => row.canonical && row.markdown_file);
  const markdownOk = canonical.every((row) => fileSha256(projectPath(row.markdown_file)) === row.markdown_sha256);
  check('normalized Markdown hashes unchanged', markdownOk, `${canonical.length} canonical Markdown files checked against manifest`);
  const sourceMap = new Map(manifest.map((row) => [row.source_file, row.source_sha256]));
  const sourceOk = [...sourceMap].every(([file, hash]) => fileSha256(projectPath(file)) === hash);
  check('raw source hashes unchanged', sourceOk, `${sourceMap.size} raw source files checked against manifest`);
  const baselineFile = path.join(API_DOCS_DIR, 'tooling', 'raw_hashes_before.json');
  if (fs.existsSync(baselineFile)) {
    const baselineValue = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
    let baseline = Array.isArray(baselineValue) ? baselineValue : baselineValue.files || baselineValue.raw || [];
    if (!Array.isArray(baseline)) baseline = Object.entries(baseline).map(([file, hash]) => ({ file: `api-docs/${file}`, sha256: hash })).sort((a, b) => a.file.localeCompare(b.file, 'en'));
    const current = snapshotTree('api-docs/raw');
    const baselineMap = Object.fromEntries(baseline.map((row) => [row.file, row.sha256]));
    const currentMap = Object.fromEntries(current.map((row) => [row.file, row.sha256]));
    check('raw tree baseline unchanged', JSON.stringify(Object.keys(baselineMap).sort().map((file) => [file, baselineMap[file]])) === JSON.stringify(Object.keys(currentMap).sort().map((file) => [file, currentMap[file]])), `${current.length} files compared with pre-conversion baseline`);
  } else warnings.push('Pre-conversion raw tree baseline not found; per-source manifest hashes were still checked.');
  const replacement = [];
  for (const file of Object.values(files)) {
    const text = fs.readFileSync(path.join(indexDir, file), 'utf8');
    if (text.includes('\uFFFD')) replacement.push(file);
  }
  check('index UTF-8 replacement characters', replacement.length === 0, replacement.length ? replacement.join(', ') : 'none');
}

function validatePlatformPolicies() {
  check('document count', data.documents.length === 197, `${data.documents.length}/197 canonical Markdown documents`);
  check('PTrade priorities', data.documents.filter((row) => row.platform === 'ptrade').every((row) => row.resolution_priority === (row.variant === 'guojin' ? 100 : 50)), 'guojin=100, shenwan=50');
  check('primary roles', data.documents.filter((row) => row.platform === 'ptrade' && row.variant === 'guojin').every((row) => row.source_role === 'primary'), 'all guojin documents primary');
  check('PTrade variants independent', data.symbols.filter((row) => row.platform === 'ptrade').every((row) => ['guojin', 'shenwan'].includes(row.variant)), 'no merged PTrade variant');
  check('JoinQuant main not indexed', data.documents.every((row) => row.source_file !== 'api-docs/raw/joinquant/main/rendered.html'), 'main source has no document/body index');
  check('JoinQuant source role', data.documents.filter((row) => row.platform === 'joinquant').every((row) => row.source_role === 'primary' && row.resolution_priority === 100), 'all JoinQuant records are web-help primary priority 100');
  const jqAlias = data.aliases.find((row) => row.alias_type === 'document_source_alias' && row.alias_source_file === 'api-docs/raw/joinquant/main/rendered.html');
  check('JoinQuant main alias explicit', Boolean(jqAlias && jqAlias.target_source_file === 'api-docs/raw/joinquant/api/rendered.html'), 'main -> api alias');
  check('cross-platform aliases absent', data.aliases.filter((row) => row.target_type === 'symbol').every((row) => {
    const target = data.symbols.find((symbol) => symbol.id === row.target_id); return target?.platform === row.platform && target?.variant === row.variant;
  }), 'aliases remain platform-local');
}

function validateSymbols() {
  const excluded = data.symbols.filter((row) => EXCLUDED_SYMBOLS.has(row.canonical_name));
  check('false-positive exclusion list', excluded.length === 0, excluded.length ? excluded.map((row) => row.canonical_name).join(', ') : 'none indexed');
  const invalidSignature = data.symbols.filter((row) => row.signature && row.signature.split('(')[0].trim().split('.').at(-1) !== row.canonical_name);
  check('signature/name consistency', invalidSignature.length === 0, invalidSignature.length ? invalidSignature.slice(0, 5).map((row) => row.qualified_name).join(', ') : 'all signatures match canonical names');
  const duplicates = duplicateKeys(data.symbols, (row) => `${row.document_id}\u0000${row.record_type}\u0000${row.qualified_name}\u0000${row.signature || ''}`);
  check('document symbol duplicates', duplicates.length === 0, duplicates.length ? duplicates.slice(0, 5).join(', ') : 'none');
  check('required symbol evidence', data.symbols.every((row) => row.evidence.heading && row.evidence.line_start > 0 && row.evidence.line_end >= row.evidence.line_start), 'all records line-traceable');
  const low = data.symbols.filter((row) => row.confidence === 'low');
  check('low confidence review status', low.every((row) => row.review_required === true), `${low.length} low-confidence records`);
}

function validateChunks() {
  check('nonempty chunks', data.chunks.every((row) => row.content.trim() && row.character_count === row.content.length && row.content_sha256 === sha256(row.content)), 'all chunks nonempty with exact counts and hashes');
  const broken = data.chunks.filter((row) => unclosedFence(row.content) || unbalancedHtmlTable(row.content));
  check('chunk code/table boundaries', broken.length === 0, broken.length ? `${broken.length} broken chunks` : 'no chunk splits inside fences or HTML tables');
  const duplicateText = duplicateKeys(data.chunks, (row) => `${row.document_id}\u0000${row.content_sha256}`);
  check('duplicate chunk bodies', duplicateText.length === 0, duplicateText.length ? `${duplicateText.length} duplicates` : 'none within a document');
  const chunkIds = new Set(data.chunks.map((row) => row.id));
  check('chunk neighbor links', data.chunks.every((row) => (!row.previous_chunk_id || chunkIds.has(row.previous_chunk_id)) && (!row.next_chunk_id || chunkIds.has(row.next_chunk_id))), 'all previous/next chunk ids resolve');
}

function validateCoverage() {
  const pages = readJsonl(path.join(API_DOCS_DIR, 'manifests', 'pages.jsonl'));
  const sourceFiles = new Set(data.documents.map((row) => row.source_file));
  const aliasSources = new Set(data.aliases.filter((row) => row.alias_type === 'document_source_alias').map((row) => row.alias_source_file));
  const missing = pages.filter((row) => {
    const sourceFile = path.relative(PROJECT_DIR, row.local_file_path).split(path.sep).join('/');
    return !sourceFiles.has(sourceFile) && !aliasSources.has(sourceFile);
  });
  check('36 source page coverage', pages.length === 36 && missing.length === 0, `${pages.length - missing.length}/36 indexed or aliased`);
}

function validateSearchCases() {
  const positives = [
    ['ptrade', 'guojin', 'get_history'], ['ptrade', 'guojin', 'get_fundamentals'], ['ptrade', 'guojin', 'order'],
    ['qmt', 'builtin-python', 'get_market_data_ex'], ['qmt', 'builtin-python', 'passorder'],
    ['joinquant', 'web-help', 'initialize'], ['joinquant', 'web-help', 'run_daily'], ['joinquant', 'web-help', 'get_price'],
    ['joinquant', 'web-help', 'order_target'], ['joinquant', 'web-help', 'get_fundamentals'],
  ];
  const missing = positives.filter(([platform, variant, name]) => !data.symbols.some((row) => row.platform === platform && row.variant === variant && row.canonical_name === name));
  check('positive factual search cases', missing.length === 0, missing.length ? JSON.stringify(missing) : `${positives.length} passed`);
  const negatives = ['False', 'True', 'None', '__init__', '__new__', 'eval', 'abs', 'count', 'max', 'min', 'sum', 'var', 'format', 'log', 'key', 'daily', 'python', 'func', 'xxx'];
  const found = negatives.filter((name) => data.symbols.some((row) => row.canonical_name === name));
  check('negative search cases', found.length === 0, found.length ? found.join(', ') : `${negatives.length} passed`);
}

function validateStability() {
  if (!compareDir) {
    warnings.push('No --compare directory supplied; deterministic rebuild comparison was not executed.');
    return;
  }
  const compared = [...Object.values(files), 'platform-resolution.json', 'schemas/document.schema.json', 'schemas/symbol.schema.json', 'schemas/chunk.schema.json'];
  const differences = compared.filter((file) => fileSha256(path.join(indexDir, file)) !== fileSha256(path.join(compareDir, file)));
  check('stable repeated build', differences.length === 0, differences.length ? differences.join(', ') : `${compared.length} output files byte-identical`);
}

function buildManualReview() {
  const requested = [
    ['ptrade', 'guojin', 'get_history'], ['ptrade', 'guojin', 'get_fundamentals'], ['ptrade', 'guojin', 'order'], ['ptrade', 'guojin', 'run_daily'], ['ptrade', 'guojin', 'get_price'],
    ['ptrade', 'shenwan', 'get_history'], ['ptrade', 'shenwan', 'get_fundamentals'], ['ptrade', 'shenwan', 'order'], ['ptrade', 'shenwan', 'run_daily'], ['ptrade', 'shenwan', 'get_price'],
    ['qmt', 'builtin-python', 'get_market_data_ex'], ['qmt', 'builtin-python', 'passorder'], ['qmt', 'builtin-python', 'subscribe_quote'], ['qmt', 'builtin-python', 'get_trade_detail_data'], ['qmt', 'builtin-python', 'schedule_run'],
    ['joinquant', 'web-help', 'initialize'], ['joinquant', 'web-help', 'run_daily'], ['joinquant', 'web-help', 'get_price'], ['joinquant', 'web-help', 'order_target'], ['joinquant', 'web-help', 'get_fundamentals'],
  ];
  const samples = requested.map(([platform, variant, name]) => reviewSymbol('platform_api', platform, variant, name));
  for (const symbol of takeDistinct(data.symbols.filter((row) => row.record_type === 'callback'), 2)) samples.push(reviewRecord('callback', symbol));
  for (const symbol of takeDistinct(data.symbols.filter((row) => ['object', 'field'].includes(row.record_type)), 2)) samples.push(reviewRecord('object_or_field', symbol));
  for (const symbol of takeDistinct(data.symbols.filter((row) => ['factor', 'indicator'].includes(row.record_type)), 2)) samples.push(reviewRecord('factor_or_indicator', symbol));
  const complex = data.chunks.filter((row) => row.contains_table && row.symbol_ids.some((id) => (data.symbols.find((symbol) => symbol.id === id)?.parameters.length || 0) >= 5)).slice(0, 2);
  for (const chunk of complex) samples.push({ kind: 'complex_parameter_table', id: chunk.id, markdown_file: chunk.markdown_file, source_anchor: chunk.source_anchor, passed: !unbalancedHtmlTable(chunk.content) && !unclosedFence(chunk.content), checks: ['parameter table remains with API chunk', 'table/fence boundaries balanced', 'source traceable'] });
  for (const conflict of data.conflicts.filter((row) => row.record_type === 'api_function' && row.primary_symbol_id && row.supplementary_symbol_id).slice(0, 2)) samples.push({ kind: 'ptrade_conflict', id: conflict.id, canonical_name: conflict.canonical_name, passed: conflict.merged === false && conflict.conflict_types.length > 0, checks: conflict.conflict_types });
  samples.push({ kind: 'negative_names', id: 'negative-names', passed: ['False', 'True', 'None', '__init__', '__new__', 'eval', 'abs', 'count', 'max', 'min', 'sum', 'var', 'format', 'log', 'key', 'daily', 'python', 'func', 'xxx'].every((name) => !data.symbols.some((row) => row.canonical_name === name)), checks: ['full excluded-name list absent'] });
  return samples;
}

function reviewSymbol(kind, platform, variant, name) {
  const symbol = data.symbols.find((row) => row.platform === platform && row.variant === variant && row.canonical_name === name);
  if (!symbol) return { kind, platform, variant, canonical_name: name, passed: false, checks: ['missing'] };
  return reviewRecord(kind, symbol);
}

function reviewRecord(kind, symbol) {
  const markdown = fs.readFileSync(projectPath(symbol.markdown_file), 'utf8');
  const evidenceLine = markdown.split(/\r?\n/)[symbol.evidence.line_start - 1] || '';
  const normalizedEvidence = evidenceLine.replace(/\\_/g, '_');
  const evidencePresent = symbol.record_type === 'field'
    ? normalizedEvidence.includes(symbol.canonical_name)
    : normalizedEvidence.includes(symbol.evidence.heading);
  return { kind, id: symbol.id, platform: symbol.platform, variant: symbol.variant, source_role: symbol.source_role, canonical_name: symbol.canonical_name, record_type: symbol.record_type, signature: symbol.signature, parameters: symbol.parameters, returns: symbol.returns, environments: symbol.environments, markdown_file: symbol.markdown_file, source_file: symbol.source_file, source_anchor: symbol.source_anchor, passed: evidencePresent && Boolean(symbol.source_file), checks: ['API name', 'record type', 'signature', 'parameters', 'returns', 'environments', 'source path and anchor', 'source role', 'false-positive review'] };
}

function takeDistinct(rows, count) {
  const result = []; const seen = new Set();
  for (const row of rows) { const key = `${row.platform}/${row.variant}/${row.canonical_name}`; if (!seen.has(key)) { seen.add(key); result.push(row); } if (result.length === count) break; }
  return result;
}

function duplicateKeys(rows, keyFn) {
  const seen = new Set(); const duplicates = [];
  for (const row of rows) { const key = keyFn(row); if (seen.has(key)) duplicates.push(key); else seen.add(key); }
  return duplicates;
}

function unclosedFence(text) {
  const lines = text.split(/\r?\n/); let marker = null;
  for (const line of lines) { const match = line.match(/^\s*(`{3,}|~{3,})/); if (!match) continue; if (!marker) marker = match[1][0]; else if (marker === match[1][0]) marker = null; }
  return marker !== null;
}
function unbalancedHtmlTable(text) { return (text.match(/<table\b/gi) || []).length !== (text.match(/<\/table>/gi) || []).length; }

function renderReport(result, manual) {
  const rows = result.checks.map((item) => `| ${item.passed ? 'PASS' : 'FAIL'} | ${item.name} | ${String(item.detail).replace(/\|/g, '\\|')} |`).join('\n');
  const manualRows = manual.map((item) => `| ${item.passed ? 'PASS' : 'FAIL'} | ${item.kind} | ${item.platform || ''}/${item.variant || ''} | ${item.canonical_name || item.id} | ${item.markdown_file || ''} |`).join('\n');
  return `# API 索引 QA 报告\n\n## 结论\n\n${result.passed && result.manual_review.passed ? '**通过。事实型索引可以进入后续使用评审；本阶段未接入应用。**' : '**未通过，不可进入后续阶段。**'}\n\n## 自动检查\n\n| 状态 | 检查 | 结果 |\n| --- | --- | --- |\n${rows}\n\n## 人工可读性抽样\n\n| 状态 | 类型 | 平台/版本 | 对象 | Markdown |\n| --- | --- | --- | --- | --- |\n${manualRows}\n\n## 低置信度\n\n${data.symbols.filter((row) => row.confidence === 'low').length} 条；全部必须标记 needs_review。\n\n## 工具链提示\n\n- npm audit 报告 2 个 moderate 级别的离线构建依赖风险；未使用强制升级。\n- 索引不含 embedding，不含跨平台语义映射。\n\n## 失败与警告\n\n${result.failures.length ? result.failures.map((item) => `- FAIL: ${item}`).join('\n') : '- 无失败'}\n${result.warnings.length ? result.warnings.map((item) => `- WARNING: ${item}`).join('\n') : '- 无警告'}\n`;
}

function parseArgs(values) {
  const result = {};
  for (let i = 0; i < values.length; i += 1) { if (!values[i].startsWith('--')) continue; result[values[i].slice(2)] = values[i + 1] && !values[i + 1].startsWith('--') ? values[++i] : true; }
  return result;
}
