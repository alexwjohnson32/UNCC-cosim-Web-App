// ======================= In-memory log buffer ======================= //
let LOG_SEQ = 0;
/** @type {{ id:number, text:string, ts:number }[]} */
const LOGS = [];

function pushLog(text) {
    const lines = String(text ?? "").split(/\r?\n/);
    for (const line of lines) {
        if (line === "") continue;
        LOGS.push({ id: ++LOG_SEQ, text: line, ts: Date.now() });
    }
}

function getLogsAfter(afterId) {
    const aid = Number.isFinite(afterId) ? afterId : 0;
    return LOGS.filter((e) => e.id > aid);
}

function json(data, init = {}) {
    return Response.json(data, init);
}

export async function handleLogs(req, url) {
    const base = "/api/logs";
    const subPath = url.pathname.slice(base.length) || "/";

    // POST raw text to append logs (Content-Type: text/plain recommended)
    if (req.method === "POST" && subPath === "/append") {
        const body = await req.text().catch(() => "");
        pushLog(body);

        const added = String(body)
            .split(/\r?\n/)
            .filter(Boolean).length;

        return json({ success: true, lastId: LOG_SEQ, added });
    }

    // (Optional but useful) GET logs after id: /api/logs?after=123
    // You mentioned clients GET, but it wasn't in the Express snippet.
    if (req.method === "GET" && (subPath === "/" || subPath === "")) {
        const after = Number(url.searchParams.get("after") ?? "0");
        return json({ success: true, lastId: LOG_SEQ, logs: getLogsAfter(after) });
    }

    return json({ error: "Not found" }, { status: 404 });
}
