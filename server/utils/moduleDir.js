import path from "node:path";
import { fileURLToPath } from "node:url";

export function moduleDir(metaUrl, metaDir) {
    if (typeof metaDir === "string" && metaDir.length) return metaDir;
    return path.dirname(fileURLToPath(metaUrl));
}
