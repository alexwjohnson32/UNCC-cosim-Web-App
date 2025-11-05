import { Router } from "express";
import express from "express";

const router = Router();

// ---- REST logs: producers POST, clients GET ----

// POST raw text to append logs (Content-Type: text/plain recommended)
router.post('/append', express.text({ type: '*/*' }), (req, res) => {
    const body = typeof req.body === 'string' ? req.body : '';
    pushLog(body);
    res.json({ success: true, lastId: LOG_SEQ, added: body.split(/\r?\n/).filter(Boolean).length });
});

/* Utility functions */

// ======================= In-memory log buffer ======================= //
let LOG_SEQ = 0;
/** @type {{ id:number, text:string, ts:number }[]} */
const LOGS = [];

function pushLog(text) {
    // Split on newlines so each line is a separate entry (optional)
    const lines = String(text ?? "").split(/\r?\n/);
    for (const line of lines) {
        if (line === "") continue; // skip empty lines; remove if you want to keep them
        LOGS.push({ id: ++LOG_SEQ, text: line, ts: Date.now() });
    }
}

function getLogsAfter(afterId) {
    const aid = Number.isFinite(afterId) ? afterId : 0;
    // LOGS are append-only; filter is fine for modest volumes. For big volumes, keep a moving window.
    return LOGS.filter(e => e.id > aid);
}

export default router;