import test from 'node:test';
import assert from 'node:assert/strict';
import { fencedCode, stableSlug, textSimilarity } from '../markdown-utils.mjs';

test('stableSlug is deterministic and gives Chinese headings a hash fallback', () => {
  assert.equal(stableSlug('get_market_data_ex'), 'get-market-data-ex');
  assert.equal(stableSlug('行情接口', 'qmt'), stableSlug('行情接口', 'qmt'));
  assert.match(stableSlug('行情接口', 'qmt'), /^qmt-[0-9a-f]{8}$/);
});

test('fencedCode preserves indentation and expands the outer fence', () => {
  const result = fencedCode('def f():\n    print("```")', 'python');
  assert.match(result, /````python/);
  assert.match(result, /    print/);
});

test('textSimilarity recognizes equivalent normalized text', () => {
  assert.equal(textSimilarity('参数 说明\n返回值', '参数说明 返回值'), 1);
});
