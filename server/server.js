// server.js
import cors from 'cors';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as routes from './routes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ======================= API Routes ======================= //

// Build JSON and then run apptainer exec build.sh
app.post('/api/config', routes.generateConfiguration);   // create config folders/files
app.post('/api/build', routes.buildInApptainer);        // run build.sh in Apptainer
app.post('/api/run', routes.runInApptainer);          // run run.sh   in Apptainer

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

// ======================= Start Server ======================= //
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running in development mode');
  }
});
