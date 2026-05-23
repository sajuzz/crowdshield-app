import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React frontend build
const frontendPath = path.join(process.cwd(), '../frontend/dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
} else {
  // Try Docker path
  const dockerPath = path.join(process.cwd(), 'frontend/dist');
  if (fs.existsSync(dockerPath)) {
    app.use(express.static(dockerPath));
  }
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

// Initial State
let zones = [
  { id: 'gate-a', name: 'Gate A Entrance', level: 'Normal', waitTime: 5 },
  { id: 'gate-b', name: 'Gate B Entrance', level: 'Normal', waitTime: 5 },
  { id: 'concourse-east', name: 'East Concourse', level: 'Normal', waitTime: 2 },
  { id: 'food-court', name: 'Main Food Court', level: 'Normal', waitTime: 10 }
];

let alerts = [];
let auditLogs = [];

function logAudit(message) {
  const logEntry = { timestamp: new Date().toISOString(), message };
  auditLogs.push(logEntry);
  // Also log to a file for persistence
  fs.appendFileSync(path.join(process.cwd(), 'audit.log'), JSON.stringify(logEntry) + '\n');
  io.emit('state-update', { auditLogs });
}

function calculateWaitTime(level, baseTime) {
  if (level === 'High') return baseTime * 3;
  if (level === 'Critical') return baseTime * 6;
  return baseTime;
}

// Automation Engine Rule Evaluator
function evaluateAutomationRules() {
  const activeAlerts = [];
  
  const gateA = zones.find(z => z.id === 'gate-a');
  const gateB = zones.find(z => z.id === 'gate-b');
  
  if (gateA.level === 'Critical' || gateA.level === 'High') {
    activeAlerts.push({
      title: 'Congestion at Gate A',
      message: 'Gate A is experiencing high traffic. Please reroute to Gate B for faster entry.'
    });
  }

  const foodCourt = zones.find(z => z.id === 'food-court');
  if (foodCourt.level === 'Critical') {
    activeAlerts.push({
      title: 'Food Court at Capacity',
      message: 'The main food court is at critical capacity. Please use the East Concourse concessions.'
    });
  }

  // Update alerts if not manually overridden by Emergency Mode
  if (!alerts.some(a => a.isEmergency)) {
    alerts = activeAlerts;
    io.emit('state-update', { alerts });
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial state
  socket.emit('initial-state', { zones, alerts, auditLogs });

  socket.on('admin-action', (action) => {
    switch(action.type) {
      case 'SET_CROWD_LEVEL': {
        const zone = zones.find(z => z.id === action.zoneId);
        if (zone) {
          zone.level = action.level;
          zone.waitTime = calculateWaitTime(action.level, 5); // baseline 5 for simplicity
          logAudit(`Admin changed crowd level for ${zone.name} to ${action.level}`);
          evaluateAutomationRules();
          io.emit('state-update', { zones });
        }
        break;
      }
      
      case 'TRIGGER_EMERGENCY': {
        const zone = zones.find(z => z.id === action.zoneId);
        if (zone) {
          zone.level = 'Critical';
          zone.waitTime = 99; // Closed
          logAudit(`CRITICAL: Admin triggered Emergency Mode at ${zone.name}`);
          
          alerts = [{
            isEmergency: true,
            title: `EMERGENCY: ${zone.name} CLOSED`,
            message: `An emergency has been declared at ${zone.name}. Please evacuate the area immediately and follow staff instructions.`
          }];
          
          io.emit('state-update', { zones, alerts });
        }
        break;
      }

      case 'CLEAR_ALERTS': {
        alerts = [];
        logAudit(`Admin cleared all active alerts.`);
        evaluateAutomationRules(); // re-evaluates in case some zones are still critical
        break;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`CrowdShield StadiumOps Backend running on port ${PORT}`);
  logAudit('System started.');
});
