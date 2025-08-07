import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as routes from './routes.js';
import { spawnSync } from "child_process";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// ======================= Serve Frontend in Production ======================= //
if (process.env.NODE_ENV === 'production') {
  // Needed to get __dirname in ES module
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Correct path to client/dist (relative to server.js)
  const distPath = path.join(__dirname, '..', 'client', 'dist');

  // Serve static files
  app.use(express.static(distPath));

  app.get('/', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ======================= API Routes ======================= //

// Need a route to retrieve model schemas

// Need a route to build JSON
app.post('/generate-configuration', routes.generateConfiguration);

// Need a route to run sim
app.get('/runSim', (req, res) => {
  const result = spawnSync('npm', ['install'], {
    cwd: this.destinationPath(),
    stdio: 'inherit',
    shell: true
  });
})

// ======================= Start Server ======================= //
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in development mode');
  }
});
