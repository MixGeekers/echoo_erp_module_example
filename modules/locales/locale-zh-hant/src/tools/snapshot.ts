// 导出时的源文快照：记录本次导出对应的全部源 key 与 zh-CN 原文，apply 以它为校验依据，不依赖 CSV 中可编辑的原文列。
import { readFileSync, writeFileSync } from "node:fs";

export interface SourceSnapshot {
  readonly schemaVersion: 1;
  readonly revision: string;
  readonly sources: Readonly<Record<string, string>>;
}

/** translations.csv 对应 translations.source.json，二者随同一次导出生成。 */
export function snapshotPath(csvPath: string): string {
  return `${csvPath.replace(/\.csv$/iu, "")}.source.json`;
}

export function writeSourceSnapshot(
  path: string,
  snapshot: SourceSnapshot,
): void {
  writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

export function readSourceSnapshot(path: string): SourceSnapshot {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(
      `缺少源文快照 ${path}，请用 source.js 重新导出，并让快照与 CSV 放在同一目录`,
      { cause: error },
    );
  }
  const value: unknown = JSON.parse(text);
  const record = value as Partial<SourceSnapshot> | null;
  if (
    typeof record !== "object" ||
    record === null ||
    record.schemaVersion !== 1 ||
    typeof record.revision !== "string" ||
    typeof record.sources !== "object" ||
    record.sources === null ||
    Object.values(record.sources).some((text) => typeof text !== "string")
  ) {
    throw new Error(`${path} 不是有效的源文快照，请重新执行 source.js 导出`);
  }
  return record as SourceSnapshot;
}
