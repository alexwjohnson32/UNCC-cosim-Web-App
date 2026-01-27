// server/routes/components.routes.js
import fs from "node:fs/promises";

// Load once at module init (same as your current top-level await)
const components = JSON.parse(
    await fs.readFile(new URL("../db.json", import.meta.url), "utf-8")
).components;

function json(data, init = {}) {
    return Response.json(data, init);
}

export async function handleComponents(req, url) {
    const base = "/api/components";
    const subPath = url.pathname.slice(base.length) || "/";

    // GET /api/components
    if (req.method === "GET" && (subPath === "/" || subPath === "")) {
        return json({ success: true, components });
    }

    return json({ error: "Not found" }, { status: 404 });
}
