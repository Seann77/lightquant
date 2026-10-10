# LightQuant Strategy Toolkit

Codex skill for quantitative strategy development, debugging, explanation, and conversion between JoinQuant and PTrade.

## Contents

- `SKILL.md`: routing, workflows, safety, and the default 42-field strategy dossier.
- `references/platform-joinquant.md`: JoinQuant workflow and API compatibility checks.
- `references/platform-ptrade.md`: PTrade workflow and cross-deployment compatibility checks.
- `references/conversion-matrix.md`: two-way conversion checklist.
- `references/explanation-dossier.md`: detailed 42-field explanation template and plain-language examples.
- `references/safety-and-output-rules.md`: scope, encoding, and output requirements.
- `references/api-docs-policy.md`: guidance for API documentation, version notes, and public releases.

## API documentation

The reference files are intentionally concise summaries, not bundled copies of platform manuals. Use the documentation supplied by the user's current platform/broker environment for exact signatures and availability. Before publishing, confirm the terms for any third-party documentation or examples and record the applicable versions and review date. See `references/api-docs-policy.md`.

## Compatibility

This skill's current scope is JoinQuant and PTrade. No specific PTrade broker deployment or platform version is certified by this repository. Compatibility should be stated per environment and evidence.

The locally reviewed PTrade reference is the Guojin deployment documentation. Its API change log lists `PTrade1.0-QTV202401.05.032` as the highest revision present and documents both Python 3.5 and Python 3.11 variants. This is a documentation revision, not confirmation of the currently installed broker client. Confirm the actual client/runtime version with the broker. The PTrade source manuals already tracked in the LightQuant repository are documented at [the Guojin API reference](../../api-docs/raw/ptrade/guojin/README.md), [the strategy API HTML](../../api-docs/raw/ptrade/guojin/ptradeapi.html), and [the financial API HTML](../../api-docs/raw/ptrade/guojin/财务数据api.html). The Guojin manual is not duplicated inside the skill package. Its redistribution rights are separate from this skill license.

## License

This skill package's original content is licensed under the MIT License; see `LICENSE`. The license does not cover third-party platform manuals or materials.
