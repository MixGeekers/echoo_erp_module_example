// 用法：node dist/tools/apply.js [translations.csv]
// 按同次导出的 translations.source.json 逐行校验译文，全部通过后重新生成 src/messages.ts；
// 任一行不合格时只报告，不改动 messages.ts。
import { readFileSync, writeFileSync } from "node:fs";
import { SOURCE_LOCALE } from "@echoo/module-root.i18n/shared";
import { languagePack } from "../pack.js";
import { checkTranslations } from "./check.js";
import { readTranslationsCsv } from "./csv.js";
import { readSourceSnapshot, snapshotPath } from "./snapshot.js";

const input = process.argv[2] ?? "translations.csv";
const snapshot = readSourceSnapshot(snapshotPath(input));
const rows = readTranslationsCsv(readFileSync(input, "utf8"));
const { messages, failures } = checkTranslations(rows, snapshot);
if (failures.length > 0) {
  process.stderr.write(
    `${failures.join("\n")}\n未生成 messages.ts，共 ${failures.length} 行需要修改。\n`,
  );
  process.exit(1);
}
const keys = Object.keys(messages).sort();
writeFileSync(
  new URL("../../src/messages.ts", import.meta.url),
  [
    "// 由 node dist/tools/apply.js 根据 translations.csv 生成；修改译文请编辑 CSV 后重新生成。",
    "export const messages: Readonly<Record<string, string>> = {",
    ...keys.map(
      (key) => `  ${JSON.stringify(key)}: ${JSON.stringify(messages[key])},`,
    ),
    "};",
    "",
    "export const sources: Readonly<Record<string, string>> = {",
    ...keys.map(
      (key) =>
        `  ${JSON.stringify(key)}: ${JSON.stringify(snapshot.sources[key])},`,
    ),
    "};",
    "",
  ].join("\n"),
  "utf8",
);
console.log(
  `已生成 src/messages.ts：${languagePack.locale} 译文 ${keys.length} / ${Object.keys(snapshot.sources).length}（源 revision ${snapshot.revision.slice(0, 12)}），其余 key 按 ${[languagePack.locale, ...languagePack.fallback, SOURCE_LOCALE].join(" → ")} 回退。`,
);
