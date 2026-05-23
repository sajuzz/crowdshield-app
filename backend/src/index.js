import express from 'express';
import cors from 'cors';
import http from 'http';
import { initializeSockets } from './sockets/socketManager.js';
import { startSensorSimulator } from './services/sensorSimulator.js';
import { startTicketSimulator } from './services/ticketSimulator.js';

const app = express();

import path from 'path';

app.use(cors());
app.use(express.json());

// Serve static frontend files in production
const frontendPath = path.join(process.cwd(), 'frontend', 'dist');
app.use(express.static(frontendPath));

// Fallback to React index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const server = http.createServer(app);

// Initialize our actual Socket.io Manager which handles the DB and RBAC
initializeSockets(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`[Server] CrowdShield AutoOps running on port ${PORT}`);
  
  // Start autonomous operations now that the server is successfully bound
  startSensorSimulator();
  startTicketSimulator();
});