// server.js
import cors from 'cors';
import express from "express";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import routes from './routes/index.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// prefix all routes with /api
app.use("/api", routes);

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
