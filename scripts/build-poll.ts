import { readdir, readFile, stat, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SRC_DIR = path.resolve("client");
const OUT_DIR = path.resolve("dist/client");
const BUILD_ID = path.join(OUT_DIR, ".build-id");

// What to watch (no .git, no dist)
const IGNORE = new Set(["node_modules", "dist", ".git"]);

async function hashDir(dir: string): Promise<string> {
    const hash = crypto.createHash("sha1");

    async function walk(p: string) {
        const entries = await readdir(p, { withFileTypes: true });
        for (const e of entries) {
            if (IGNORE.has(e.name)) continue;
            const full = path.join(p, e.name);
            if (e.isDirectory()) await walk(full);
            else {
                const s = await stat(full);
                hash.update(full);
                hash.update(String(s.mtimeMs));
                hash.update(String(s.size));
            }
        }
    }

    await walk(dir);
    return hash.digest("hex");
}

async function run(cmd: string[]) {
    const p = Bun.spawn(cmd, { stdout: "inherit", stderr: "inherit" });
    const code = await p.exited;
    if (code !== 0) throw new Error(`${cmd.join(" ")} exited with ${code}`);
}

await mkdir(OUT_DIR, { recursive: true });

let lastHash = "";

console.log("🔁 Watching client/ via hash polling (no inotify)");

while (true) {
    try {
        const h = await hashDir(SRC_DIR);

        if (h !== lastHash) {
            console.log("🔨 Client changed — rebuilding…");
            lastHash = h;

            await run(["bunx", "@tailwindcss/cli", "-i", "./client/src/tailwind.css", "-o", "./client/generated.css"]);
            await run(["bun", "build", "./client/index.html", "--outdir=dist/client"]);

            await writeFile(BUILD_ID, String(Date.now()), "utf8");
        }
    } catch (e) {
        console.error("build-poll error:", e);
    }

    await new Promise(r => setTimeout(r, 1000));
}
