---
name: steward
description: 驱动 PR 走完审查、追问与合并时使用，包括启动审查子代理和判断能否合并。
---

本仓库沿用主仓库 `MixGeekers/echoo_erp` 的 `docs/governance/自动审查与合并.md` 与 `docs/governance/决策准则.md`；本地没有主仓副本时，经 GitHub 读取主仓 `main` 上的这两份文件。以下是本仓库的落地方式。

- **风险等级**：完整范围以主仓规格为准。L2 在审查通过后等用户同意，本仓常见的是新增第三方依赖与新增示例模块。
- **模块池正式发布**：在用户明确要求时执行，不经 PR 合并流程。
- **底线**：改动命中以下任一项时，运行下列全部验证命令并做独立审查；L1+ 由两名审查者通过，第二名专看安全；L2 在审查通过后等用户同意再合并。
  - 协议快照与公共入口：模块 `contracts/`、`echoo.module.json`、任意 `package.json` 的 `exports`
  - 数据库迁移与 Schema：模块 `migrations/` 下文件、`.sql`
  - 依赖与构建配置：任意 `package.json` 的依赖字段、`pnpm-lock.yaml`、根配置（根 `package.json`、`pnpm-workspace.yaml`、`.npmrc`）、SDK 绑定 `echoo.sdk.json`
- **审查方式**：底线之外，实现者看 diff 自行决定自审还是独立审查，并从下列验证命令中挑选要跑的检查；只改文档时重读 diff，无需运行构建。自审时实现者重读 diff，在 PR 上写自审结论：头提交 SHA、风险等级、验证记录、结论（通过 / 需修改）。
- **独立审查**：实现者启动独立审查子代理，在独立工作树检出 PR 头读 diff，以所改模块的 `README.md` 与 `echoo.module.json` 为规格入口，核对验证记录并对存疑项补跑对应命令，在 PR 上写结论评论：头提交 SHA、风险等级、核对的验证记录与补跑的命令、逐条问题（标阻断或建议）。
- **可用的验证命令**：实现者按改动挑选；命中底线时全部运行。
  - 先按 `AGENTS.md` 绑定主仓 SDK：在主仓根目录执行 `pnpm launcher sdk export --consumer ../echoo_erp_module_example`，再在本仓执行 `node <SDK目录>/tools/sdk.mjs use .`；绑定会写入 `sdk:check`
  - `pnpm install && pnpm build`
  - `pnpm test`；单个模块用 `pnpm --filter ./modules/<目录> run build && pnpm --filter ./modules/<目录> run test`
  - `pnpm sdk:check`
- **验证记录**：请求合并前在 PR 上发一条，只写头提交 SHA、跑了哪些命令和结果（通过用例数，以及每个失败项及其原因）。每次推送新提交附一条新的记录。
- **合并**：自审或独立审查结论「通过」绑定当前头提交、已合入最新 `main`、L2 已获用户同意时，以合并提交合并。看板记账在合并前完成：对应的任务与问题条目标为完成并附 PR 链接；合并后在需求所在会话汇报结果。
