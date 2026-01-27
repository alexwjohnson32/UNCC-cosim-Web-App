import path from "node:path";
import { moduleDir } from "./utils/moduleDir.js";
import { handleApi } from "./routes/index.js";

const __dirname = moduleDir(import.meta.url, import.meta.dir);
const port = Number(Bun.env.PORT ?? 3000);
const isProd = Bun.env.NODE_ENV === "production";

// IMPORTANT: serve from dist/client in BOTH dev and prod.
// Your dev loop will rebuild into dist/client, avoiding watch limits.
const clientRoot = path.resolve(process.cwd(), "dist", "client");
const indexPath = path.join(clientRoot, "index.html");
const buildIdPath = path.join(clientRoot, ".build-id");

function safeJoin(root, urlPathname) {
  const rel = urlPathname.replace(/^\/+/, "");
  const abs = path.resolve(root, rel);
  if (!abs.startsWith(path.resolve(root))) return null;
  return abs;
}

function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    // --- Build id for client auto-reload (polled by browser) ---
    if (url.pathname === "/__build-id") {
      const f = Bun.file(buildIdPath);
      if (await f.exists()) return textResponse((await f.text()).trim() || "0");
      return textResponse("0");
    }

    // --- API ---
    if (url.pathname.startsWith("/api")) {
      if (req.method === "OPTIONS") return new Response(null, { status: 204 });
      return handleApi(req, url);
    }

    // --- Static files ---
    const filePath = safeJoin(clientRoot, url.pathname);
    if (filePath) {
      const file = Bun.file(filePath);
      if (await file.exists()) return new Response(file);
    }

    // --- SPA fallback ---
    const indexFile = Bun.file(indexPath);
    if (await indexFile.exists()) {
      return new Response(indexFile, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }

    // Helpful error if build hasn't been run yet
    return new Response(
      `Frontend not built. Run: bun run dev (or bun run build)\nExpected: ${indexPath}\n`,
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  },
});

console.log(`✅ Bun listening on http://localhost:${port} (${isProd ? "prod" : "dev"})`);
console.log(`   Serving client from: ${clientRoot}`);
