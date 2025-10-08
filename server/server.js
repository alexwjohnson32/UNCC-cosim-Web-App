// server.js
import cors from 'cors';
import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import * as routes from './routes.js';

const app = express();
const port = process.env.PORT || 3000;

// optional: allow overriding WS port via env
const WS_PORT = Number(process.env.WS_PORT ?? 23555);

app.use(cors());
app.use(express.json());

// ======================= API Routes ======================= //

// Build JSON and then run apptainer exec build.sh
app.post('/api/config', routes.generateConfiguration);   // create config folders/files
app.post('/api/build', routes.buildInApptainer);         // run build.sh in Apptainer
app.post('/api/run', routes.runInApptainer);             // run run.sh in Apptainer

// ---- Simple HTTP hook to push log lines to WS clients ----
app.post('/api/logs/append', express.text({ type: '*/*' }), (req, res) => {
  const line = typeof req.body === 'string' ? req.body : '';
  broadcastLog(line);
  res.json({ success: true, bytes: Buffer.byteLength(line) });
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

// ======================= Standalone WS Server @ localhost:23555 ======================= //
// This WS server is separate from the HTTP server and listens on its own port.
// Other processes can connect via ws://localhost:23555/ws/logs
const wss = new WebSocketServer({
  port: WS_PORT,
  host: '127.0.0.1',     // restrict to localhost
  path: '/ws/logs'
});

wss.on('listening', () => {
  console.log(`WebSocket listening on ws://localhost:${WS_PORT}/ws/logs`);
});

wss.on('connection', (ws) => {
  try { ws.send('connected'); } catch { }

  ws.on('message', (data) => {
    const line = data instanceof Buffer ? data.toString() : String(data);
    broadcastLog(line); // fan out to everyone
  });
});

// Broadcast helper used by /api/logs/append and any server-side producers
function broadcastLog(line) {
  const msg = typeof line === 'string' ? line : JSON.stringify(line);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      try { client.send(msg); } catch { }
    }
  }
}

export { broadcastLog, wss };
