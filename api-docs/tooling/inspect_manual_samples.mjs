#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const toolingDir = path.dirname(fileURLToPath(import.meta.url));
const apiDocsRoot = path.dirname(toolingDir);
const run = JSON.parse(fs.readFileSync(path.join(toolingDir, 'last-run.json'), 'utf8'));
const normalizedRoot = path.join(run.staging_root, 'normalized');

const samples = [
  ['PTrade国金主API', 'raw/ptrade/guojin/ptradeapi.html', '.help-content.markdown-body', 'get_history'],
  ['PTrade国金财务数据', 'raw/ptrade/guojin/财务数据api.html', '.help-content.markdown-body', 'valuation'],
  ['PTrade申万数据接口', 'raw/ptrade/shenwan/08_api_data.html', '.vp-doc', 'get_history'],
  ['PTrade申万交易接口', 'raw/ptrade/shenwan/09_api_trade.html', '.vp-doc', 'order'],
  ['QMT行情API', 'raw/qmt/innerapi-combined.html', 'section.doc-page', 'data_function--contextinfo-get-market-data-ex-获取行情数据'],
  ['QMT下单API', 'raw/qmt/innerapi-combined.html', 'section.doc-page', 'trading_function--passorder-综合下单函数'],
  ['JoinQuant策略API', 'raw/joinquant/api/rendered.html', '#jq-api-content', 'initialize'],
  ['JoinQuant Stock', 'raw/joinquant/Stock/rendered.html', '#jq-api-content', 'get_fundamentals'],
  ['JoinQuant JQData', 'raw/joinquant/JQData/rendered.html', '#jq-api-content', 'get_query_count'],
  ['JoinQuant技术指标', 'raw/joinquant/technicalanalysis/rendered.html', '#jq-api-content', 'MACD-平滑异同平均'],
];

const markdownFiles = walk(normalizedRoot).filter((file) => file.endsWith('.md'));
const output = samples.map(([name, sourceRelative, selector, anchor]) => inspectSection(name, sourceRelative, selector, anchor));
output.push(inspectSimpleTable());
output.push(inspectComplexTable());
output.push(inspectLongCode());
console.log(JSON.stringify(output, null, 2));

function inspectSection(name, sourceRelative, selector, anchor) {
  const sourceFile = path.join(apiDocsRoot, sourceRelative);
  const $ = cheerio.load(fs.readFileSync(sourceFile, 'utf8'));
  const root = $(selector);
  let heading = root.find(`#${cssEscape(anchor)}`).first();
  if (heading.length && !heading.is('h1,h2,h3,h4,h5,h6')) heading = heading.closest('.group').children('label').first();
  if (!heading.length) heading = root.find('h1,h2,h3,h4,h5,h6').filter((_, node) => clean($(node).text()).includes(anchor)).first();
  if (!heading.length) heading = root.find('.group > label:first-child').filter((_, node) => clean($(node).text()).includes(anchor)).first();
  if (!heading.length) return { name, pass: false, error: `source heading not found: ${anchor}` };
  const section = heading.is('label') ? heading.closest('.group') : sectionNodes($, heading);
  const sourceText = clean(section.text());
  const sourceCode = normalizeCode(section.find('pre').first().text());
  const sourceAnchor = heading.attr('id') || heading.find('[id]').first().attr('id') || clean(heading.text()).replace(/\(.*$/, '');
  const expectedPath = normalizedPathFragment(sourceRelative);
  const markdownFile = markdownFiles.find((file) => {
    const text = fs.readFileSync(file, 'utf8');
    return file.includes(expectedPath)
      && text.includes(`source_file: api-docs/${sourceRelative}`)
      && text.includes(`<a id="${sourceAnchor}"></a>`);
  });
  if (!markdownFile) return { name, pass: false, error: `Markdown anchor not found: ${sourceAnchor}` };
  const markdown = fs.readFileSync(markdownFile, 'utf8');
  const start = markdown.indexOf(`<a id="${sourceAnchor}"></a>`);
  const markdownExcerpt = markdown.slice(start, start + 2400);
  const markdownBlocks = fencedBlocks(markdown);
  const markdownCode = sourceCode ? markdownBlocks.find((block) => block === sourceCode) || '' : '';
  const sourceTokens = significantTokens(sourceText);
  const comparableMarkdown = markdownExcerpt.replace(/\\([_\[\]*])/g, '$1');
  const missingTokens = sourceTokens.filter((token) => !comparableMarkdown.includes(token));
  return {
    name,
    pass: clean(heading.text()).length > 0 && missingTokens.length <= Math.max(5, Math.ceil(sourceTokens.length * 0.5))
      && (!sourceCode || sourceCode === markdownCode),
    source_file: `api-docs/${sourceRelative}`,
    markdown_file: path.relative(apiDocsRoot, markdownFile).split(path.sep).join('/'),
    heading: clean(heading.text()),
    source_anchor: `#${sourceAnchor}`,
    source_table_count: section.find('table').length,
    source_code_exact: sourceCode ? sourceCode === markdownCode : null,
    missing_sample_tokens: missingTokens,
    source_excerpt: sourceText.slice(0, 500),
    markdown_excerpt: markdownExcerpt.replace(/\n+/g, ' ').slice(0, 650),
  };
}

function inspectSimpleTable() {
  const sourceFile = path.join(apiDocsRoot, 'raw/qmt/innerapi-combined.html');
  const $ = cheerio.load(fs.readFileSync(sourceFile, 'utf8'));
  const table = $('#doc-data_function table').first();
  const cells = table.find('tr').first().children('th,td').map((_, cell) => clean($(cell).text())).get();
  const markdownFile = path.join(normalizedRoot, 'qmt/builtin-python/builtin-python--doc-data-function.md');
  const markdown = fs.readFileSync(markdownFile, 'utf8');
  const matchingLine = markdown.split('\n').find((line) => cells.every((cell) => line.includes(cell)));
  return {
    name: '简单表格', pass: cells.length > 1 && Boolean(matchingLine),
    source_file: 'api-docs/raw/qmt/innerapi-combined.html',
    markdown_file: 'normalized/qmt/builtin-python/builtin-python--doc-data-function.md',
    evidence: { columns: cells, markdown_header: matchingLine || null },
  };
}

function inspectComplexTable() {
  const sourceFile = path.join(apiDocsRoot, 'raw/joinquant/JQData/rendered.html');
  const $ = cheerio.load(fs.readFileSync(sourceFile, 'utf8'));
  const table = $('#jq-api-content table').filter((_, node) => $(node).find('[rowspan],[colspan]').length > 0).first();
  const sourceRows = table.find('tr').length;
  const sourceCells = table.find('th,td').length;
  const sampleText = clean(table.text()).slice(0, 80);
  const markdownFile = markdownFiles.find((file) => {
    const text = fs.readFileSync(file, 'utf8');
    return text.includes('<table>') && significantTokens(sampleText).every((token) => text.includes(token));
  });
  let markdownRows = 0;
  let markdownCells = 0;
  if (markdownFile) {
    const md = cheerio.load(fs.readFileSync(markdownFile, 'utf8'));
    const match = md('table').filter((_, node) => significantTokens(sampleText).every((token) => clean(md(node).text()).includes(token))).first();
    markdownRows = match.find('tr').length;
    markdownCells = match.find('th,td').length;
  }
  return {
    name: '复杂表格', pass: Boolean(markdownFile) && sourceRows === markdownRows && sourceCells === markdownCells,
    source_file: 'api-docs/raw/joinquant/JQData/rendered.html',
    markdown_file: markdownFile ? path.relative(apiDocsRoot, markdownFile).split(path.sep).join('/') : null,
    evidence: { sourceRows, markdownRows, sourceCells, markdownCells, sampleText },
  };
}

function inspectLongCode() {
  const sourceFile = path.join(apiDocsRoot, 'raw/qmt/innerapi-combined.html');
  const $ = cheerio.load(fs.readFileSync(sourceFile, 'utf8'));
  let longest = '';
  $('#doc-code_examples pre').each((_, pre) => {
    const code = normalizeCode($(pre).text());
    if (code.length > longest.length) longest = code;
  });
  const markdownFile = path.join(normalizedRoot, 'qmt/builtin-python/builtin-python--doc-code-examples.md');
  const markdown = fs.readFileSync(markdownFile, 'utf8');
  const blocks = fencedBlocks(markdown);
  return {
    name: '长Python代码示例', pass: longest.length > 1000 && blocks.includes(longest),
    source_file: 'api-docs/raw/qmt/innerapi-combined.html',
    markdown_file: 'normalized/qmt/builtin-python/builtin-python--doc-code-examples.md',
    evidence: { characters: longest.length, lines: longest.split('\n').length, exact_match: blocks.includes(longest) },
  };
}

function sectionNodes($, heading) {
  const level = Number(heading.get(0).tagName.slice(1));
  const nodes = [heading.get(0)];
  for (let node = heading.next(); node.length; node = node.next()) {
    if (/^h[1-6]$/.test(node.get(0)?.tagName || '') && Number(node.get(0).tagName.slice(1)) <= level) break;
    nodes.push(node.get(0));
  }
  return $(nodes);
}

function firstCode(markdown) {
  const match = markdown.match(/^`{3,}[^\n]*\n([\s\S]*?)\n`{3,}\s*$/m);
  return match ? normalizeCode(match[1]) : '';
}

function fencedBlocks(markdown) {
  const result = [];
  let fence = null;
  let lines = [];
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (!fence && match) {
      fence = match[1];
      lines = [];
    } else if (fence && match && match[1][0] === fence[0] && match[1].length >= fence.length) {
      result.push(normalizeCode(lines.join('\n')));
      fence = null;
    } else if (fence) lines.push(line);
  }
  return result;
}

function normalizedPathFragment(sourceRelative) {
  if (sourceRelative.includes('/ptrade/guojin/')) return `${path.sep}ptrade${path.sep}guojin${path.sep}`;
  if (sourceRelative.includes('/ptrade/shenwan/')) return `${path.sep}ptrade${path.sep}shenwan${path.sep}`;
  if (sourceRelative.includes('/qmt/')) return `${path.sep}qmt${path.sep}builtin-python${path.sep}`;
  return `${path.sep}joinquant${path.sep}`;
}

function normalizeCode(value) {
  return String(value || '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
}

function significantTokens(value) {
  return [...new Set(String(value || '').match(/[A-Za-z_][A-Za-z0-9_]{4,}|[\u4e00-\u9fff]{4,}/g) || [])].slice(0, 10);
}

function clean(value) {
  return String(value || '').replace(/^#\s*/, '').replace(/[\u200b\ufeff​]/g, '').replace(/\s+/g, ' ').trim();
}

function cssEscape(value) {
  return String(value).replace(/([:.\[\],=@])/g, '\\$1');
}

function walk(root) {
  const result = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...walk(file));
    else result.push(file);
  }
  return result;
}
