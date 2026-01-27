import { handleSimulation } from "./simulation.routes.js";
import { handleComponents } from "./components.routes.js";
import { handleLogs } from "./logs.routes.js";

export async function handleApi(req, url) {
    const p = url.pathname;

    if (p.startsWith("/api/simulation")) return handleSimulation(req, url);
    if (p.startsWith("/api/components")) return handleComponents(req, url);
    if (p.startsWith("/api/logs")) return handleLogs(req, url);

    return Response.json({ error: "Not found" }, { status: 404 });
}
