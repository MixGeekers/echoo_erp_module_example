# AGENTS.md

回复和文档使用**简体中文**。本仓库存放 Echoo 的示例模块，供区域作者参照制作自有模块；Root 模块、Launcher、宿主与平台包由主仓库 `MixGeekers/echoo_erp` 拥有。

## 仓库内容

| 位置 | Module ID | 职责 |
| --- | --- | --- |
| `modules/locale-zh-hant` | `example.locale-zh-hant` | 繁体中文（`zh-Hant`）语言包示例 |

模块身份、公共入口与依赖由各模块的 `echoo.module.json` 与 `package.json` 表达。

## 依赖与开发

- 模块只通过 owner 的公开 package exports 使用 Root 模块与平台包，禁止相对路径进入其他仓库或其他模块的源码。
- Root 依赖按主仓 SDK 绑定：在主仓根目录执行 `pnpm launcher sdk export --consumer ../echoo_erp_module_example` 取得 SDK，再在本仓根目录执行 `node <SDK目录>/tools/sdk.mjs use .`。工具把各模块的 `@echoo/*` 依赖改写为指向 `.echoo/sdk/<摘要>/` 副本的 `file:` 依赖，并写入 `echoo.sdk.json` 与 `sdk:check`、`sdk:capture`。`.echoo/` 不进入 Git。
- 常用命令：`pnpm install`、`pnpm build`、`pnpm test`、`pnpm sdk:check`。
- 不提交 `.env`、凭据、token、模块池接入文件或运行产物。发布经所属模块池接入文件执行，远端写入须有用户授权。
