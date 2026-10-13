import {
  acceptsTranslation,
  messagePlaceholders,
} from "@echoo/module-root.i18n/shared";
import type { TranslationRow } from "./csv.js";
import type { SourceSnapshot } from "./snapshot.js";

export interface TranslationCheck {
  readonly messages: Readonly<Record<string, string>>;
  readonly failures: readonly string[];
}

/**
 * 按导出快照逐行校验译文：key 必须属于本次导出的源集合，插值参数以快照中的 zh-CN 原文为准。
 * 与 Backend 生成资源包时对语言包译文的校验一致，通过的译文部署到同一组合后不会被拒绝。
 */
export function checkTranslations(
  rows: readonly { readonly line: number; readonly row: TranslationRow }[],
  snapshot: SourceSnapshot,
): TranslationCheck {
  const failures: string[] = [];
  const seen = new Set<string>();
  const messages: Record<string, string> = {};
  for (const { line, row } of rows) {
    if (seen.has(row.key)) {
      failures.push(`第 ${line} 行 ${row.key}：key 重复`);
      continue;
    }
    seen.add(row.key);
    if (row.translation.trim().length === 0) continue;
    const source = Object.hasOwn(snapshot.sources, row.key)
      ? snapshot.sources[row.key]
      : undefined;
    const placeholders =
      source === undefined ? undefined : messagePlaceholders(source);
    if (!placeholders) {
      failures.push(
        `第 ${line} 行 ${row.key}：key 不在本次导出的源文中，请勿修改 key 列，或重新执行 source.js 导出`,
      );
    } else if (!acceptsTranslation(row.translation, placeholders)) {
      const expected = placeholders.length
        ? placeholders.map((name) => `{${name}}`).join(" ")
        : "无";
      failures.push(
        `第 ${line} 行 ${row.key}：译文的插值参数须与原文一致（${expected}），语法字符 { } | @ 须写成 {'|'} 形式`,
      );
    } else {
      messages[row.key] = row.translation;
    }
  }
  return { messages, failures };
}
