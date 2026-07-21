#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import {
  fencedCode, frontMatter, githubHeadingSlug, inferLanguage, markdownStats,
  normalizeMarkdown, projectRelative, semanticText, sha256File, sha256Buffer,
  shortHash, stableSlug, textSimilarity, walkFiles,
} from './markdown-utils.mjs';
import {
  globalNoiseSelectors, outputBase, platformRule, sourceDocumentName,
} from './platform-rules.mjs';

const toolingDir = path.dirname(fileURLToPath(import.meta.url));
const apiDocsRoot = path.dirname(toolingDir);
const projectRoot = path.dirname(apiDocsRoot);
const pagesFile = path.join(apiDocsRoot, 'manifests', 'pages.jsonl');
const reportsDir = path.join(apiDocsRoot, 'reports');
const rawRoot = path.join(apiDocsRoot, 'raw');
const baselineFile = path.join(toolingDir, 'raw_hashes_before.json');
const lastRunFile = path.join(toolingDir, 'last-run.json');

const args = new Set(process.argv.slice(2));
if (args.has('--snapshot-raw')) snapshotRaw();
else if (args.has('--evaluate')) evaluateSamples();
else if (args.has('--all')) convertAll();
else {
  console.error('Usage: node convert_html_to_markdown.mjs --snapshot-raw|--evaluate|--all');
  process.exitCode = 2;
}

function readPages() {
  return fs.readFileSync(pagesFile, 'utf8').trim().split(/\n/).filter(Boolean).map(JSON.parse);
}

function snapshotRaw() {
  if (fs.existsSync(baselineFile)) {
    const existing = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
    const current = rawHashes();
    if (JSON.stringify(existing.files) !== JSON.stringify(current)) {
      throw new Error('Existing raw hash baseline differs from current raw directory; refusing to overwrite it.');
    }
    console.log(`Raw hash baseline already exists and matches (${Object.keys(current).length} files).`);
    return;
  }
  const payload = {
    source: 'api-docs/raw',
    file_count: walkFiles(rawRoot).length,
    files: rawHashes(),
  };
  fs.writeFileSync(baselineFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Saved raw hash baseline for ${payload.file_count} files.`);
}

function rawHashes() {
  return Object.fromEntries(walkFiles(rawRoot).map((file) => [projectRelative(apiDocsRoot, file), sha256File(file)]));
}

function evaluateSamples() {
  ensureBaseline();
  const wanted = new Set([
    'api-docs/raw/ptrade/guojin/ptradeapi.html',
    'api-docs/raw/qmt/innerapi-combined.html',
    'api-docs/raw/joinquant/api/rendered.html',
    'api-docs/raw/joinquant/JQData/rendered.html',
  ]);
  const pages = readPages().filter((page) => wanted.has(sourcePath(page)));
  if (pages.length !== 4) throw new Error(`Expected 4 evaluation samples, found ${pages.length}.`);
  const evaluationRoot = prepareFreshDirectory(path.join(toolingDir, 'evaluation-output'));
  const build = buildDocuments(pages, evaluationRoot, { evaluation: true });
  const results = pages.map((page) => evaluatePage(page, build));
  const passed = results.every((item) => item.pass);
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, 'converter-evaluation.md'), evaluationReport(results, passed), 'utf8');
  console.log(JSON.stringify({ passed, samples: results, output: evaluationRoot }, null, 2));
  if (!passed) process.exitCode = 1;
}

function convertAll() {
  ensureBaseline();
  const evaluationReportFile = path.join(reportsDir, 'converter-evaluation.md');
  if (!fs.existsSync(evaluationReportFile) || !fs.readFileSync(evaluationReportFile, 'utf8').includes('批量执行结论：**通过**')) {
    throw new Error('Sample evaluation has not passed; run npm run evaluate first.');
  }
  const pages = readPages();
  const stagingRoot = prepareFreshDirectory(path.join(apiDocsRoot, '.markdown-staging'));
  const build = buildDocuments(pages, stagingRoot, { evaluation: false });
  const manifestDir = path.join(stagingRoot, 'manifests');
  fs.mkdirSync(manifestDir, { recursive: true });
  const manifestFile = path.join(manifestDir, 'markdown_pages.jsonl');
  fs.writeFileSync(manifestFile, `${build.manifest.map((row) => JSON.stringify(row)).join('\n')}\n`, 'utf8');
  fs.writeFileSync(path.join(reportsDir, 'markdown-conversion-report.md'), conversionReport(build, pages), 'utf8');
  const run = {
    staging_root: stagingRoot,
    manifest_file: manifestFile,
    source_count: pages.length,
    markdown_count: build.manifest.filter((row) => row.markdown_file).length,
    joinquant_main_api_similarity: build.joinquantComparison,
  };
  fs.writeFileSync(lastRunFile, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(run, null, 2));
}

function ensureBaseline() {
  if (!fs.existsSync(baselineFile)) snapshotRaw();
}

function prepareFreshDirectory(target) {
  if (fs.existsSync(target)) {
    const backup = `${target}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    fs.renameSync(target, backup);
  }
  fs.mkdirSync(target, { recursive: true });
  return target;
}

function buildDocuments(pages, buildRoot, options) {
  const normalizedRoot = path.join(buildRoot, 'normalized');
  const assetsRoot = path.join(buildRoot, 'assets');
  fs.mkdirSync(normalizedRoot, { recursive: true });
  fs.mkdirSync(assetsRoot, { recursive: true });

  const joinquant = compareJoinQuantMainApi(pages);
  const aliasFile = joinquant.alias ? joinquant.main.local_file_path : null;
  const canonicalFile = joinquant.api?.local_file_path || null;
  const activePages = pages.filter((page) => page.local_file_path !== aliasFile);
  const descriptors = activePages.flatMap((page) => describePageChunks(page, normalizedRoot));
  assignOutputFiles(descriptors, normalizedRoot);
  const anchorMap = buildAnchorMap(descriptors);
  const pageLookup = buildPageLookup(pages);
  const manifest = [];
  const sourceChunkCounts = new Map();
  for (const descriptor of descriptors) {
    sourceChunkCounts.set(descriptor.page.local_file_path, (sourceChunkCounts.get(descriptor.page.local_file_path) || 0) + 1);
  }

  const converted = [];
  for (const descriptor of descriptors) {
    try {
      const result = convertDescriptor(descriptor, {
        buildRoot, assetsRoot, anchorMap, pageLookup, sourceChunkCounts,
      });
      converted.push(result);
      manifest.push(result.manifest);
    } catch (error) {
      console.error(`Conversion failed for ${sourcePath(descriptor.page)}#${descriptor.anchor || ''} (${descriptor.title}): ${error.stack || error}`);
      manifest.push(failedManifest(descriptor, error));
    }
  }

  if (aliasFile) {
    manifest.push(aliasManifest(joinquant.main, joinquant.api, joinquant.similarity));
  } else if (joinquant.main && joinquant.api && !options.evaluation) {
    console.warn(`JoinQuant main/api differ materially (similarity=${joinquant.similarity.toFixed(6)}); both were converted.`);
  }

  return {
    buildRoot,
    manifest,
    converted,
    joinquantComparison: {
      compared: Boolean(joinquant.main && joinquant.api),
      equivalent: Boolean(aliasFile),
      similarity: joinquant.similarity,
      canonical_source: canonicalFile ? projectRelative(projectRoot, canonicalFile) : null,
      alias_source: aliasFile ? projectRelative(projectRoot, aliasFile) : null,
    },
  };
}

function describePageChunks(page, normalizedRoot) {
  const html = fs.readFileSync(page.local_file_path, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });
  const rule = platformRule(page);
  preparePlatformDom($, page, rule);
  const roots = $(rule.contentSelector);
  if (!roots.length) throw new Error(`Content selector did not match: ${rule.contentSelector}`);
  const descriptors = [];
  roots.each((rootIndex, rootNode) => {
    const chunks = page.platform === 'qmt'
      ? [rootDescriptor($, rootNode, page, rule, rootIndex)]
      : splitRoot($, rootNode, page, rule);
    descriptors.push(...chunks);
  });
  if (!descriptors.length) throw new Error('No content chunks were produced.');
  return descriptors;
}

function preparePlatformDom($, page, rule) {
  if (page.platform !== 'joinquant') return;
  const root = $(rule.contentSelector);
  root.find('.header').remove();
  root.find('.group').each((_, group) => {
    const element = $(group);
    const labels = element.children('label');
    if (!element.children('article').length || labels.length < 1) return;
    const nameLabel = labels.eq(0);
    const descriptionLabel = labels.eq(1);
    const name = cleanTitle(nameLabel.text());
    if (!name) return;
    const existingId = nameLabel.attr('id') || nameLabel.find('[id]').first().attr('id');
    const anchor = existingId || (/^[A-Za-z_][A-Za-z0-9_.-]*(?:\([^)]*\))?$/.test(name) ? name.replace(/\(.*$/, '') : null);
    const heading = $('<h3></h3>').text(name);
    if (anchor) heading.attr('id', anchor);
    nameLabel.replaceWith(heading);
    if (descriptionLabel.length) descriptionLabel.replaceWith($('<p></p>').append($('<strong></strong>').text(cleanTitle(descriptionLabel.text()))));
  });
}

function rootDescriptor($, rootNode, page, rule, index) {
  const node = $(rootNode).clone();
  node.find('.header-anchor').remove();
  const heading = node.find('h1,h2,h3').first();
  const title = cleanTitle(heading.text()) || `${page.title} ${index + 1}`;
  const anchor = $(rootNode).attr('id') || heading.attr('id') || null;
  return { page, rule, title, anchor, html: $.html(rootNode), headings: collectHeadings($, rootNode) };
}

function splitRoot($, rootNode, page, rule) {
  const levels = new Set(rule.splitHeadingLevels);
  const headings = $(rootNode).find([...levels].map((level) => `h${level}`).join(',')).toArray();
  if (!headings.length) return [rootDescriptor($, rootNode, page, rule, 0)];
  const containerNode = lowestCommonAncestor(headings, rootNode);
  const container = $(containerNode);
  const children = container.contents().toArray();
  const chunks = [];
  let current = [];
  let currentHeading = null;
  for (const node of children) {
    const nestedHeading = node.type === 'tag'
      ? (levels.has(Number(node.tagName?.slice(1))) ? node : $(node).find([...levels].map((level) => `h${level}`).join(',')).get(0))
      : null;
    const isSplit = Boolean(nestedHeading);
    if (isSplit && currentHeading) {
      chunks.push(makeChunk($, page, rule, currentHeading, current));
      current = [];
    }
    if (isSplit) currentHeading = nestedHeading;
    current.push(node);
  }
  if (current.length) {
    if (currentHeading) chunks.push(makeChunk($, page, rule, currentHeading, current));
    else return [rootDescriptor($, rootNode, page, rule, 0)];
  }
  return chunks;
}

function lowestCommonAncestor(nodes, fallback) {
  if (nodes.length === 1) return nodes[0].parent || fallback;
  const firstAncestors = [];
  for (let node = nodes[0]; node; node = node.parent) firstAncestors.push(node);
  for (const candidate of firstAncestors) {
    if (nodes.every((node) => {
      for (let cursor = node; cursor; cursor = cursor.parent) if (cursor === candidate) return true;
      return false;
    })) return candidate;
  }
  return fallback;
}

function makeChunk($, page, rule, headingNode, nodes) {
  const heading = $(headingNode).clone();
  heading.find('.header-anchor, svg').remove();
  const title = cleanTitle(heading.text()) || page.title;
  const anchor = $(headingNode).attr('id') || null;
  return {
    page, rule, title, anchor,
    html: nodes.map((node) => $.html(node)).join(''),
    headings: nodes.flatMap((node) => collectHeadings($, node)),
  };
}

function collectHeadings($, node) {
  const result = [];
  const all = $(node).is('h1,h2,h3,h4,h5,h6') ? $(node).add($(node).find('h1,h2,h3,h4,h5,h6')) : $(node).find('h1,h2,h3,h4,h5,h6');
  all.each((_, heading) => {
    const clone = $(heading).clone();
    clone.find('.header-anchor, svg').remove();
    result.push({ id: $(heading).attr('id') || null, title: cleanTitle(clone.text()) });
  });
  return result;
}

function cleanTitle(value) {
  return String(value || '').replace(/^#\s*/, '').replace(/[\u200b\u200c\u200d\ufeff​]+/g, '').replace(/\s+/g, ' ').trim();
}

function assignOutputFiles(descriptors, normalizedRoot) {
  const used = new Set();
  for (const descriptor of descriptors) {
    const base = outputBase(descriptor.page);
    const sourceKey = stableSlug(descriptor.rule.sourceKey, 'document');
    const sectionSlug = stableSlug(descriptor.anchor || descriptor.title, sourceKey);
    let fileSlug = sectionSlug.startsWith(`${sourceKey}-`) ? sectionSlug : `${sourceKey}--${sectionSlug}`;
    let relative = path.join(base, `${fileSlug}.md`);
    if (used.has(relative)) {
      fileSlug = `${fileSlug}--${shortHash(`${sourcePath(descriptor.page)}|${descriptor.anchor}|${descriptor.title}`)}`;
      relative = path.join(base, `${fileSlug}.md`);
    }
    used.add(relative);
    descriptor.outputRelative = relative;
    descriptor.outputFile = path.join(normalizedRoot, relative);
  }
}

function buildAnchorMap(descriptors) {
  const map = new Map();
  for (const descriptor of descriptors) {
    for (const heading of descriptor.headings) {
      if (!heading.id) continue;
      map.set(`${descriptor.page.local_file_path}#${heading.id}`, {
        file: descriptor.outputFile,
        anchor: heading.id,
      });
    }
    if (descriptor.anchor) {
      map.set(`${descriptor.page.local_file_path}#${descriptor.anchor}`, {
        file: descriptor.outputFile,
        anchor: descriptor.anchor,
      });
    }
  }
  return map;
}

function buildPageLookup(pages) {
  const map = new Map();
  for (const page of pages) {
    for (const rawUrl of [page.source_url, page.final_url]) {
      try {
        const url = new URL(rawUrl);
        map.set(`${url.origin}${url.pathname}${url.search}`, page);
        map.set(`${url.origin}${url.pathname}`, page);
      } catch {}
    }
  }
  return map;
}

function convertDescriptor(descriptor, context) {
  const warnings = [];
  const $ = cheerio.load(`<div id="conversion-root">${descriptor.html}</div>`, { decodeEntities: false });
  const root = $('#conversion-root');
  root.find([...globalNoiseSelectors, ...descriptor.rule.removeSelectors].join(',')).remove();
  protectCodeBlocks($, root, warnings);
  classifyTables($, root, warnings);
  rewriteImages($, root, descriptor, context, warnings);
  rewriteLinks($, root, descriptor, context, warnings);
  stripNoiseAttributes($, root);
  removeEmptyPlaceholders($, root);
  const turndown = createTurndown();
  let markdownBody = normalizeMarkdown(turndown.turndown(root.html() || ''));
  if (descriptor.anchor && !markdownBody.includes(`<a id="${escapeHtmlAttribute(descriptor.anchor)}"></a>`)) {
    markdownBody = normalizeMarkdown(`<a id="${escapeHtmlAttribute(descriptor.anchor)}"></a>\n\n${markdownBody}`);
  }
  if (!semanticText(markdownBody)) throw new Error('Converted Markdown body is empty.');
  const sectionPath = buildSectionPath(descriptor);
  const metadata = {
    platform: descriptor.page.platform,
    variant: descriptor.page.variant ?? null,
    source_role: descriptor.page.source_role ?? null,
    document_type: descriptor.page.document_type,
    title: descriptor.title,
    section_path: sectionPath,
    source_file: sourcePath(descriptor.page),
    source_url: descriptor.page.source_url ?? null,
    source_anchor: descriptor.anchor ? `#${descriptor.anchor}` : null,
    source_sha256: descriptor.page.sha256,
    captured_at: descriptor.page.captured_at ?? null,
    converter: 'turndown',
    conversion_status: 'complete',
    conversion_warnings: [...new Set(warnings)].sort(),
    canonical: true,
    alias_of: null,
  };
  const markdown = `${frontMatter(metadata)}${markdownBody}`;
  fs.mkdirSync(path.dirname(descriptor.outputFile), { recursive: true });
  fs.writeFileSync(descriptor.outputFile, markdown, 'utf8');
  const stats = markdownStats(markdownBody);
  const processingStatus = context.sourceChunkCounts.get(descriptor.page.local_file_path) > 1 ? 'split' : 'converted';
  const finalMarkdownFile = path.join(apiDocsRoot, 'normalized', descriptor.outputRelative);
  const manifest = {
    ...metadata,
    processing_status: processingStatus,
    markdown_file: projectRelative(projectRoot, finalMarkdownFile),
    markdown_sha256: sha256Buffer(markdown),
    ...stats,
  };
  return { descriptor, markdown, markdownBody, metadata, manifest };
}

function buildSectionPath(descriptor) {
  const parent = cleanTitle(descriptor.page.title.replace(/\s+-\s+JoinQuant$/, ''));
  return parent === descriptor.title ? [descriptor.title] : [parent, descriptor.title];
}

function protectCodeBlocks($, root, warnings) {
  root.find('pre').each((_, pre) => {
    const codeNode = $(pre).find('code').first();
    const code = codeNode.length ? codeNode.text() : $(pre).text();
    const classes = [$(pre).attr('class'), codeNode.attr('class'), $(pre).parent().attr('class')].filter(Boolean).join(' ');
    const language = inferLanguage(classes, code);
    $(pre).attr('data-protected-code', Buffer.from(code, 'utf8').toString('base64'));
    $(pre).attr('data-code-language', language);
    // Turndown routes blank elements around custom rules, so retain a sentinel.
    $(pre).text('CODE_BLOCK_SENTINEL');
    if (code.includes('\uFFFD')) warnings.push('replacement_character_in_source_code');
  });
}

function classifyTables($, root, warnings) {
  root.find('table').each((_, table) => {
    const element = $(table);
    const rows = element.find('tr');
    const firstCells = rows.first().children('th,td');
    if (!rows.length || !firstCells.length) {
      element.remove();
      warnings.push('empty_table_removed');
      return;
    }
    const hasHeadingRow = firstCells.filter('th').length === firstCells.length;
    const complex = element.find('[rowspan], [colspan], table, pre, ul, ol').length > 0
      || element.find('td p, th p').length > 0
      || element.find('td,th').toArray().some((cell) => $(cell).text().includes('|'))
      || !hasHeadingRow;
    if (complex) {
      element.attr('data-preserve-table', 'true');
      warnings.push('complex_table_preserved_as_html');
    }
  });
}

function rewriteImages($, root, descriptor, context, warnings) {
  root.find('img').each((_, image) => {
    const element = $(image);
    const src = element.attr('src');
    const alt = element.attr('alt') || '';
    if (!src) {
      element.replaceWith(alt ? `[图片：${alt}]` : '');
      warnings.push('image_missing_src');
      return;
    }
    if (/^data:/i.test(src) || /^https?:\/\//i.test(src)) return;
    if (src.startsWith('//')) {
      element.attr('src', `https:${src}`);
      return;
    }
    if (src.startsWith('/')) {
      try {
        element.attr('src', new URL(src, descriptor.page.source_url).href);
      } catch {
        element.replaceWith(alt ? `[图片：${alt}]` : '');
        warnings.push('image_unresolvable_absolute_path');
      }
      return;
    }
    const cleanSrc = decodeURIComponent(src.split(/[?#]/)[0]);
    const sourceAsset = path.resolve(path.dirname(descriptor.page.local_file_path), cleanSrc);
    if (!fs.existsSync(sourceAsset) || !fs.statSync(sourceAsset).isFile()) {
      element.replaceWith(alt ? `[图片：${alt}]` : '');
      warnings.push('image_file_missing');
      return;
    }
    const extension = path.extname(sourceAsset) || '.bin';
    const fileName = `${stableSlug(path.basename(sourceAsset, extension), 'image')}-${sha256File(sourceAsset).slice(0, 10)}${extension.toLowerCase()}`;
    const assetRelative = path.join(outputBase(descriptor.page), fileName);
    const target = path.join(context.assetsRoot, assetRelative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (!fs.existsSync(target)) fs.copyFileSync(sourceAsset, target);
    const finalAsset = path.join(apiDocsRoot, 'assets', assetRelative);
    const finalMarkdown = path.join(apiDocsRoot, 'normalized', descriptor.outputRelative);
    element.attr('src', path.relative(path.dirname(finalMarkdown), finalAsset).split(path.sep).join('/'));
  });
}

function rewriteLinks($, root, descriptor, context, warnings) {
  root.find('a[href]').each((_, link) => {
    const element = $(link);
    const href = element.attr('href');
    if (!href || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    let targetPage = descriptor.page;
    let anchor = '';
    if (href.startsWith('#')) {
      anchor = decodeURIComponent(href.slice(1));
    } else {
      try {
        const url = new URL(href, descriptor.page.source_url);
        anchor = decodeURIComponent(url.hash.slice(1));
        url.hash = '';
        targetPage = context.pageLookup.get(`${url.origin}${url.pathname}${url.search}`)
          || context.pageLookup.get(`${url.origin}${url.pathname}`);
        if (!targetPage) {
          element.attr('href', url.href + (anchor ? `#${encodeURIComponent(anchor)}` : ''));
          return;
        }
      } catch {
        warnings.push('link_unresolvable');
        return;
      }
    }
    const target = anchor ? context.anchorMap.get(`${targetPage.local_file_path}#${anchor}`) : null;
    if (target) {
      const relative = path.relative(path.dirname(descriptor.outputFile), target.file).split(path.sep).join('/');
      element.attr('href', `${target.file === descriptor.outputFile ? '' : relative}#${target.anchor}`);
    } else if (anchor) {
      const source = targetPage.source_url || descriptor.page.source_url;
      element.attr('href', `${source.split('#')[0]}#${encodeURIComponent(anchor)}`);
      warnings.push('source_anchor_not_mapped');
    } else {
      element.attr('href', targetPage.source_url || href);
    }
  });
}

function stripNoiseAttributes($, root) {
  root.find('*').each((_, node) => {
    const element = $(node);
    for (const name of Object.keys(node.attribs || {})) {
      const keep = name === 'href' || name === 'src' || name === 'alt' || name === 'title'
        || name === 'id' || name === 'data-protected-code' || name === 'data-code-language'
        || name === 'data-preserve-table' || name === 'rowspan' || name === 'colspan';
      if (!keep) element.removeAttr(name);
    }
  });
}

function removeEmptyPlaceholders($, root) {
  root.find('div,span,p').toArray().reverse().forEach((node) => {
    const element = $(node);
    if (element.find('img,table,pre,code,a[href]').length) return;
    if (!element.text().replace(/[\s\u200b\ufeff]/g, '')) element.remove();
  });
}

function createTurndown() {
  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
  });
  service.use(gfm);
  service.addRule('protectedCode', {
    filter: (node) => node.nodeName === 'PRE' && node.getAttribute('data-protected-code'),
    replacement: (_content, node) => fencedCode(
      Buffer.from(node.getAttribute('data-protected-code'), 'base64').toString('utf8'),
      node.getAttribute('data-code-language') || '',
    ),
  });
  service.addRule('preservedTable', {
    filter: (node) => node.nodeName === 'TABLE' && node.getAttribute('data-preserve-table') === 'true',
    replacement: (_content, node) => `\n\n${node.outerHTML.replace(/\sdata-preserve-table="true"/, '')}\n\n`,
  });
  service.addRule('anchoredHeading', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: (content, node) => {
      const level = Number(node.nodeName.slice(1));
      const id = node.getAttribute('id');
      const anchor = id ? `<a id="${escapeHtmlAttribute(id)}"></a>\n\n` : '';
      return `\n\n${anchor}${'#'.repeat(level)} ${content.trim()}\n\n`;
    },
  });
  return service;
}

function escapeHtmlAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function compareJoinQuantMainApi(pages) {
  const main = pages.find((page) => page.platform === 'joinquant' && page.slug === 'main');
  const api = pages.find((page) => page.platform === 'joinquant' && page.slug === 'api');
  if (!main || !api) return { main, api, alias: false, similarity: 0 };
  const text = (page) => {
    const $ = cheerio.load(fs.readFileSync(page.local_file_path, 'utf8'));
    const root = $(platformRule(page).contentSelector).clone();
    root.find('script,style,svg,.anchorjs-link,.header-anchor').remove();
    const headings = root.find('h1,h2,h3,h4,h5,h6').map((_, h) => `${h.tagName}:${cleanTitle($(h).text())}`).get().join('|');
    return `${headings}\n${root.text()}`;
  };
  const similarity = textSimilarity(text(main), text(api));
  return { main, api, alias: similarity >= 0.9999, similarity };
}

function failedManifest(descriptor, error) {
  const page = descriptor.page;
  return {
    platform: page.platform, variant: page.variant ?? null, source_role: page.source_role ?? null,
    document_type: page.document_type, title: descriptor.title, section_path: buildSectionPath(descriptor), source_file: sourcePath(page),
    source_url: page.source_url ?? null, source_anchor: descriptor.anchor ? `#${descriptor.anchor}` : null, source_sha256: page.sha256,
    markdown_file: null, markdown_sha256: null, converter: 'turndown', conversion_status: 'failed',
    processing_status: 'failed', conversion_warnings: [String(error.message || error)], canonical: true,
    alias_of: null, character_count: 0, heading_count: 0, fenced_code_block_count: 0,
    markdown_table_count: 0, preserved_html_table_count: 0, image_count: 0,
  };
}

function aliasManifest(main, api, similarity) {
  return {
    platform: main.platform, variant: main.variant, source_role: main.source_role,
    document_type: main.document_type, title: main.title, section_path: [], source_file: sourcePath(main),
    source_url: main.source_url, source_anchor: null, source_sha256: main.sha256, markdown_file: null,
    markdown_sha256: null, converter: 'turndown', conversion_status: 'alias', processing_status: 'alias',
    conversion_warnings: [`semantic_duplicate_similarity_${similarity.toFixed(6)}`], canonical: false,
    alias_of: sourcePath(api), character_count: 0, heading_count: 0, fenced_code_block_count: 0,
    markdown_table_count: 0, preserved_html_table_count: 0, image_count: 0,
  };
}

function sourcePath(page) {
  return projectRelative(projectRoot, page.local_file_path);
}

function evaluatePage(page, build) {
  const outputs = build.converted.filter((item) => item.descriptor.page.local_file_path === page.local_file_path);
  const markdown = outputs.map((item) => item.markdownBody).join('\n');
  const rootMatched = outputs.length > 0;
  const checks = {
    body_extracted: rootMatched && markdown.length > 500,
    navigation_removed: !/量化研究平台\s+策略回测\s+模拟列表|登录\s+注册\s+首页/.test(markdown),
    headings_preserved: outputs.reduce((sum, item) => sum + item.manifest.heading_count, 0) > 0,
    code_fences_closed: fencesClosed(markdown),
    code_indentation_present: /```(?:python)?\n[\s\S]*\n {2,}\S/m.test(markdown),
    chinese_clean: !markdown.includes('\uFFFD'),
    links_preserved: /\[[^\]]+\]\([^)]+\)/.test(markdown),
    nonempty_outputs: outputs.every((item) => semanticText(item.markdownBody).length > 10),
  };
  const tableCount = outputs.reduce((sum, item) => sum + item.manifest.markdown_table_count + item.manifest.preserved_html_table_count, 0);
  checks.tables_preserved = page.table_count === 0 || tableCount > 0;
  checks.no_failed_chunks = !build.manifest.some((row) => row.source_file === sourcePath(page) && row.processing_status === 'failed');
  const pass = Object.values(checks).every(Boolean);
  return {
    sample: `${page.platform}/${page.variant}/${sourceDocumentName(page)}`,
    output_count: outputs.length,
    markdown_characters: markdown.length,
    markdown_tables: outputs.reduce((sum, item) => sum + item.manifest.markdown_table_count, 0),
    html_tables: outputs.reduce((sum, item) => sum + item.manifest.preserved_html_table_count, 0),
    code_blocks: outputs.reduce((sum, item) => sum + item.manifest.fenced_code_block_count, 0),
    checks,
    pass,
  };
}

function fencesClosed(markdown) {
  const stack = [];
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (!match) continue;
    if (!stack.length) stack.push(match[1]);
    else if (match[1][0] === stack[0][0] && match[1].length >= stack[0].length) stack.pop();
  }
  return stack.length === 0;
}

function evaluationReport(results, passed) {
  let pandoc = false;
  try {
    execFileSync('pandoc', ['--version'], { stdio: 'ignore' });
    pandoc = true;
  } catch {}
  const rows = results.map((item) => `| ${item.sample} | ${item.output_count} | ${item.code_blocks} | ${item.markdown_tables} | ${item.html_tables} | ${item.pass ? '通过' : '失败'} |`).join('\n');
  const failed = results.flatMap((item) => Object.entries(item.checks).filter(([, ok]) => !ok).map(([name]) => `${item.sample}: ${name}`));
  return `# 转换器评估报告

## 候选方案

- 主候选：Cheerio 1.1.2 + Turndown 7.2.1 + turndown-plugin-gfm 1.0.2。
- 对照候选：Pandoc（仅在本机已安装时执行）。
- 备用候选：rehype-remark；本次样本未出现必须引入第二套主流程的结构，因此未启用。

## 四个样本结果

| 样本 | 输出文件 | 代码块 | GFM表格 | 保留HTML表格 | 结果 |
|---|---:|---:|---:|---:|---|
${rows}

样本检查覆盖正文提取、导航清除、标题、代码围栏与缩进、表格、中文、链接和非空输出。${failed.length ? `未通过项：${failed.join('；')}。` : '全部自动样本检查通过。'}

## Turndown 方案评估

优点：转换行为稳定、ATX 标题和 CommonMark 列表可控，GFM 插件能处理简单二维表格，适合通过自定义规则保护代码和复杂表格。缺点：默认规则不了解平台正文边界、Shiki/VitePress 代码包装、跨文件锚点和 rowspan/colspan，需要项目适配层。

## Pandoc 对照

${pandoc ? '本机存在 Pandoc，已确认可调用；主流程仍采用 Turndown，以保持 DOM 清理、代码保护和复杂表格回退规则的一致性。' : '本机未安装 Pandoc，未执行 Pandoc 对照；按任务要求不安装系统级工具，此项不阻塞主流程。'}

## 最终选型与自定义规则

最终选用 Cheerio + Turndown + turndown-plugin-gfm。适配层负责平台正文选择器、交互噪声清理、稳定标题拆分、代码原文保护和语言识别、复杂表格 HTML 回退、链接与图片重写、Front Matter、稳定 slug、JoinQuant 去重和 QA。

已知缺陷：原始页面中无法映射到归档章节的锚点会回退到原始来源 URL 并记 warning；远程图片保留完整 URL，不伪造本地资源；疑似源代码错误保持原文。

## 批量执行结论

批量执行结论：**${passed ? '通过' : '未通过'}**。${passed ? '样本输出适合按相同规则批量执行，并适合作为后续 API 索引的 Markdown 输入。' : '样本规则需要修正后重新评估，当前不得批量转换。'}
`;
}

function conversionReport(build, pages) {
  const sourceStatuses = new Map();
  for (const row of build.manifest) {
    const previous = sourceStatuses.get(row.source_file);
    if (!previous || row.processing_status === 'failed' || row.processing_status === 'alias') sourceStatuses.set(row.source_file, row.processing_status);
    else if (row.processing_status === 'split') sourceStatuses.set(row.source_file, 'split');
  }
  const statusCounts = {};
  for (const status of sourceStatuses.values()) statusCounts[status] = (statusCounts[status] || 0) + 1;
  const markdownRows = build.manifest.filter((row) => row.markdown_file);
  const platformCounts = {};
  for (const row of markdownRows) {
    const key = `${row.platform}/${row.variant}`;
    platformCounts[key] = (platformCounts[key] || 0) + 1;
  }
  const warningCounts = {};
  for (const row of build.manifest) for (const warning of row.conversion_warnings || []) warningCounts[warning] = (warningCounts[warning] || 0) + 1;
  const sum = (field) => markdownRows.reduce((total, row) => total + (row[field] || 0), 0);
  return `# Markdown 转换报告

## 汇总

- 输入来源：${pages.length}
- 输出 Markdown：${markdownRows.length}
- 来源状态：converted=${statusCounts.converted || 0}, split=${statusCounts.split || 0}, alias=${statusCounts.alias || 0}, skipped_with_reason=${statusCounts.skipped_with_reason || 0}, failed=${statusCounts.failed || 0}
- 简单 GFM 表格：${sum('markdown_table_count')}
- 保留复杂 HTML 表格：${sum('preserved_html_table_count')}
- 围栏代码块：${sum('fenced_code_block_count')}
- Markdown 图片引用：${sum('image_count')}
- 本地归档图片：${walkFiles(path.join(build.buildRoot, 'assets')).length}

## 平台与版本

${Object.entries(platformCounts).sort().map(([key, value]) => `- ${key}: ${value} 个 Markdown`).join('\n')}

PTrade 国金保持 primary，申万保持 supplementary；两版本位于独立目录，未合并同名接口。QMT 仅使用现有结构化 HTML，未读取或 OCR PDF。JoinQuant 的 strategy、market_data、factor、research_data、finance、faq 按来源文档和章节独立转换。

## JoinQuant 主文档去重

- main/api 清洗正文相似度：${build.joinquantComparison.similarity.toFixed(6)}
- 判定：${build.joinquantComparison.equivalent ? '实质等价；api/rendered.html 为 canonical，main/rendered.html 作为 alias，不生成重复正文。' : '存在实质差异；两份文档分别保留。'}
- canonical：${build.joinquantComparison.canonical_source || 'null'}
- alias：${build.joinquantComparison.alias_source || 'null'}

## 转换警告

${Object.keys(warningCounts).length ? Object.entries(warningCounts).sort().map(([key, value]) => `- ${key}: ${value}`).join('\n') : '- 无'}

## 失败

${(statusCounts.failed || 0) === 0 ? '无失败来源。' : build.manifest.filter((row) => row.processing_status === 'failed').map((row) => `- ${row.source_file}: ${(row.conversion_warnings || []).join('; ')}`).join('\n')}
`;
}
