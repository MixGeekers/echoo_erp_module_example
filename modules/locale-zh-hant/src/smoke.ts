import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCore, materializeModuleEntry } from "@echoo/core";
import i18nEntry, {
  i18nBackendToken,
  i18nCatalog,
  I18nRegistry,
} from "@echoo/module-root.i18n/backend";
import {
  BUILTIN_LOCALE_TAGS,
  SOURCE_LOCALE,
  validateI18nLanguagePack,
} from "@echoo/module-root.i18n/shared";
import entry, { languagePackToken } from "./backend.js";
import { languagePack } from "./pack.js";
import { readManifest } from "./host.js";
import { checkTranslations } from "./tools/check.js";
import type { TranslationRow } from "./tools/csv.js";

const manifest = readManifest(new URL("../echoo.module.json", import.meta.url));
const pkg: { name: string; dependencies: Record<string, string> } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const location = pkg.dependencies["@echoo/module-root.i18n"];
assert.ok(location?.startsWith("file:"));
const provider = readManifest(
  new URL("../" + location.slice(5) + "/echoo.module.json", import.meta.url),
);
// 模块 ID 在 Manifest、package 名与语言包中保持一致，改前缀时三处同改。
assert.equal(manifest.id, entry.token.moduleId);
assert.equal(languagePack.moduleId, manifest.id);
assert.equal(pkg.name, `@echoo/module-${manifest.id}`);
validateI18nLanguagePack(languagePack);

const core = createCore();
core.activate([
  materializeModuleEntry(entry, {
    id: entry.token.moduleId,
    host: "backend",
    contractVersion: manifest.contracts.backend!,
    dependencies: { "root.i18n": manifest.dependencies["root.i18n"]!.backend! },
  }),
  materializeModuleEntry(i18nEntry, {
    id: i18nEntry.token.moduleId,
    host: "backend",
    contractVersion: provider.contracts.backend!,
    dependencies: {},
  }),
]);
const i18n = core.moduleApi(i18nBackendToken);
assert.equal(core.moduleApi(languagePackToken).locale, languagePack.locale);
assert.ok(i18n.locales().includes(languagePack.locale));
const expectedChain = [
  ...new Set([
    languagePack.locale,
    ...languagePack.fallback.filter((tag) => i18n.locales().includes(tag)),
    SOURCE_LOCALE,
  ]),
];
assert.deepEqual(i18n.localeChain(languagePack.locale), expectedChain);
// 精确匹配选中本语言包；同为繁体书写的其他地区（如 zh-Hant-HK）协商到本语言包。
assert.equal(i18n.negotiateLocale([languagePack.locale]), languagePack.locale);
assert.equal(i18n.negotiateLocale(["zh-Hant-HK"]), languagePack.locale);

// 用公共 Registry 核对有效资源包：译文进入资源包，缺失 key 按回退链补齐，同一语言不能注册第二个语言包。
const registry = new I18nRegistry();
registry.registerCatalog(i18nCatalog);
registry.registerLanguagePack(languagePack);
const summary = registry
  .manifest()
  .locales.find(({ tag }) => tag === languagePack.locale);
assert.equal(summary?.nativeName, languagePack.nativeName);
const bundle = registry.bundle(languagePack.locale)!;
for (const key of Object.keys(i18nCatalog.messages[SOURCE_LOCALE])) {
  const own = languagePack.messages[key];
  if (own !== undefined) assert.equal(bundle.messages[key], own);
  else assert.ok(bundle.messages[key]);
}
assert.throws(
  () =>
    registry.registerLanguagePack({
      ...languagePack,
      moduleId: "root.other-pack",
    }),
  {
    name: "I18nModuleError",
    code: "I18N_PACK_LOCALE_DUPLICATE",
  },
);
assert.throws(
  () =>
    new I18nRegistry().registerLanguagePack({
      ...languagePack,
      locale: BUILTIN_LOCALE_TAGS[2]!,
      fallback: [],
    }),
  { name: "I18nModuleError", code: "I18N_PACK_LOCALE_DUPLICATE" },
);
// 每条译文记录翻译时的 zh-CN 原文：与当前原文一致时采用；原文改动后该译文过期，按回退链显示下一语言。
assert.equal(
  registry.manifest().packs.find(({ locale }) => locale === languagePack.locale)
    ?.stale,
  0,
);
// smoke 只激活 i18n 自身，过期检查取一条 i18n 自有 key 的译文。
const staleKey = Object.keys(languagePack.messages).find(
  (key) => key in i18nCatalog.messages[SOURCE_LOCALE],
);
assert.ok(staleKey);
const outdated = new I18nRegistry();
outdated.registerCatalog(i18nCatalog);
outdated.registerLanguagePack({
  ...languagePack,
  sources: { ...languagePack.sources, [staleKey]: "旧原文" },
});
assert.equal(outdated.manifest().packs[0]?.stale, 1);
assert.equal(
  outdated.bundle(languagePack.locale)!.messages[staleKey],
  outdated.bundle(expectedChain[1]!)!.messages[staleKey],
);
// apply 以导出快照为准：key 列被改成不存在的 key、原文列被改动都按行报错，且不产出任何译文。
const snapshot = {
  schemaVersion: 1 as const,
  revision: registry.manifest().revision,
  sources: { "root.i18n.status.coverage": "{translated} / {total}" },
};
const row = (key: string, zh: string, translation: string): TranslationRow => ({
  key,
  "zh-CN": zh,
  "en-US": "",
  "es-VE": "",
  translation,
});
const accepted = checkTranslations(
  [
    {
      line: 2,
      row: row(
        "root.i18n.status.coverage",
        "{translated} / {total}",
        "{translated} de {total}",
      ),
    },
  ],
  snapshot,
);
assert.deepEqual(accepted.failures, []);
assert.deepEqual(accepted.messages, {
  "root.i18n.status.coverage": "{translated} de {total}",
});
const unknownKey = checkTranslations(
  [
    {
      line: 2,
      row: row(
        "root.i18n.status.coverage-x",
        "{translated} / {total}",
        "{translated} de {total}",
      ),
    },
  ],
  snapshot,
);
assert.match(
  unknownKey.failures[0] ?? "",
  /第 2 行 root\.i18n\.status\.coverage-x：key 不在本次导出的源文中/u,
);
assert.deepEqual(unknownKey.messages, {});
const editedSource = checkTranslations(
  [
    {
      line: 3,
      row: row(
        "root.i18n.status.coverage",
        "{hechos} / {total}",
        "{hechos} de {total}",
      ),
    },
  ],
  snapshot,
);
assert.match(
  editedSource.failures[0] ?? "",
  /第 3 行 root\.i18n\.status\.coverage：译文的插值参数须与原文一致（\{total\} \{translated\}）/u,
);
assert.deepEqual(editedSource.messages, {});
console.log(
  `语言包 ${languagePack.locale}：真实激活、回退链 ${expectedChain.join(" → ")}、资源包补齐、过期译文回退、重复语言拒绝与按导出快照校验译文通过`,
);
