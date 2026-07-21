# HTML 完整性人工复核备注

- 复核时间：2026-07-18
- 机器报告：`api-docs/reports/html-completeness-audit.md`
- 机器明细：`api-docs/reports/html-completeness-audit.json`

## 结论

未发现会阻塞下一阶段 Markdown 清洗的 HTML 正文缺失、空壳页、登录页替代、乱码、代码块大面积丢失或表格结构丢失。

## 已核实正常

- PTrade 国金：3 个保存 HTML 与原始本地 HTML 字节一致，SHA-256 一致；本地 `*_files` 资源目录已复制，未发现本地资源缺失。
- QMT：保存的 `innerapi-combined.html` 与原始结构化 HTML 字节一致；与 202 页内置 Python PDF 对比，identifier 覆盖率 0.9862，PDF 行级短语覆盖率 0.9694。
- JoinQuant：15 个页面均有 `raw.html`、`rendered.html`、`metadata.json`；raw 正文为 0，rendered 正文明显非空，说明必须依赖浏览器执行 JavaScript 的判断成立。最短 rendered 正文长度为 7543，最长为 400945，未见只保存页面框架的问题。
- 乱码扫描：`api-docs/raw`、`api-docs/manifests`、`api-docs/reports` 未检出 `�`、`锟斤拷`、`鈥`、`ï¿½` 等明显乱码标记。

## 机器告警复核

- PTrade 申万“接口列表”被机器报告标记为 PDF->HTML 覆盖偏低：identifier=0.7117，line=0.2995。
- 复核原因：对应 PDF 在窄页宽中把长接口名拆断，例如 `set_yesterday_positio` / `n`、`after_trading_cancel_`、`filter_stock_by_statu` 等，导致 PDF 文本抽取产生碎片标识符。
- 复核结果：保存 HTML 表格中存在完整接口名。抽取到接口列表首列 135 个接口名，样例 `set_yesterday_position`、`after_trading_cancel_order`、`filter_stock_by_status`、`get_current_kline_count`、`get_hks_enable_amount`、`get_margin_contractreal`、`etf_purchase_redemption` 均存在。
- 判断：这是 PDF 文本抽取/换行造成的告警，不是 HTML 内容缺失。

## 仍需注意

- PTrade 申万 HTML 中保留了站点内导航、历史版本、附属页面等链接；其中部分相对链接未在本阶段镜像为本地文件，例如 `api/other/*`、历史版本路径和站内导航。这不影响已列 17 个页面正文，但如果下一阶段要求完全离线浏览，需要单独扩展抓取范围。
- JoinQuant rendered HTML 保留 CDN、导航、社区、账户、数据字典等外部/站内链接；本阶段没有镜像这些资源，符合“仅抓 API 帮助路径、不抓账户/社区私有内容”的边界。
- QMT HTML 保留原始远程图片引用，未对 PDF 做 OCR，也未抓取 QMT 外部资源；如果后续要离线展示图片，需要单独做资源镜像规则。
