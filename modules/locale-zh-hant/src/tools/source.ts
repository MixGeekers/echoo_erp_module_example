// 用法：node dist/tools/source.js <Backend 地址> [输出文件，默认 translations.csv]
// 从目标组合的运行环境读取语言清单与内置语言资源包，生成待翻译的 translations.csv，
// 并在同目录写入源文快照 translations.source.json，供 apply.js 校验 key 与插值参数。
import { writeFileSync } from "node:fs";
import {
  I18nBundleSchema,
  I18nManifestSchema,
  SOURCE_LOCALE,
  type I18nBundle,
} from "@echoo/module-root.i18n/shared";
import { languagePack } from "../pack.js";
import { writeTranslationsCsv, type TranslationRow } from "./csv.js";
import { snapshotPath, writeSourceSnapshot } from "./snapshot.js";

const [base, output = "translations.csv"] = process.argv.slice(2);
if (!base) {
  throw new Error("用法：node dist/tools/source.js <Backend 地址> [输出文件]");
}
const api = new URL(
  "api/modules/foundation/i18n/",
  base.endsWith("/") ? base : `${base}/`,
);

async function json(path: string): Promise<unknown> {
  const response = await fetch(new URL(path, api), {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`读取 ${path} 失败：HTTP ${response.status}`);
  }
  return response.json();
}

const manifest = I18nManifestSchema.parse(await json("manifest"));
async function bundle(locale: string): Promise<I18nBundle> {
  const summary = manifest.locales.find(({ tag }) => tag === locale);
  if (!summary) throw new Error(`目标环境未提供语言 ${locale}`);
  const parsed = I18nBundleSchema.parse(
    await json(`bundles/${encodeURIComponent(locale)}/${summary.bundle}`),
  );
  if (parsed.locale !== locale || parsed.hash !== summary.bundle) {
    throw new Error(`语言 ${locale} 的资源包与语言清单不一致`);
  }
  return parsed;
}
const [source, english, venezuela] = await Promise.all(
  [SOURCE_LOCALE, "en-US", "es-VE"].map(bundle),
);
// 已有译文只在记录的原文与当前原文一致时写回；原文已变化的条目留空，由译者对照新原文重新翻译。
const existing: Readonly<Record<string, string>> = languagePack.messages;
const recorded: Readonly<Record<string, string>> = languagePack.sources ?? {};
const current = (key: string): string | undefined =>
  recorded[key] === source!.messages[key] ? existing[key] : undefined;
const rows: TranslationRow[] = Object.keys(source!.messages)
  .sort()
  .map((key) => ({
    key,
    "zh-CN": source!.messages[key] ?? "",
    "en-US": english!.messages[key] ?? "",
    "es-VE": venezuela!.messages[key] ?? "",
    translation: current(key) ?? "",
  }));
writeFileSync(output, writeTranslationsCsv(rows), "utf8");
writeSourceSnapshot(snapshotPath(output), {
  schemaVersion: 1,
  revision: manifest.revision,
  sources: source!.messages,
});
const translated = rows.filter(
  ({ translation }) => translation.length > 0,
).length;
const stale = Object.keys(existing).filter(
  (key) => source!.messages[key] !== undefined && current(key) === undefined,
).length;
console.log(
  `已写入 ${output} 与 ${snapshotPath(output)}：${rows.length} 个 key（revision ${manifest.revision.slice(0, 12)}），${languagePack.locale} 已有译文 ${translated} 条${stale > 0 ? `，原文已变化需重新翻译 ${stale} 条` : ""}。`,
);
