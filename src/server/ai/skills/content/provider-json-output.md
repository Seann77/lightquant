# JSON Output Requirement

必须返回一个 JSON 对象，字段如下：

{
  "scopeStatus": "in_scope | out_of_scope",
  "generatedCode": "string | null",
  "explanation": "string | null",
  "migrationNotes": "string | null",
  "riskWarnings": ["string"],
  "reportJson": {}
}

如果 scopeStatus 为 out_of_scope：

- generatedCode 必须为 null。
- explanation 使用当前 skill 的 outOfScopeResponse。
- riskWarnings 可以包含模块范围提醒。
- reportJson 至少包含 scopeStatus。

不要让模型覆盖服务端字段 skillId、skillVersion、displayName、costPoints；这些字段会由服务端最终写入 reportJson。
