import { Server } from 'socket.io';
import stadiumState from '../state/stadiumState.js';
import dbService from '../services/database/index.js';
import { triggerEmergency, handleIncident } from '../services/automationService.js';
import { runAutomationRules } from '../services/ruleEngine.js';

let io;

// Simple rate limiter (in-memory, per IP/Socket ID for MVP)
const rateLimits = {};
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
const MAX_ACTIONS_PER_WINDOW = 3;

function isRateLimited(socketId) {
  const now = Date.now();
  if (!rateLimits[socketId]) {
    rateLimits[socketId] = { count: 1, firstAction: now };
    return false;
  }
  const record = rateLimits[socketId];
  if (now - record.firstAction < RATE_LIMIT_WINDOW) {
    if (record.count >= MAX_ACTIONS_PER_WINDOW) return true;
    record.count++;
    return false;
  } else {
    rateLimits[socketId] = { count: 1, firstAction: now };
    return false;
  }
}

const VALID_INCIDENT_TYPES = ['MEDICAL', 'FIRE', 'SECURITY_BREACH', 'CROWD_SURGE', 'BLOCKED_EXIT', 'WEATHER_ALERT'];
const VALID_CROWD_LEVELS = ['Normal', 'High', 'Critical'];

import { verifyAdminToken, hasRequiredRole } from '../middleware/auth.js';

export function initializeSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);
    
    // Send initial state
    socket.emit('initial-state', {
      stadiumState: stadiumState.getStadiumState(),
      zones: stadiumState.getZones(),
      alerts: stadiumState.getAlerts(),
      incidents: stadiumState.getIncidents()
    });
    
    // Fetch and send audit logs on connect
    dbService.getCollection('audit_logs').then(logs => {
      socket.emit('state-update', { auditLogs: logs });
    });

    socket.on('admin-action', async (action) => {
      
      // SECURITY: 1. Rate Limiting
      if (isRateLimited(socket.id)) {
        console.warn(`[Security] Socket ${socket.id} rate limited.`);
        socket.emit('action-error', { message: 'Too many requests. Please wait.' });
        return;
      }

      // SECURITY: 2. Input Validation
      if (!action || !action.type || !action.token) {
        console.warn(`[Security] Invalid action payload from ${socket.id}`);
        socket.emit('action-error', { message: 'Missing token or action type.' });
        return;
      }

      console.log(`[Socket] Admin Action Attempt: ${action.type}`);
      
      try {
        // SECURITY: 3. JWT Verification & RBAC
        const user = await verifyAdminToken(action.token);
        console.log(`[Auth] Verified User: ${user.email} (Role: ${user.role})`);

        // Check Roles based on action
        if (['UPDATE_GLOBAL_STATE', 'TRIGGER_EMERGENCY', 'CLEAR_ALERTS', 'SET_CROWD_LEVEL'].includes(action.type)) {
          if (!hasRequiredRole(user, 'ADMIN')) throw new Error('Unauthorized: Requires ADMIN role');
        }
        
        if (action.type === 'REPORT_INCIDENT') {
          if (!hasRequiredRole(user, 'SECURITY_OFFICER')) throw new Error('Unauthorized: Requires SECURITY_OFFICER role');
        }

        switch(action.type) {
          case 'SET_CROWD_LEVEL': {
            const { zoneId, level } = action;
            if (!VALID_CROWD_LEVELS.includes(level)) throw new Error('Invalid crowd level');
            if (!stadiumState.getZone(zoneId)) throw new Error('Invalid zone ID');
            
            let density = 50;
            if (level === 'Normal') density = 30;
            if (level === 'High') density = 75;
            if (level === 'Critical') density = 95;
            
            await stadiumState.updateZone(zoneId, {
              status: level.toUpperCase(),
              density,
              waitTime: level === 'Critical' ? 25 : (level === 'High' ? 15 : 5)
            });

            await dbService.addDocument('audit_logs', {
              actor: 'ADMIN',
              action: 'SET_CROWD_LEVEL',
              details: `Set ${zoneId} to ${level}`,
              timestamp: Date.now()
            });

            runAutomationRules();
            break;
          }
          
          case 'TRIGGER_EMERGENCY': {
            if (!stadiumState.getZone(action.zoneId)) throw new Error('Invalid zone ID');
            await triggerEmergency(action.zoneId);
            break;
          }

          case 'CLEAR_ALERTS': {
            await stadiumState.clearAlerts();
            break;
          }

          case 'REPORT_INCIDENT': {
            const { type, zoneId } = action.payload || {};
            if (!VALID_INCIDENT_TYPES.includes(type)) throw new Error(`Invalid incident type: ${type}`);
            if (!stadiumState.getZone(zoneId)) throw new Error(`Invalid zone ID: ${zoneId}`);

            await handleIncident(action.payload);
            break;
          }

          case 'UPDATE_GLOBAL_STATE': {
            const { key, value } = action.payload || {};
            if (!['matchPhase', 'weather', 'mode', 'matchScore'].includes(key)) throw new Error('Invalid global state key');

            await stadiumState.updateStadiumState(key, value);
            await dbService.addDocument('audit_logs', {
              actor: 'ADMIN',
              action: 'UPDATE_GLOBAL_STATE',
              details: `Changed ${key} to ${value}`,
              timestamp: Date.now()
            });
            break;
          }

          case 'BROADCAST_MESSAGE': {
            const { title, message, isEmergency } = action.payload || {};
            await stadiumState.addAlert({ title, message, isEmergency: !!isEmergency });
            await dbService.addDocument('audit_logs', {
              actor: 'ADMIN',
              action: 'BROADCAST_MESSAGE',
              details: `Sent ${isEmergency ? 'Emergency ' : ''}Message: ${title}`,
              timestamp: Date.now()
            });
            break;
          }
          
          default:
            console.warn(`[Security] Unknown action type: ${action.type}`);
        }
      } catch (err) {
        console.error(`[Security] Action rejected: ${err.message}`);
        socket.emit('action-error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  // Wire up database listeners to broadcast updates via Socket.io
  dbService.onSnapshot('stadium_state', (state) => {
    // mock DB stores it under 'global' key if we use setDocument, 
    // but originally it was just an object. Let's just pass the whole thing.
    // In our stadiumState we did setDocument('stadium_state', 'global', ...)
    // So the state here might be { global: { mode: ... } } or just { mode: ... }
    // Let's extract the global doc if it exists, otherwise pass state.
    const globalState = state.global || state;
    if (io) io.emit('state-update', { stadiumState: globalState });
  });

  dbService.onSnapshot('zones', (zonesMap) => {
    if (io) io.emit('state-update', { zones: Object.values(zonesMap || {}) });
  });

  dbService.onSnapshot('alerts', (alertsMap) => {
    if (io) io.emit('state-update', { alerts: Object.values(alertsMap || {}) });
  });

  dbService.onSnapshot('audit_logs', (logsMap) => {
    if (io) io.emit('state-update', { auditLogs: Object.values(logsMap || {}) });
  });

  dbService.onSnapshot('incidents', (incidentsMap) => {
    if (io) io.emit('state-update', { incidents: Object.values(incidentsMap || {}) });
  });
}
