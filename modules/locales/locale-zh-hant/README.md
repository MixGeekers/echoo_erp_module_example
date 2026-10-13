# 繁体中文语言包示例（zh-Hant）

本模块为 Echoo 部署增加界面语言「繁體中文」（`zh-Hant`）。它由主仓 SDK 样板 `root.i18n language-pack` 生成，演示从导出待翻译文件、填写译文、生成译文到验证发布的完整流程。回退链为 `zh-Hant → zh-CN`：缺少繁体译文的 key 显示简体原文。

## 文件

| 文件 | 内容 |
| --- | --- |
| `src/pack.ts` | 语言包身份：模块 ID、语言标签、本族语名称与回退语言 |
| `src/messages.ts` | 由 `apply.js` 生成：`messages` 为繁体译文，`sources` 为每条译文依据的 zh-CN 原文 |
| `translations.csv` | 待翻译文件：`key`、zh-CN、en-US、es-VE 原文与 `translation` 列 |
| `translations.source.json` | 导出时的源文快照，`apply.js` 以它校验 key 与插值参数 |
| `src/tools/` | `source.js` 导出、`apply.js` 校验并生成译文 |
| `src/smoke.ts` | 以真实 Core 激活 i18n 与本语言包的冒烟测试 |

## 译文来源

当前 `translations.csv` 从包含以下 9 个 Root 模块的组合导出，共 631 个 key：`root.connectivity`、`root.home`、`root.i18n`、`root.localization`、`root.manuals`、`root.measurement`、`root.navigation`、`root.settings`、`root.ui`。`translation` 列由 OpenCC `s2t` 把 zh-CN 原文逐字转换为繁体字形，属于机器转换，正式使用前需要人工校对用词，例如台湾地区习惯的「伺服器」「網路」「檔案」等。

部署中这 9 个模块之外的 key 不在本语言包内，按回退链显示简体原文；目标组合包含更多模块时，从该组合重新导出后补译。

## 构建与验证

1. 按仓库根目录的 [AGENTS.md](../../../AGENTS.md) 绑定 SDK，然后在仓库根目录执行 `pnpm install`。
2. 在本目录执行 `pnpm build`、`pnpm test`。smoke 只激活 i18n 自身，其他模块的译文计入拒绝数并记录 `I18N_PACK_ENTRIES_REJECTED` 警告，这是预期结果。
3. 执行 `pnpm sdk:capture`、`pnpm sdk:check`，再经所属模块池的 `mother:publish` 发布，并把本模块加入目标客户组合。

原文记录 `sources` 与过期译文识别需要 `root.i18n` 协议 1.1 及以上，见主仓 PR MixGeekers/echoo_erp#163。

## 更新译文

Root 模块增加或修改文案后：

1. 导出新的待翻译文件，二选一：
   - 在本目录执行 `node dist/tools/source.js <Backend 地址>`，从运行中的目标组合导出。
   - 请总部在主仓执行 `pnpm --silent launcher -- i18n source --environment <开发环境ID> --out <本目录> --locale zh-Hant --json`。
2. 填写 `translation` 列。原文已变化的旧译文不会写回，需要对照新的 zh-CN 列重新翻译。保留每个 `{名称}` 插值参数；显示 `{`、`}`、`|`、`@` 时写成 `{'|'}` 这类字面量。
3. 执行 `node dist/tools/apply.js`。任一行不合格时逐行报告，`src/messages.ts` 保持不变；全部通过后重新生成。
4. 重新构建、测试并发布新修订。

部署后在 `/i18n` 语言资源状态页核对：本语言包的拒绝数与过期数为 0，语言菜单出现「繁體中文」。原文被修改但尚未重新翻译的条目计入过期数，界面显示简体原文。

## 改成自有语言包

把模块 ID `example.locale-zh-hant` 改为所属模块池的发布方前缀，三处同改：`echoo.module.json` 的 `id`、`package.json` 的 `name`（`@echoo/module-<模块ID>`）、`src/pack.ts` 的 `PACK_MODULE_ID`。一种语言在一个部署中只能由一个语言包提供，内置语言（zh-CN、en-US、es-VE）不能被语言包替换。
