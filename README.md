# LightQuant Strategy Toolkit

面向聚宽（JoinQuant）和 PTrade 的 Codex 技能，帮助量化策略开发者创建、修改、调试、解读策略代码，并在两个平台之间进行语义保真的转换。

## 能做什么

- **开发与修改**：按目标平台原生接口实现选股、信号、调仓、下单和风控逻辑，尽量保持策略原意。
- **调试与加固**：定位生命周期、API、数据结构、订单状态、回测环境和编码问题。
- **平台转换**：在聚宽与 PTrade 之间映射调度、行情/财务数据、订单、账户和状态，并标明无法等价转换的部分。
- **代码解读**：生成中文策略档案，说明运行流程、买卖条件、资金管理、风险控制和代码证据。

本项目当前只支持聚宽和 PTrade。策略分析属于代码工程辅助，不构成投资建议，也不承诺收益。

## 使用技能

将 [`skills/lightquant-strategy-toolkit/`](skills/lightquant-strategy-toolkit/) 文件夹复制到 Codex 的 `~/.codex/skills/` 目录，然后在任务中使用 `$lightquant-strategy-toolkit`。

入口文件是 [`SKILL.md`](skills/lightquant-strategy-toolkit/SKILL.md)。PTrade、聚宽、转换矩阵和解读模板等配套资料位于同目录的 `references/`。

## PTrade API 参考

仓库同时保留国金版本 PTrade 的原始 API HTML 和配套资源，位于 [`api-docs/raw/ptrade/guojin/`](api-docs/raw/ptrade/guojin/)。版本说明见 [国金 PTrade API 文档版本说明](api-docs/raw/ptrade/guojin/README.md)。

该文档列出的最高 API 变更版本为 `PTrade1.0-QTV202401.05.032`，并分别说明 Python 3.5 和 Python 3.11 环境。这个版本标识不代表当前账户实际安装的客户端版本；使用者应向自己的券商核实当前版本、运行环境和接口权限。

## 许可

[`skills/lightquant-strategy-toolkit/LICENSE`](skills/lightquant-strategy-toolkit/LICENSE) 中的 MIT 许可证只适用于技能目录内由本项目维护者编写的技能内容。`api-docs/raw/ptrade/guojin/` 中的平台 API 手册及其配套材料属于第三方资料，不由该 MIT 许可证重新授权；使用和再分发前应核实相应权利。
