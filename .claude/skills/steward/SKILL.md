---
name: steward
description: 驱动 PR 走完审查、追问与合并时使用，包括启动审查子代理和判断能否合并。
---

本仓库沿用主仓库 `MixGeekers/echoo_erp` 的 `docs/governance/自动审查与合并.md` 与 `docs/governance/决策准则.md`；本地没有主仓副本时，经 GitHub 读取主仓 `main` 上的这两份文件。以下是本仓库的落地方式。

- **风险等级**：完整范围以主仓规格为准。L2 在审查通过后等用户同意，本仓常见的是新增第三方依赖与新增示例模块。
- **模块池正式发布**：在用户明确要求时执行，不经 PR 合并流程。
- **审查**：实现者启动独立审查子代理，在独立工作树检出 PR 头读 diff，以所改模块的 `README.md` 与 `echoo.module.json` 为规格入口，自行运行下列验证，在 PR 上写结论评论：头提交 SHA、风险等级、命令与结果、逐条问题（标阻断或建议）。
- **验证命令**：
  - 先按 `AGENTS.md` 绑定主仓 SDK：在主仓根目录执行 `pnpm launcher sdk export --consumer ../echoo_erp_module_example`，再在本仓执行 `node <SDK目录>/tools/sdk.mjs use .`；绑定会写入 `sdk:check`
  - `pnpm install && pnpm build`
  - `pnpm test`
  - `pnpm sdk:check`
- **合并**：结论「通过」绑定当前头提交、已合入最新 `main`、L2 已获用户同意时，以合并提交合并，并在需求所在会话汇报。
