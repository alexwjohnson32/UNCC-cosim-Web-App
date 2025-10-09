// server.js
import cors from 'cors';
import express from "express";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import * as routes from './routes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

// ======================= API Routes ======================= //

// Build JSON and then run apptainer exec build.sh
app.post('/api/config', routes.generateConfiguration);   // create config folders/files
app.post('/api/build', routes.buildInApptainer);         // run build.sh in Apptainer
app.post('/api/run', routes.runInApptainer);             // run run.sh in Apptainer

// ---- REST logs: producers POST, clients GET ----

// POST raw text to append logs (Content-Type: text/plain recommended)
app.post('/api/logs/append', express.text({ type: '*/*' }), (req, res) => {
  const body = typeof req.body === 'string' ? req.body : '';
  pushLog(body);
  res.json({ success: true, lastId: LOG_SEQ, added: body.split(/\r?\n/).filter(Boolean).length });
});

// ======================= Serve Frontend in Production ======================= //
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('/', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ======================= Start HTTP Server ======================= //
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`HTTP listening on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in development mode');
  }
});
