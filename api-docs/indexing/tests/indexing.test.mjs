import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSignatureParameters } from '../extract_symbols.mjs';
import { EXCLUDED_SYMBOLS, detectEnvironments } from '../platform-rules.mjs';

test('multiline signatures preserve parameter order and defaults', () => {
  const parameters = parseSignatureParameters("f(a, b='x,y', c=None, *, enabled=True)");
  assert.deepEqual(parameters.map((item) => item.name), ['a', 'b', 'c', 'enabled']);
  assert.equal(parameters[1].default, "'x,y'");
  assert.equal(parameters[3].required, false);
});

test('Python builtins and literals are excluded', () => {
  for (const name of ['False', 'True', 'None', '__init__', 'eval', 'abs', 'len']) assert.equal(EXCLUDED_SYMBOLS.has(name), true);
});

test('environment detection uses explicit source wording', () => {
  assert.deepEqual(detectEnvironments('✅研究 ✅回测 ✅交易'), ['research', 'backtest', 'live_trade']);
  assert.deepEqual(detectEnvironments('未说明适用环境'), ['unknown']);
});
