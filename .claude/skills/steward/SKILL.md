---
name: steward
description: 驱动 PR 走完审查、追问与合并时使用，包括启动审查子代理和判断能否合并。
---

本仓库沿用主仓库 `MixGeekers/echoo_erp` 的 `docs/governance/自动审查与合并.md` 与 `docs/governance/决策准则.md`；本地没有主仓副本时，经 GitHub 读取主仓 `main` 上的这两份文件。以下是本仓库的落地方式。

- **风险等级**：按主仓规格划分。L2 包括新增第三方依赖、新示例模块与模块池正式发布，在用户同意后执行。
- **审查**：实现者启动独立审查子代理，在独立工作树检出 PR 头读 diff，自行运行下列验证，在 PR 上写结论评论：头提交 SHA、风险等级、命令与结果、逐条问题（标阻断或建议）。
- **验证命令**：
  - `pnpm install && pnpm build`
  - `pnpm test`
  - `pnpm sdk:check`
- **合并**：结论「通过」绑定当前头提交、已合入最新 `main`、L2 已获用户同意时，以合并提交合并，并在需求所在会话汇报。
