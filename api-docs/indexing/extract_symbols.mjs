import { cleanMarkdownText, firstParagraph, sha256, shortId } from './common.mjs';
import { CALLBACKS, EXCLUDED_SYMBOLS, canonicalizeName, classifyRecord, detectEnvironments, platformRule } from './platform-rules.mjs';

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?$/;
const NON_API_TITLES = /^(示例|参数|返回|返回值|注意|说明|接口说明|接口定义|使用场景|中文名|调用方法|调用用法|备注|数据|字段|代码|安装|概述|目录)/i;

export function extractSymbols(document, parsed) {
  if (document.platform === 'qmt' && /--doc-(?:code-examples|question-answer|interface-operation|start-now)\.md$/.test(document.markdown_file)) return [];
  const symbols = [];
  const seen = new Set();
  for (const heading of parsed.headings) {
    const candidates = headingCandidates(heading, document, parsed);
    if (!candidates.length) continue;
    const sectionLines = parsed.lines.slice(heading.line + 1, heading.endLine);
    const sectionText = sectionLines.join('\n');
    const signatureMap = findSignatures(sectionText, candidates.map((item) => item.qualifiedName));
    const factorFallback = document.document_type === 'factor' ? firstCallSignature(sectionText) : null;
    for (const originalCandidate of candidates) {
      let candidate = originalCandidate;
      let signature = signatureMap.get(candidate.qualifiedName) || null;
      if (!signature && factorFallback && /^[A-Z][A-Z0-9_-]*$/.test(candidate.qualifiedName)) {
        const qualifiedName = factorFallback.slice(0, factorFallback.indexOf('(')).trim();
        candidate = { ...candidate, qualifiedName, name: qualifiedName.split('.').at(-1) };
        signature = factorFallback;
      }
      const formalHeading = candidate.formalHeading;
      const isCallback = CALLBACKS[document.platform]?.has(candidate.name);
      const isObject = candidate.objectLike;
      const isDataTable = candidate.dataTable;
      if (!signature && !formalHeading && !isCallback && !isObject && !isDataTable) continue;
      if (!signature && document.document_type === 'factor' && !/^alpha_\d{3}$/.test(candidate.name)) continue;
      if (!signature && !isCallback && !isObject && !isDataTable && document.document_type !== 'factor') continue;
      if (EXCLUDED_SYMBOLS.has(candidate.name)) continue;
      const key = `${document.id}\u0000${candidate.qualifiedName}\u0000${heading.line}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const extractionWarnings = [];
      let parameters = signature ? parseSignatureParameters(signature) : [];
      if (signature && signature.slice(signature.indexOf('(') + 1, signature.lastIndexOf(')')).trim() && parameters.length === 0) {
        if (document.platform === 'qmt' && looksLikeConcreteInvocation(signature)) {
          signature = null;
          parameters = [];
          extractionWarnings.push('example_call_not_used_as_signature');
        } else extractionWarnings.push('signature_parse_failed');
      }
      enrichParameters(parameters, sectionLines);
      const displayParts = splitDisplayName(heading.title, candidate.qualifiedName);
      const recordType = isDataTable ? 'data_table' : classifyRecord({
        platform: document.platform,
        documentType: document.document_type,
        name: candidate.name,
        qualifiedName: candidate.qualifiedName,
        title: heading.title,
        headingPath: heading.path,
      });
      const confidence = signature && !extractionWarnings.includes('signature_parse_failed') ? 'high' : 'medium';
      const id = shortId('sym', document.id, candidate.qualifiedName, String(heading.line), recordType);
      const summary = extractSummary(sectionLines);
      const evidenceType = signature ? 'formal_signature' : (isObject ? 'formal_object_definition' : isDataTable ? 'formal_data_table_heading' : 'formal_heading');
      const evidenceExcerpt = [heading.title, signature, summary].filter(Boolean).join(' | ').slice(0, 500);
      symbols.push({
        id,
        document_id: document.id,
        platform: document.platform,
        variant: document.variant,
        source_role: document.source_role,
        resolution_priority: document.resolution_priority,
        record_type: recordType,
        canonical_name: candidate.name,
        qualified_name: candidate.qualifiedName,
        display_name: displayParts.displayName,
        aliases: displayParts.aliases,
        summary,
        category_path: heading.path,
        signature,
        signatures: signature ? [signature] : [],
        parameters,
        returns: extractReturns(sectionLines),
        exceptions: [],
        environments: detectEnvironments(sectionText),
        asset_types: [],
        frequency_support: [],
        availability_notes: null,
        deprecation_status: null,
        version_notes: [],
        related_symbols: [],
        example_refs: [],
        source_anchor: heading.anchor || document.source_anchor,
        source_file: document.source_file,
        source_url: document.source_url,
        markdown_file: document.markdown_file,
        evidence_type: evidenceType,
        evidence_heading: heading.title,
        evidence_excerpt: evidenceExcerpt,
        evidence: {
          heading: heading.title,
          line_start: heading.fileLine + 1,
          line_end: heading.endFileLine,
          signature_source: signature ? 'formal_code_block' : (formalHeading ? 'formal_heading' : 'none'),
        },
        confidence,
        review_required: confidence === 'low' || extractionWarnings.includes('signature_parse_failed'),
        extraction_warnings: extractionWarnings,
        content_sha256: sha256([candidate.qualifiedName, signature || '', evidenceExcerpt].join('\u0000')),
      });
    }
  }
  symbols.push(...extractObjectFields(document, parsed, symbols));
  return deduplicateDocumentSymbols(symbols);
}

function headingCandidates(heading, document, parsed) {
  if (NON_API_TITLES.test(heading.title)) return [];
  const title = canonicalizeName(heading.title);
  const rawFirst = title.split(/\s+-\s+|\s+—\s+|-(?=[\u4e00-\u9fff（])/)[0].trim();
  const values = rawFirst.includes('/') ? rawFirst.split('/') : [rawFirst];
  const candidates = [];
  for (let value of values) {
    value = value.replace(/\((?:必选|可选|推荐)\)$/u, '').trim();
    const prefix = value.match(/^([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?)/)?.[1];
    if (!prefix || !IDENTIFIER.test(prefix)) continue;
    const name = prefix.split('.').at(-1);
    const exactAnchor = heading.anchor === prefix || heading.anchor === name;
    const codeStyled = heading.raw.includes('`');
    const callback = CALLBACKS[document.platform]?.has(name);
    const objectLike = /\b(?:对象|数据类|class)\b/i.test(heading.title) || /^(Context|Order|Portfolio|Position|SecurityUnitData|Tick|Bar|Event|OrderStyle|OrderStatus)$/.test(name);
    const dataTable = document.document_type === 'finance' && /^([a-z][a-z0-9_]+)$/i.test(name) && /(?:表|数据|能力|指标)/.test(heading.title);
    const qmtFunctionDocument = document.platform === 'qmt' && /--doc-(?:data|drawing|quote|system|trading)-function\.md$/.test(document.markdown_file);
    const formalHeading = exactAnchor || codeStyled || callback || objectLike || dataTable || document.document_type === 'factor' || qmtFunctionDocument;
    candidates.push({ qualifiedName: prefix, name, formalHeading, objectLike, dataTable });
  }
  return candidates;
}

function findSignatures(sectionText, qualifiedNames) {
  const result = new Map();
  const blocks = [...sectionText.matchAll(/(?:^|\n)(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n\1(?=\n|$)/g)].map((match) => match[2]);
  blocks.push(...[...sectionText.matchAll(/(?:调用方法|调用用法|接口定义)[^\n`]*`([^`]+\([^`]+\))`/g)].map((match) => match[1]));
  for (const qualifiedName of qualifiedNames) {
    const escaped = qualifiedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const block of blocks) {
      const pattern = new RegExp(`(?:^|\\n)\\s*(?:def\\s+)?(${escaped})\\s*\\(`, 'm');
      const match = pattern.exec(block);
      if (!match) continue;
      const start = match.index + match[0].lastIndexOf(match[1]);
      const signature = balancedCall(block, start);
      if (signature) {
        result.set(qualifiedName, signature);
        break;
      }
    }
  }
  return result;
}

function firstCallSignature(sectionText) {
  const blocks = [...sectionText.matchAll(/(?:^|\n)(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n\1(?=\n|$)/g)].map((match) => match[2]);
  for (const block of blocks) {
    const match = /(?:^|\n)\s*(?:def\s+)?([A-Za-z_][A-Za-z0-9_.]*)\s*\(/m.exec(block);
    if (!match) continue;
    const start = match.index + match[0].lastIndexOf(match[1]);
    const value = balancedCall(block, start);
    if (value) return value;
  }
  return null;
}

function deduplicateDocumentSymbols(symbols) {
  const result = [];
  const seen = new Set();
  for (const symbol of symbols.sort((a, b) => a.evidence.line_start - b.evidence.line_start)) {
    const key = `${symbol.record_type}\u0000${symbol.qualified_name}\u0000${symbol.signature || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(symbol);
  }
  return result;
}

function balancedCall(text, start) {
  const open = text.indexOf('(', start);
  if (open < 0) return null;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = open; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') quote = char;
    else if (char === '(') depth += 1;
    else if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        let value = text.slice(start, i + 1).trim();
        value = value.replace(/^def\s+/, '').replace(/[ \t]+$/gm, '');
        return value;
      }
    }
  }
  return null;
}

export function parseSignatureParameters(signature) {
  const open = signature.indexOf('(');
  const close = signature.lastIndexOf(')');
  if (open < 0 || close <= open) return [];
  const pieces = splitTopLevel(signature.slice(open + 1, close));
  return pieces.map((piece) => {
    const cleaned = piece.replace(/#[^\n]*/g, '').replace(/\s+/g, ' ').trim();
    if (!cleaned || cleaned === '/' || cleaned === '*') return null;
    const match = cleaned.match(/^\*{0,2}([A-Za-z_][A-Za-z0-9_]*)(?:\s*:\s*([^=]+?))?(?:\s*=\s*([\s\S]+))?$/);
    if (!match) return null;
    return {
      name: match[1],
      type: match[2]?.trim() || null,
      default: match[3]?.trim() || null,
      required: match[3] === undefined ? null : false,
      description: null,
    };
  }).filter(Boolean);
}

function splitTopLevel(value) {
  const result = [];
  let current = '';
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (const char of value) {
    if (quote) {
      current += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') quote = char;
    else if ('([{'.includes(char)) depth += 1;
    else if (')]}'.includes(char)) depth -= 1;
    if (char === ',' && depth === 0) {
      result.push(current);
      current = '';
    } else current += char;
  }
  if (current.trim()) result.push(current);
  return result;
}

function enrichParameters(parameters, lines) {
  for (const parameter of parameters) {
    const escaped = parameter.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const namePattern = `\\x60?${escaped}\\x60?`;
    const patterns = [
      new RegExp(`^\\s*\\*{0,2}${namePattern}\\*{0,2}\\s*[：:]\\s*(.+)$`),
      new RegExp(`^\\s*[-*+]\\s+\\*{0,2}${namePattern}\\*{0,2}\\s*[：:]\\s*(.+)$`),
    ];
    for (let i = 0; i < lines.length; i += 1) {
      const match = patterns.map((pattern) => lines[i].match(pattern)).find(Boolean);
      if (!match) continue;
      parameter.description = cleanMarkdownText(match[1]).slice(0, 1000) || null;
      if (/必填|必选/.test(match[1])) parameter.required = true;
      if (/选填|可选/.test(match[1])) parameter.required = false;
      break;
    }
    const marker = new RegExp(`^\\s*\\*{0,2}${namePattern}\\*{0,2}\\s*$`);
    const index = lines.findIndex((line) => marker.test(line));
    if (index >= 0) {
      const window = lines.slice(index + 1, index + 7).join('\n');
      const type = window.match(/类型[：:]\s*`?([^`\n]+)`?/);
      const defaultValue = window.match(/默认[：:]\s*`?([^`\n]+)`?/);
      if (type) parameter.type = cleanMarkdownText(type[1]);
      if (defaultValue) {
        parameter.default = cleanMarkdownText(defaultValue[1]);
        parameter.required = false;
      }
      const description = lines.slice(index + 1, index + 10).find((line) => line.trim() && !/^\s*[-*+]\s+(类型|默认)/.test(line));
      if (description) {
        parameter.description = cleanMarkdownText(description).slice(0, 1000) || parameter.description;
        if (/必填|必选/.test(description)) parameter.required = true;
        if (/选填|可选/.test(description)) parameter.required = false;
      }
    }
  }
}

function extractReturns(lines) {
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^#{1,6}\s+(?:返回|返回值|返回结果类型)\s*$/.test(lines[i]) && !/^\*\*(?:返回|返回值|返回结果类型)[：:]?\*\*/.test(lines[i])) continue;
    const sameLine = cleanMarkdownText(lines[i]).replace(/^(?:返回|返回值|返回结果类型)(?:[：:]|\s)+/, '');
    const description = sameLine || firstParagraph(lines.slice(i + 1, i + 20));
    if (description) return [{ type: explicitReturnType(description), description: description.slice(0, 1000), fields: [] }];
  }
  for (let i = 0; i < lines.length; i += 1) {
    const line = cleanMarkdownText(lines[i]);
    const inline = line.match(/^(?:返回|返回值|返回结果类型)[：:]\s*(.+)$/);
    if (inline && inline[1]) {
      const value = inline[1].slice(0, 1000);
      return [{ type: explicitReturnType(value), description: value, fields: [] }];
    }
  }
  return [];
}

function explicitReturnType(value) {
  return value.match(/^([A-Za-z_][A-Za-z0-9_.\[\] |/()-]*)[：:]/)?.[1] || null;
}

function extractSummary(lines) {
  const filtered = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(`{3,}|~{3,})/.test(line)) { inFence = !inFence; continue; }
    if (inFence || /^\s*(<a\s|#{1,6}\s|\|)/i.test(line)) continue;
    if (/^(python|md|json|sql)\s*$/i.test(line.trim())) continue;
    const text = cleanMarkdownText(line.replace(/^[-*+]\s+/, ''));
    if (!text || /^(中文名|接口说明|调用方法|调用用法|提示)$/.test(text)) continue;
    filtered.push(text);
    if (filtered.join(' ').length > 400) break;
  }
  return filtered.join(' ').slice(0, 500) || null;
}

function splitDisplayName(title, qualifiedName) {
  const cleaned = cleanMarkdownText(title);
  const escaped = qualifiedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const chinese = cleaned.replace(new RegExp(`^${escaped}(?:\\([^)]*\\))?\\s*[-—:]?\\s*`), '').trim();
  const aliases = chinese && chinese !== cleaned && chinese.length <= 80 ? [chinese] : [];
  return { displayName: aliases[0] ? `${qualifiedName} - ${aliases[0]}` : qualifiedName, aliases };
}

function looksLikeConcreteInvocation(signature) {
  const body = signature.slice(signature.indexOf('(') + 1, signature.lastIndexOf(')')).trim();
  return /^(?:['"\d\-\[])/.test(body) || /\.[A-Za-z_][A-Za-z0-9_]*(?:\s*,|\s*$)/.test(body);
}

function extractObjectFields(document, parsed, symbols) {
  const result = [];
  const objects = symbols.filter((symbol) => ['object', 'class'].includes(symbol.record_type));
  for (const object of objects) {
    const heading = parsed.headings.find((item) => item.fileLine + 1 === object.evidence.line_start);
    if (!heading) continue;
    const lines = parsed.lines.slice(heading.line + 1, heading.endLine);
    const tableRows = parseMarkdownTables(lines);
    for (const table of tableRows) {
      if (!table.headers.some((value) => /字段|属性|名称|参数|变量/.test(value))) continue;
      const nameIndex = table.headers.findIndex((value) => /字段|属性|名称|参数|变量/.test(value));
      const typeIndex = table.headers.findIndex((value) => /类型/.test(value));
      const descriptionIndex = table.headers.findIndex((value) => /说明|描述|含义/.test(value));
      for (const rowEntry of table.rows) {
        const row = rowEntry.cells;
        const name = cleanMarkdownText(row[nameIndex] || '');
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || EXCLUDED_SYMBOLS.has(name)) continue;
        const qualifiedName = `${object.canonical_name}.${name}`;
        result.push({
          id: shortId('sym', document.id, qualifiedName, String(table.line), 'field'),
          document_id: document.id,
          platform: document.platform,
          variant: document.variant,
          source_role: document.source_role,
          resolution_priority: document.resolution_priority,
          record_type: 'field',
          canonical_name: name,
          qualified_name: qualifiedName,
          display_name: qualifiedName,
          aliases: [],
          summary: descriptionIndex >= 0 ? cleanMarkdownText(row[descriptionIndex] || '') || null : null,
          category_path: [...heading.path, object.canonical_name],
          signature: null,
          signatures: [],
          parameters: [],
          returns: typeIndex >= 0 ? [{ type: cleanMarkdownText(row[typeIndex] || '') || null, description: descriptionIndex >= 0 ? cleanMarkdownText(row[descriptionIndex] || '') || null : null, fields: [] }] : [],
          exceptions: [],
          environments: ['unknown'],
          asset_types: [],
          frequency_support: [],
          availability_notes: null,
          deprecation_status: null,
          version_notes: [],
          related_symbols: [],
          example_refs: [],
          source_anchor: heading.anchor || document.source_anchor,
          source_file: document.source_file,
          source_url: document.source_url,
          markdown_file: document.markdown_file,
          evidence_type: 'formal_object_field_table',
          evidence_heading: heading.title,
          evidence_excerpt: row.map(cleanMarkdownText).join(' | ').slice(0, 500),
          evidence: { heading: heading.title, line_start: heading.fileLine + rowEntry.line + 2, line_end: heading.fileLine + rowEntry.line + 2, signature_source: 'none' },
          confidence: 'high',
          review_required: false,
          extraction_warnings: [],
          content_sha256: sha256([qualifiedName, row.join('|')].join('\u0000')),
        });
      }
    }
  }
  return result;
}

function parseMarkdownTables(lines) {
  const tables = [];
  for (let i = 0; i + 1 < lines.length; i += 1) {
    if (!/^\s*\|/.test(lines[i]) || !/^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[i + 1])) continue;
    const split = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
    const headers = split(lines[i]).map(cleanMarkdownText);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && /^\s*\|/.test(lines[j])) { rows.push({ cells: split(lines[j]), line: j }); j += 1; }
    tables.push({ headers, rows, line: i + 1 });
    i = j - 1;
  }
  return tables;
}

export function buildAliasRows(symbols, documentAliases) {
  const rows = [...documentAliases];
  for (const symbol of symbols) {
    for (const alias of symbol.aliases) {
      rows.push({
        id: shortId('alias', symbol.id, alias),
        alias_type: 'explicit_display_name',
        platform: symbol.platform,
        variant: symbol.variant,
        alias,
        target_id: symbol.id,
        target_type: 'symbol',
        evidence: { markdown_file: symbol.markdown_file, source_anchor: symbol.source_anchor },
      });
    }
  }
  return rows;
}

export function buildConflictRows(symbols) {
  const groups = new Map();
  for (const symbol of symbols.filter((item) => item.platform === 'ptrade' && item.record_type !== 'field')) {
    const key = `${symbol.record_type}\u0000${symbol.canonical_name}`;
    if (!groups.has(key)) groups.set(key, { guojin: [], shenwan: [] });
    groups.get(key)[symbol.variant]?.push(symbol);
  }
  const conflicts = [];
  for (const [key, variants] of groups) {
    const [recordType, name] = key.split('\u0000');
    const primary = bestSymbol(variants.guojin);
    const supplementary = bestSymbol(variants.shenwan);
    if (!primary && !supplementary) continue;
    const types = [];
    if (!primary) types.push('only_in_supplementary');
    else if (!supplementary) types.push('only_in_primary');
    else {
      if (normalize(primary.signature) !== normalize(supplementary.signature)) types.push('signature');
      if (normalize(primary.parameters) !== normalize(supplementary.parameters)) types.push('parameters');
      if (normalize(primary.returns) !== normalize(supplementary.returns)) types.push('returns');
      if (normalize(primary.environments) !== normalize(supplementary.environments)) types.push('environments');
      if (normalize(primary.summary) !== normalize(supplementary.summary)) types.push('description');
    }
    if (!types.length) continue;
    conflicts.push({
      id: shortId('conflict', recordType, name),
      platform: 'ptrade',
      canonical_name: name,
      record_type: recordType,
      primary_symbol_id: primary?.id || null,
      supplementary_symbol_id: supplementary?.id || null,
      conflict_types: types,
      signature_difference: primary && supplementary && normalize(primary.signature) !== normalize(supplementary.signature) ? { primary: primary.signature, supplementary: supplementary.signature } : null,
      parameter_difference: primary && supplementary && normalize(primary.parameters) !== normalize(supplementary.parameters) ? { primary: primary.parameters, supplementary: supplementary.parameters } : null,
      return_difference: primary && supplementary && normalize(primary.returns) !== normalize(supplementary.returns) ? { primary: primary.returns, supplementary: supplementary.returns } : null,
      environment_difference: primary && supplementary && normalize(primary.environments) !== normalize(supplementary.environments) ? { primary: primary.environments, supplementary: supplementary.environments } : null,
      description_difference: primary && supplementary && normalize(primary.summary) !== normalize(supplementary.summary) ? { primary: primary.summary, supplementary: supplementary.summary } : null,
      resolution: primary ? 'prefer_primary' : 'supplementary_only',
      review_required: false,
      evidence_refs: [primary, supplementary].filter(Boolean).map((item) => ({ symbol_id: item.id, markdown_file: item.markdown_file, source_anchor: item.source_anchor })),
      merged: false,
    });
  }
  return conflicts;
}

function bestSymbol(values = []) {
  return [...values].sort((a, b) => (a.confidence === 'high' ? -1 : 1) - (b.confidence === 'high' ? -1 : 1) || a.id.localeCompare(b.id, 'en'))[0] || null;
}

function normalize(value) {
  return JSON.stringify(value ?? null).replace(/\s+/g, '');
}
