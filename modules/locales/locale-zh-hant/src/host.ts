// 仅供示例的 Node 测试宿主使用；业务 entry 不读取文件系统。
import { readFileSync } from "node:fs";
import { parseModuleManifest } from "@echoo/package-manager/manifest";
export function readManifest(url: URL) {
  return parseModuleManifest(JSON.parse(readFileSync(url, "utf8")));
}
