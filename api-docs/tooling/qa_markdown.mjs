#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import * as cheerio from 'cheerio';
import yaml from 'js-yaml';
import { projectRelative, semanticText, sha256File, walkFiles } from './markdown-utils.mjs';

const toolingDir = path.dirname(fileURLToPath(import.meta.url));
const apiDocsRoot = path.dirname(toolingDir);
const projectRoot = path.dirname(apiDocsRoot);
const rawRoot = path.join(apiDocsRoot, 'raw');
const baselineFile = path.join(toolingDir, 'raw_hashes_before.json');
const pagesFile = path.join(apiDocsRoot, 'manifests', 'pages.jsonl');
const lastRunFile = path.join(toolingDir, 'last-run.json');
const manualReviewFile = path.join(toolingDir, 'manual-review.json');
const reportFile = path.join(apiDocsRoot, 'reports', 'markdown-qa-report.md');
const publishRequested = process.argv.includes('--publish');

const run = JSON.parse(fs.readFileSync(lastRunFile, 'utf8'));
const stagingRoot = run.staging_root;
const manifestFile = path.join(stagingRoot, 'manifests', 'markdown_pages.jsonl');
const pages = readJsonLines(pagesFile);
const manifest = readJsonLines(manifestFile);
const markdownRows = manifest.filter((row) => row.markdown_file);
const results = runChecks();
fs.mkdirSync(path.dirname(reportFile), { recursive: true });
fs.writeFileSync(reportFile, qaReport(results), 'utf8');
fs.writeFileSync(path.join(stagingRoot, 'qa-results.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8');

if (publishRequested) {
  if (!results.can_publish) {
    console.error('QA has not passed completely; staging was not published.');
    process.exitCode = 1;
  } else {
    publishStaging();
  }
} else if (!results.automated_pass) {
  process.exitCode = 1;
}

console.log(JSON.stringify({
  automated_pass: results.automated_pass,
  manual_review_complete: results.manual_review.complete,
  can_publish: results.can_publish,
  errors: results.errors.length,
  warnings: results.warnings.length,
  report: reportFile,
}, null, 2));

function readJsonLines(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map(JSON.parse);
}

function sourcePath(page) {
  return projectRelative(projectRoot, page.local_file_path);
}

function stagedMarkdown(row) {
  const prefix = 'api-docs/normalized/';
  if (!row.markdown_file?.startsWith(prefix)) throw new Error(`Unexpected markdown path: ${row.markdown_file}`);
  return path.join(stagingRoot, 'normalized', row.markdown_file.slice(prefix.length));
}

function runChecks() {
  const errors = [];
  const warnings = [];
  const checks = {};

  const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  const currentRaw = Object.fromEntries(walkFiles(rawRoot).map((file) => [projectRelative(apiDocsRoot, file), sha256File(file)]));
  checks.raw_hashes = {
    expected_files: baseline.file_count,
    actual_files: Object.keys(currentRaw).length,
    changed: Object.keys({ ...baseline.files, ...currentRaw }).filter((file) => baseline.files[file] !== currentRaw[file]),
  };
  if (checks.raw_hashes.changed.length) errors.push(`raw hash changed: ${checks.raw_hashes.changed.join(', ')}`);

  const expectedSources = new Set(pages.map(sourcePath));
  const handledSources = new Set(manifest.map((row) => row.source_file));
  checks.source_coverage = {
    expected: expectedSources.size,
    handled: handledSources.size,
    missing: [...expectedSources].filter((file) => !handledSources.has(file)),
    unexpected: [...handledSources].filter((file) => !expectedSources.has(file)),
  };
  if (checks.source_coverage.missing.length || checks.source_coverage.unexpected.length) errors.push('source coverage does not match the 36-page manifest');
  const invalidStatuses = manifest.filter((row) => !['converted', 'split', 'alias', 'skipped_with_reason', 'failed'].includes(row.processing_status));
  if (invalidStatuses.length) errors.push(`${invalidStatuses.length} manifest rows have invalid processing_status`);

  const required = [
    'platform', 'variant', 'source_role', 'document_type', 'title', 'section_path',
    'source_file', 'source_url', 'source_anchor', 'source_sha256', 'captured_at',
    'converter', 'conversion_status', 'conversion_warnings', 'canonical', 'alias_of',
  ];
  const parsedFiles = [];
  const fileNames = new Set();
  const duplicateNames = [];
  let replacementCharacters = 0;
  let mojibakeMarkers = 0;
  let unclosedFences = 0;
  let emptyFiles = 0;
  let metadataErrors = 0;
  let utf8Errors = 0;
  let navResiduals = 0;
  let multilineCodeBlocks = 0;
  let indentedCodeBlocks = 0;
  let markdownTableErrors = 0;
  let htmlTableErrors = 0;
  let missingImages = 0;
  let brokenMarkdownLinks = 0;
  const markdownTableDetails = [];
  const htmlTableDetails = [];
  const missingImageDetails = [];
  const brokenLinkDetails = [];
  let traceabilityErrors = 0;
  let malformedSourceLinks = 0;
  const exactBodies = new Map();
  const duplicateBodies = [];

  for (const row of markdownRows) {
    const file = stagedMarkdown(row);
    const relative = path.relative(path.join(stagingRoot, 'normalized'), file).split(path.sep).join('/');
    if (fileNames.has(relative)) duplicateNames.push(relative);
    fileNames.add(relative);
    if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*\/[a-z0-9-]+\.md$/.test(relative)) {
      errors.push(`non-stable Markdown slug: ${relative}`);
    }
    let text;
    try {
      const buffer = fs.readFileSync(file);
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (error) {
      utf8Errors += 1;
      errors.push(`invalid UTF-8 or unreadable file: ${relative}: ${error.message}`);
      continue;
    }
    replacementCharacters += (text.match(/\uFFFD/g) || []).length;
    mojibakeMarkers += (text.match(/锟斤拷|(?:Ã|Â)[\x80-\xBF]/g) || []).length;
    const parsed = parseMarkdown(text);
    if (!parsed) {
      metadataErrors += 1;
      errors.push(`unparseable front matter: ${relative}`);
      continue;
    }
    parsedFiles.push({ file, relative, row, ...parsed });
    if (required.some((key) => !Object.hasOwn(parsed.metadata, key))) {
      metadataErrors += 1;
      errors.push(`missing required front matter key: ${relative}`);
    }
    if (semanticText(parsed.body).length <= 10) {
      emptyFiles += 1;
      errors.push(`empty Markdown body: ${relative}`);
    }
    if (!fencesClosed(parsed.body)) {
      unclosedFences += 1;
      errors.push(`unclosed code fence: ${relative}`);
    }
    const blocks = codeBlocks(parsed.body);
    for (const block of blocks) {
      if (block.split('\n').length > 2) {
        multilineCodeBlocks += 1;
        if (/^(?: {2,}|\t)\S/m.test(block)) indentedCodeBlocks += 1;
      }
    }
    if (/量化研究平台\s+策略回测\s+模拟列表|首页\s+量化研究平台\s+聚宽社区|Search\s+主题\s+菜单/.test(parsed.body)) navResiduals += 1;
    const tableIssues = validateMarkdownTables(parsed.body);
    markdownTableErrors += tableIssues.length;
    markdownTableDetails.push(...tableIssues.map((issue) => `${relative}:${issue}`));
    const htmlIssues = validateHtmlTables(parsed.body);
    htmlTableErrors += htmlIssues.length;
    htmlTableDetails.push(...htmlIssues.map((issue) => `${relative}:${issue}`));
    const imageIssues = validateImages(parsed.body, file);
    missingImages += imageIssues.length;
    missingImageDetails.push(...imageIssues.map((issue) => `${relative}:${issue}`));
    const compactBody = semanticText(parsed.body);
    malformedSourceLinks += (parsed.body.match(/\]\(["']https?:\/\//g) || []).length;
    const duplicate = exactBodies.get(`${row.platform}/${row.variant}:${compactBody}`);
    if (duplicate) duplicateBodies.push([duplicate, relative]);
    else exactBodies.set(`${row.platform}/${row.variant}:${compactBody}`, relative);
    const sourceFile = path.join(projectRoot, parsed.metadata.source_file || '');
    if (!fs.existsSync(sourceFile) || sha256File(sourceFile) !== parsed.metadata.source_sha256) traceabilityErrors += 1;
  }

  const anchorsByFile = new Map(parsedFiles.map((item) => [item.file, new Set([...item.body.matchAll(/<a id="([^"]+)"><\/a>/g)].map((match) => decodeEntities(match[1])))]));
  for (const item of parsedFiles) {
    const linkIssues = validateMarkdownLinks(item.body, item.file, anchorsByFile);
    brokenMarkdownLinks += linkIssues.length;
    brokenLinkDetails.push(...linkIssues.map((issue) => `${item.relative}:${issue}`));
  }

  checks.markdown_files = {
    count: markdownRows.length, utf8_errors: utf8Errors, replacement_characters: replacementCharacters,
    mojibake_markers: mojibakeMarkers, empty_files: emptyFiles, unclosed_fences: unclosedFences,
    front_matter_errors: metadataErrors, duplicate_slugs: duplicateNames,
  };
  if (utf8Errors || replacementCharacters || mojibakeMarkers || emptyFiles || unclosedFences || metadataErrors || duplicateNames.length) errors.push('one or more core Markdown integrity checks failed');
  checks.navigation = { files_with_obvious_navigation_residuals: navResiduals };
  if (navResiduals) warnings.push(`${navResiduals} files contain possible navigation sequences`);
  checks.duplicates = { exact_duplicate_bodies: duplicateBodies };
  if (duplicateBodies.length) errors.push(`${duplicateBodies.length} exact duplicate Markdown bodies found within the same platform/variant`);
  checks.code = { multiline_blocks: multilineCodeBlocks, blocks_with_indentation: indentedCodeBlocks };
  if (multilineCodeBlocks && !indentedCodeBlocks) errors.push('no multiline code block retained indentation');
  checks.tables = {
    markdown_table_column_errors: markdownTableErrors,
    markdown_table_error_details: markdownTableDetails,
    preserved_html_table_structure_errors: htmlTableErrors,
    preserved_html_table_error_details: htmlTableDetails,
    markdown_tables: markdownRows.reduce((sum, row) => sum + row.markdown_table_count, 0),
    preserved_html_tables: markdownRows.reduce((sum, row) => sum + row.preserved_html_table_count, 0),
  };
  if (markdownTableErrors || htmlTableErrors) errors.push('table structure validation failed');
  checks.images_and_links = {
    missing_relative_images: missingImages,
    missing_relative_image_details: missingImageDetails,
    broken_markdown_internal_links: brokenMarkdownLinks,
    broken_markdown_internal_link_details: brokenLinkDetails,
    malformed_source_markdown_links: malformedSourceLinks,
  };
  if (malformedSourceLinks) warnings.push(`${malformedSourceLinks} malformed Markdown-style links already present as source text were preserved`);
  if (missingImages || brokenMarkdownLinks) errors.push('image or internal Markdown link validation failed');
  checks.traceability = { errors: traceabilityErrors };
  if (traceabilityErrors) errors.push(`${traceabilityErrors} Markdown files failed source traceability`);

  const ptradeRows = markdownRows.filter((row) => row.platform === 'ptrade');
  const ptradeIsolation = ptradeRows.every((row) => row.markdown_file.includes(`/ptrade/${row.variant}/`))
    && ptradeRows.filter((row) => row.variant === 'guojin').every((row) => row.source_role === 'primary')
    && ptradeRows.filter((row) => row.variant === 'shenwan').every((row) => row.source_role === 'supplementary');
  checks.ptrade_isolation = { pass: ptradeIsolation };
  if (!ptradeIsolation) errors.push('PTrade variant isolation or source roles failed');

  const joinquantTypes = new Set(markdownRows.filter((row) => row.platform === 'joinquant').map((row) => row.document_type));
  const expectedJoinquantTypes = ['strategy_api', 'market_data', 'factor', 'research_data', 'finance', 'faq'];
  checks.joinquant_categories = { present: [...joinquantTypes].sort(), expected: expectedJoinquantTypes };
  if (expectedJoinquantTypes.some((type) => !joinquantTypes.has(type))) errors.push('JoinQuant document categories are not all represented');
  const mainAlias = manifest.find((row) => row.source_file === 'api-docs/raw/joinquant/main/rendered.html');
  checks.joinquant_main_api = {
    main_status: mainAlias?.processing_status || null,
    canonical: mainAlias?.alias_of || null,
    pass: mainAlias?.processing_status === 'alias' && mainAlias?.alias_of === 'api-docs/raw/joinquant/api/rendered.html',
  };
  if (!checks.joinquant_main_api.pass) errors.push('JoinQuant main/api deduplication is not explicit and canonicalized to api/rendered.html');

  const keywordSpecs = {
    ptrade: ['get_history', 'get_fundamentals', 'order'],
    qmt: ['get_market_data_ex', 'passorder'],
    joinquant: ['initialize', 'run_daily', 'get_price', 'order_target', 'get_fundamentals'],
  };
  const keywordResults = {};
  for (const [platform, keywords] of Object.entries(keywordSpecs)) {
    const corpus = parsedFiles.filter((item) => item.row.platform === platform).map((item) => item.body).join('\n');
    keywordResults[platform] = Object.fromEntries(keywords.map((keyword) => [keyword, corpus.includes(keyword)]));
  }
  checks.typical_api_search = keywordResults;
  const missingKeywords = Object.entries(keywordResults).flatMap(([platform, values]) => Object.entries(values).filter(([, found]) => !found).map(([keyword]) => `${platform}:${keyword}`));
  if (missingKeywords.length) errors.push(`typical API keywords missing from Markdown: ${missingKeywords.join(', ')}`);

  const sourceStatus = {};
  for (const source of expectedSources) {
    const rows = manifest.filter((row) => row.source_file === source);
    sourceStatus[source] = rows.some((row) => row.processing_status === 'failed') ? 'failed'
      : rows.some((row) => row.processing_status === 'alias') ? 'alias'
        : rows.length > 1 || rows[0]?.processing_status === 'split' ? 'split'
          : rows[0]?.processing_status || 'missing';
  }
  checks.source_statuses = sourceStatus;
  if (Object.values(sourceStatus).includes('failed') || Object.values(sourceStatus).includes('missing')) errors.push('one or more sources failed or are missing');

  const manualReview = fs.existsSync(manualReviewFile)
    ? JSON.parse(fs.readFileSync(manualReviewFile, 'utf8'))
    : { complete: false, items: [], notes: ['manual-review.json not yet present'] };
  manualReview.complete = Boolean(manualReview.complete && manualReview.items?.length >= 13 && manualReview.items.every((item) => item.pass));
  const automatedPass = errors.length === 0;
  return {
    generated_at: new Date().toISOString(),
    staging_root: stagingRoot,
    automated_pass: automatedPass,
    manual_review: manualReview,
    can_publish: automatedPass && manualReview.complete,
    errors,
    warnings,
    checks,
  };
}

function parseMarkdown(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  try {
    return { metadata: yaml.load(match[1]), body: match[2] };
  } catch {
    return null;
  }
}

function fencesClosed(markdown) {
  let fence = null;
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (!match) continue;
    if (!fence) fence = match[1];
    else if (match[1][0] === fence[0] && match[1].length >= fence.length) fence = null;
  }
  return fence === null;
}

function codeBlocks(markdown) {
  const result = [];
  let fence = null;
  let lines = [];
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (!fence && match) {
      fence = match[1];
      lines = [];
    } else if (fence && match && match[1][0] === fence[0] && match[1].length >= fence.length) {
      result.push(lines.join('\n'));
      fence = null;
    } else if (fence) lines.push(line);
  }
  return result;
}

function withoutFencedCode(markdown) {
  let fence = null;
  return markdown.split('\n').map((line) => {
    const match = line.match(/^(`{3,}|~{3,})/);
    if (!fence && match) { fence = match[1]; return ''; }
    if (fence && match && match[1][0] === fence[0] && match[1].length >= fence.length) { fence = null; return ''; }
    return fence ? '' : line;
  }).join('\n');
}

function validateMarkdownTables(markdown) {
  const lines = withoutFencedCode(markdown.replace(/<table[\s\S]*?<\/table>/gi, '')).split('\n');
  const errors = [];
  for (let i = 1; i < lines.length - 1; i += 1) {
    if (!/^\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(lines[i])) continue;
    const expected = pipeColumns(lines[i - 1]);
    for (let j = i + 1; j < lines.length && /^\|.*\|\s*$/.test(lines[j]); j += 1) {
      if (pipeColumns(lines[j]) !== expected) errors.push(`line ${j + 1}: expected ${expected} columns, found ${pipeColumns(lines[j])}`);
    }
  }
  return errors;
}

function pipeColumns(line) {
  return (line.match(/(?<!\\)\|/g) || []).length - 1;
}

function validateHtmlTables(markdown) {
  const tables = markdown.match(/<table[\s\S]*?<\/table>/gi) || [];
  const errors = [];
  const unclosed = (markdown.match(/<table(?:\s|>)/gi) || []).length - tables.length;
  for (let i = 0; i < unclosed; i += 1) errors.push('unclosed table');
  for (const table of tables) {
    const $ = cheerio.load(table);
    if (!$('table').length || !$('tr').length || !$('td,th').length) errors.push('table missing table/tr/cell structure');
  }
  return errors;
}

function validateImages(markdown, markdownFile) {
  const missing = [];
  for (const match of markdown.matchAll(/(?<!\\)!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (/^(?:https?:|data:)/i.test(target)) continue;
    const file = path.resolve(path.dirname(markdownFile), target.split(/[?#]/)[0]);
    if (!fs.existsSync(file)) missing.push(target);
  }
  return missing;
}

function validateMarkdownLinks(markdown, markdownFile, anchorsByFile) {
  const broken = [];
  const text = withoutFencedCode(markdown);
  for (const match of text.matchAll(/(?<!!)(?<!\\)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (/^(?:["']?https?:|file:|mailto:|tel:)/i.test(target)) continue;
    const [filePart, anchor] = target.split('#');
    const file = filePart ? path.resolve(path.dirname(markdownFile), filePart) : markdownFile;
    if (!fs.existsSync(file)) { broken.push(`${target} (missing file)`); continue; }
    if (anchor && anchorsByFile.has(file) && !anchorsByFile.get(file).has(decodeURIComponent(anchor))) broken.push(`${target} (missing anchor)`);
  }
  return broken;
}

function decodeEntities(value) {
  const $ = cheerio.load(`<span>${value}</span>`);
  return $('span').text();
}

function qaReport(results) {
  const c = results.checks;
  const sourceStatusCounts = Object.values(c.source_statuses).reduce((acc, status) => ({ ...acc, [status]: (acc[status] || 0) + 1 }), {});
  const keywordRows = Object.entries(c.typical_api_search).flatMap(([platform, values]) => Object.entries(values).map(([keyword, found]) => `| ${platform} | ${keyword} | ${found ? '找到' : '未找到'} |`)).join('\n');
  const manualRows = results.manual_review.items?.length
    ? results.manual_review.items.map((item) => `| ${item.name} | ${item.pass ? '通过' : '失败'} | ${item.evidence || ''} |`).join('\n')
    : '| 尚未执行 | 失败 | 等待人工抽样 |';
  return `# Markdown QA 报告

## 结论

- 自动 QA：${results.automated_pass ? '通过' : '失败'}
- 人工抽样：${results.manual_review.complete ? '完成并通过' : '尚未完成或存在失败'}
- 36 个来源状态：${Object.entries(sourceStatusCounts).map(([key, value]) => `${key}=${value}`).join(', ')}
- 是否可进入“API 索引建立”阶段：**${results.can_publish ? '是' : '否'}**

${results.errors.length ? `阻塞问题：\n${results.errors.map((item) => `- ${item}`).join('\n')}` : '无阻塞问题。'}

## Raw 哈希与覆盖

- raw 基线文件：${c.raw_hashes.expected_files}
- raw 当前文件：${c.raw_hashes.actual_files}
- 哈希变化：${c.raw_hashes.changed.length}
- 来源清单：expected=${c.source_coverage.expected}, handled=${c.source_coverage.handled}, missing=${c.source_coverage.missing.length}, unexpected=${c.source_coverage.unexpected.length}

## Markdown 完整性

- 输出文件：${c.markdown_files.count}
- UTF-8 错误：${c.markdown_files.utf8_errors}
- 替换字符：${c.markdown_files.replacement_characters}
- 乱码标记：${c.markdown_files.mojibake_markers}
- 空正文：${c.markdown_files.empty_files}
- 未闭合代码围栏：${c.markdown_files.unclosed_fences}
- Front Matter 错误：${c.markdown_files.front_matter_errors}
- slug 冲突：${c.markdown_files.duplicate_slugs.length}
- 明显导航残留：${c.navigation.files_with_obvious_navigation_residuals}
- 完全重复正文：${c.duplicates.exact_duplicate_bodies.length}

## 代码与表格

- 多行代码块：${c.code.multiline_blocks}
- 保留缩进的代码块：${c.code.blocks_with_indentation}
- GFM 表格：${c.tables.markdown_tables}
- GFM 列数错误：${c.tables.markdown_table_column_errors}
- 保留 HTML 表格：${c.tables.preserved_html_tables}
- HTML 表格结构错误：${c.tables.preserved_html_table_structure_errors}

## 链接、图片与追溯

- 缺失相对图片：${c.images_and_links.missing_relative_images}
- 失效 Markdown 内部链接：${c.images_and_links.broken_markdown_internal_links}
- 来源追溯错误：${c.traceability.errors}
- PTrade 国金/申万隔离：${c.ptrade_isolation.pass ? '通过' : '失败'}
- JoinQuant 类别：${c.joinquant_categories.present.join(', ')}
- JoinQuant main/api：${c.joinquant_main_api.pass ? `main=alias, canonical=${c.joinquant_main_api.canonical}` : '失败'}

## 典型 API 搜索

| 平台 | 关键词 | 结果 |
|---|---|---|
${keywordRows}

## 人工可读性抽样

| 抽样项 | 结果 | 证据 |
|---|---|---|
${manualRows}

人工抽样核对标题、参数、返回值、代码缩进、表格列对应、导航清理和来源 Front Matter。${results.manual_review.notes?.length ? `备注：${results.manual_review.notes.join('；')}` : ''}

## 疑似遗漏与人工确认

${results.warnings.length ? results.warnings.map((item) => `- ${item}`).join('\n') : '- 未发现阻塞性疑似遗漏。原始来源中未能映射到本地章节的锚点按转换规则保留为 source URL，并在 conversion_warnings 中登记。'}
`;
}

function publishStaging() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const moves = [
    [path.join(stagingRoot, 'normalized'), path.join(apiDocsRoot, 'normalized')],
    [path.join(stagingRoot, 'assets'), path.join(apiDocsRoot, 'assets')],
    [manifestFile, path.join(apiDocsRoot, 'manifests', 'markdown_pages.jsonl')],
  ];
  const backups = [];
  for (const [source, target] of moves) {
    if (fs.existsSync(target)) {
      const backup = `${target}.backup-${timestamp}`;
      fs.renameSync(target, backup);
      backups.push(projectRelative(projectRoot, backup));
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.renameSync(source, target);
  }
  run.published = true;
  run.published_at = new Date().toISOString();
  run.backups = backups;
  fs.writeFileSync(lastRunFile, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  console.log(`Published normalized Markdown. Backups: ${backups.length ? backups.join(', ') : 'none'}`);
}
