# LightQuant Strategy Toolkit

用于聚宽（JoinQuant）与 PTrade 的量化策略技能，覆盖策略开发、修改、调试、平台转换和代码解读。

## 使用模式

- **开发与修改**：新建策略，或调整信号、调仓和风控逻辑。
- **调试**：定位平台 API、运行流程、数据、订单和编码问题。
- **平台转换**：在聚宽与 PTrade 之间迁移策略，并说明无法直接对应的行为。
- **代码解读**：生成中文策略说明，并依据代码区分已启用逻辑与未启用逻辑。

## 安装

把仓库地址交给 Agent：

```text
帮我安装 https://github.com/Seann77/lightquant 这个 Skill。
```

也可以用命令安装，完成后让 Agent 重新加载 Skill：

```bash
npx skills add Seann77/lightquant --skill lightquant-strategy-toolkit
```

## 参考资料

- [`SKILL.md`](SKILL.md)：工作流程与使用边界。
- [`references/`](references/)：聚宽、PTrade、平台转换和代码解读参考。
- [PTrade API 文档版本说明](https://github.com/Seann77/lightquant/tree/master/api-docs/raw/ptrade/guojin)：仓库中的国金 PTrade 参考资料。

PTrade 的券商部署、接口版本及运行环境可能不同，请结合实际环境确认 API 可用性。

## License

MIT License，见 [`LICENSE`](LICENSE)。
