export const EXCLUDED_SYMBOLS = new Set([
  'False', 'True', 'None', '__init__', 'eval', 'abs', 'all', 'any', 'bin', 'bool',
  'bytes', 'callable', 'chr', 'classmethod', 'compile', 'complex', 'delattr', 'dict',
  'dir', 'divmod', 'enumerate', 'exec', 'filter', 'float', 'format', 'frozenset',
  'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int',
  'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max', 'memoryview',
  'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print', 'property', 'range',
  'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'staticmethod',
  'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip', '__new__', 'count', 'var',
  'log', 'key', 'daily', 'python', 'func', 'xxx'
]);

export const CALLBACKS = {
  ptrade: new Set(['initialize', 'before_trading_start', 'handle_data', 'after_trading_end', 'tick_data', 'handle_tick', 'on_strategy_end']),
  qmt: new Set(['init', 'after_init', 'handlebar', 'account_callback', 'task_callback', 'order_callback', 'deal_callback', 'position_callback', 'orderError_callback', 'order_callback', 'deal_callback']),
  joinquant: new Set(['initialize', 'process_initialize', 'after_code_changed', 'before_trading_start', 'handle_data', 'handle_tick', 'after_trading_end', 'on_strategy_end'])
};

export const PLATFORM_RULES = {
  'ptrade/guojin': { resolution_priority: 100, authority: 'primary', namespace: 'ptrade.guojin' },
  'ptrade/shenwan': { resolution_priority: 50, authority: 'supplementary', namespace: 'ptrade.shenwan' },
  'qmt/builtin-python': { resolution_priority: 100, authority: 'primary', namespace: 'qmt.builtin_python' },
  'joinquant/web-help': { resolution_priority: 100, authority: 'primary', namespace: 'joinquant.web_help' }
};

export function platformRule(platform, variant) {
  const rule = PLATFORM_RULES[`${platform}/${variant}`];
  if (!rule) throw new Error(`No platform rule for ${platform}/${variant}`);
  return rule;
}

export function classifyRecord({ platform, documentType, name, qualifiedName, title, headingPath }) {
  if (CALLBACKS[platform]?.has(name)) return 'callback';
  if (documentType === 'factor') {
    if (/technicalanalysis/i.test(headingPath.join('/')) || /^[A-Z][A-Z0-9_]{1,15}$/.test(name)) return 'indicator';
    return 'factor';
  }
  if (/^(Context|Order|Portfolio|Position|SecurityUnitData|Tick|Bar|Event|OrderStyle|OrderStatus)$/.test(name)) return 'object';
  if (/^[A-Z][A-Za-z0-9_]+$/.test(name) && !qualifiedName.includes('.')) return 'class';
  if (/callback/i.test(title) && !name.includes('.')) return 'callback';
  if (qualifiedName.includes('.')) return 'method';
  return 'api_function';
}

export function detectEnvironments(text) {
  const environments = [];
  const pairs = [
    ['research', /(?:✅\s*)?研究(?:环境|模块|中|\s|、|，)/],
    ['backtest', /(?:✅\s*)?回测(?:环境|模块|中|\s|、|，)/],
    ['simulation', /(?:✅\s*)?模拟(?:交易|环境|盘|中|\s|、|，)/],
    ['live_trade', /(?:✅\s*)?(?:实盘|交易模块|交易环境|交易中|交易(?=\s|$|、|，))/]
  ];
  for (const [value, pattern] of pairs) {
    if (pattern.test(text) && !new RegExp(`❌\\s*${value === 'research' ? '研究' : value === 'backtest' ? '回测' : value === 'simulation' ? '模拟' : '(?:实盘|交易)'}`).test(text)) environments.push(value);
  }
  if (/策略(?:环境|模块|中)/.test(text)) environments.push('strategy');
  return environments.length ? [...new Set(environments)] : ['unknown'];
}

export function canonicalizeName(value) {
  return value.replace(/\\_/g, '_').replace(/^`|`$/g, '').trim();
}
