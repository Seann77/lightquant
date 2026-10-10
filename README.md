# LightQuant Strategy Toolkit

![LightQuant Strategy Toolkit：JoinQuant × PTrade](assets/lightquant-cover.png)

面向聚宽（JoinQuant）与 PTrade 的量化策略开发技能，可辅助开发、修改、调试、解读策略，并在两个平台之间转换。

## 使用模式

| 模式 | 适用场景 | 交付结果 |
| --- | --- | --- |
| 开发与修改 | 新建策略，或调整指标、信号、调仓和风控 | 按目标平台实现的策略代码与改动说明 |
| 调试 | 排查 API、运行流程、数据、订单或编码问题 | 问题定位、修复建议或修改后的代码 |
| 平台转换 | 在聚宽与 PTrade 之间迁移策略 | 转换代码，以及平台差异和待确认项 |
| 代码解读 | 需要了解策略实际执行逻辑 | 中文策略说明，附代码依据 |

## 安装

使用支持 Skill 的安装命令：

```bash
npx skills add Seann77/lightquant --skill lightquant-strategy-toolkit
```

也可以把 `skills/lightquant-strategy-toolkit/` 目录交给你使用的 Agent 安装，或手动复制到该工具的 Skill 目录。安装后让 Agent 读取该 Skill，即可用自然语言提出策略任务。

## 开始使用

例如：

- “帮我检查这份 PTrade 策略为什么回测没有下单。”
- “把这份聚宽策略转换为 PTrade，保留原有选股和调仓逻辑。”
- “用普通中文解释这份策略的买卖条件和仓位控制。”

本项目目前覆盖聚宽与 PTrade。平台接口和运行环境可能因版本或券商部署而不同；具体实现以使用者提供的平台文档和环境为准。

## 内容

- [Skill 入口与完整说明](skills/lightquant-strategy-toolkit/SKILL.md)
- [Skill 包说明](skills/lightquant-strategy-toolkit/README.md)
- [PTrade API 文档及版本说明](api-docs/raw/ptrade/guojin/README.md)

## 许可

MIT License，详见 [LICENSE](skills/lightquant-strategy-toolkit/LICENSE)。
