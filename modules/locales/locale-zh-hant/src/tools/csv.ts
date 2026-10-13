// translations.csv 的读写：UTF-8 BOM、CRLF、RFC 4180 引号规则，可由表格软件直接打开和保存。
export const CSV_COLUMNS = [
  "key",
  "zh-CN",
  "en-US",
  "es-VE",
  "translation",
] as const;

export type TranslationRow = Record<(typeof CSV_COLUMNS)[number], string>;

function cell(value: string): string {
  return /[",\r\n]/u.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function writeTranslationsCsv(rows: readonly TranslationRow[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const row of rows)
    lines.push(CSV_COLUMNS.map((column) => cell(row[column])).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function records(text: string): string[][] {
  const result: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (quoted) {
      if (char === '"' && text.charAt(index + 1) === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === ",") {
      record.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text.charAt(index + 1) === "\n") index += 1;
      record.push(field);
      result.push(record);
      record = [];
      field = "";
    } else field += char;
  }
  if (quoted) throw new Error("translations.csv 中存在未闭合的引号");
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    result.push(record);
  }
  return result.filter((row) => row.some((value) => value.length > 0));
}

/** 解析 translations.csv，返回带 CSV 行号（表头为第 1 行）的行。 */
export function readTranslationsCsv(
  text: string,
): readonly { readonly line: number; readonly row: TranslationRow }[] {
  const [header, ...body] = records(text.replace(/^\uFEFF/u, ""));
  if (!header || header.join(",") !== CSV_COLUMNS.join(",")) {
    throw new Error(`translations.csv 表头必须为 ${CSV_COLUMNS.join(",")}`);
  }
  return body.map((values, index) => {
    if (values.length !== CSV_COLUMNS.length) {
      throw new Error(
        `translations.csv 第 ${index + 2} 行应有 ${CSV_COLUMNS.length} 列`,
      );
    }
    const row = Object.fromEntries(
      CSV_COLUMNS.map((column, position) => [column, values[position] ?? ""]),
    ) as TranslationRow;
    return { line: index + 2, row };
  });
}
