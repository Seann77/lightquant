#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { API_DOCS_DIR, readJsonl } from './common.mjs';

const args = parseArgs(process.argv.slice(2));
const indexDir = path.resolve(args.index || path.join(API_DOCS_DIR, 'index'));
const symbols = readJsonl(path.join(indexDir, 'symbols.jsonl'));
const aliases = readJsonl(path.join(indexDir, 'aliases.jsonl'));
const chunks = readJsonl(path.join(indexDir, 'chunks.jsonl'));
const conflicts = readJsonl(path.join(indexDir, 'conflicts.jsonl'));
const aliasesByTarget = new Map();
for (const row of aliases.filter((item) => item.target_type === 'symbol')) {
  if (!aliasesByTarget.has(row.target_id)) aliasesByTarget.set(row.target_id, []);
  aliasesByTarget.get(row.target_id).push(row.alias);
}

const query = String(args.query || args.name || args.alias || '').trim();
const normalizedQuery = query.toLowerCase();
const symbolRows = symbols
  .filter((symbol) => !args.platform || symbol.platform === args.platform)
  .filter((symbol) => !args.variant || symbol.variant === args.variant)
  .filter((symbol) => !args['record-type'] || symbol.record_type === args['record-type'])
  .filter((symbol) => !args.category || symbol.category_path.some((value) => value.includes(args.category)))
  .map((symbol) => ({ symbol, score: scoreSymbol(symbol, aliasesByTarget.get(symbol.id) || [], normalizedQuery, args) }))
  .filter((item) => item.score >= 0)
  .map((item) => ({ result_type: 'symbol', score: item.score, ...item.symbol, conflicts: conflicts.filter((row) => row.primary_symbol_id === item.symbol.id || row.supplementary_symbol_id === item.symbol.id).map((row) => row.id) }));
const chunkRows = (!query || args.name || args.alias || args['record-type']) ? [] : chunks
  .filter((chunk) => !args.platform || chunk.platform === args.platform)
  .filter((chunk) => !args.variant || chunk.variant === args.variant)
  .filter((chunk) => !args.category || chunk.heading_path.some((value) => value.includes(args.category)))
  .filter((chunk) => chunk.content.toLowerCase().includes(normalizedQuery))
  .map((chunk) => ({ result_type: 'chunk', score: 100 + chunk.resolution_priority, ...chunk }));
const rows = [...symbolRows, ...chunkRows]
  .sort((a, b) => b.score - a.score || b.resolution_priority - a.resolution_priority || String(a.qualified_name || a.title).localeCompare(String(b.qualified_name || b.title), 'en') || a.id.localeCompare(b.id, 'en'))
  .slice(0, Number(args.limit || 50));

if (args.json) {
  process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
} else {
  if (!rows.length) console.log('No factual API records matched.');
  for (const row of rows) {
    if (row.result_type === 'symbol') console.log(`${row.score}\t${row.platform}/${row.variant}\t${row.source_role}\t${row.record_type}\t${row.qualified_name}\t${row.signature || ''}\tparams=${JSON.stringify(row.parameters)}\tconflicts=${row.conflicts.join(',')}\t${row.markdown_file}#${row.source_anchor || ''}`);
    else console.log(`${row.score}\t${row.platform}/${row.variant}\tchunk\t${row.title}\t${row.markdown_file}#${row.source_anchor || ''}`);
  }
}

function scoreSymbol(symbol, explicitAliases, needle, options) {
  const name = symbol.canonical_name.toLowerCase();
  const qualified = symbol.qualified_name.toLowerCase();
  const display = symbol.display_name.toLowerCase();
  const allAliases = [...symbol.aliases, ...explicitAliases].map((value) => value.toLowerCase());
  if (options.name && name !== String(options.name).toLowerCase() && qualified !== String(options.name).toLowerCase()) return -1;
  if (options.alias && !allAliases.includes(String(options.alias).toLowerCase())) return -1;
  if (!needle) return symbol.resolution_priority;
  if (name === needle) return 1000 + symbol.resolution_priority;
  if (qualified === needle) return 980 + symbol.resolution_priority;
  if (allAliases.includes(needle)) return 940 + symbol.resolution_priority;
  if (name.startsWith(needle) || qualified.startsWith(needle)) return 800 + symbol.resolution_priority;
  if (name.includes(needle) || qualified.includes(needle)) return 650 + symbol.resolution_priority;
  if (display.includes(needle)) return 500 + symbol.resolution_priority;
  if (symbol.category_path.some((value) => value.toLowerCase().includes(needle))) return 300 + symbol.resolution_priority;
  if (symbol.summary?.toLowerCase().includes(needle)) return 150 + symbol.resolution_priority;
  return -1;
}

function parseArgs(values) {
  const result = {};
  for (let i = 0; i < values.length; i += 1) {
    if (!values[i].startsWith('--')) continue;
    const key = values[i].slice(2);
    result[key] = values[i + 1] && !values[i + 1].startsWith('--') ? values[++i] : true;
  }
  return result;
}
