export const ptradeRules = {
  variants: {
    guojin: { source_role: 'primary', resolution_priority: 100 },
    shenwan: { source_role: 'supplementary', resolution_priority: 50 },
  },
  api_heading: 'identifier heading with a nearby formal signature or API definition section',
  signature_sources: ['fenced code under API heading', 'explicit interface-definition inline code'],
  parameter_sources: ['formal parameter subsection', 'GFM parameter table'],
  return_sources: ['formal return subsection'],
  object_field_sources: ['object heading', 'formal object field table'],
  callbacks: ['initialize', 'before_trading_start', 'handle_data', 'after_trading_end', 'tick_data', 'handle_tick', 'on_strategy_end'],
  excluded_document_kinds: ['faq', 'example-only'],
  environment_markers: ['研究', '回测', '模拟', '交易', '实盘'],
  document_type_mapping: 'front matter document_type is authoritative',
};
