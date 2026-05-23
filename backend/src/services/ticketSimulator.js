import dbService from './database/index.js';
import stadiumState from '../state/stadiumState.js';

let simulatorInterval;

export function startTicketSimulator() {
  if (simulatorInterval) return;

  console.log('[Simulator] Starting Ticket Flow Simulator...');
  
  simulatorInterval = setInterval(async () => {
    try {
      const mode = stadiumState.getStadiumState().mode || 'AUTONOMOUS';
      if (mode === 'MANUAL') return; // Pause simulation if manual override is active

      // Simulate a burst of tickets at a random gate
      const zones = stadiumState.getZones();
      const gates = Object.values(zones).filter(z => z.id.startsWith('gate-'));
      if (gates.length === 0) return;

      const randomGate = gates[Math.floor(Math.random() * gates.length)];
      
      // Simulate scan count (10 to 50 scans)
      const scans = Math.floor(Math.random() * 40) + 10;
      
      console.log(`[Simulator] Ticket Flow: ${scans} scans at ${randomGate.name}`);
      
      // Add to ticket flows collection
      await dbService.addDocument('ticket_flows', {
        zoneId: randomGate.id,
        scans,
        timestamp: Date.now()
      });

      // Increase density slightly to simulate the incoming crowd
      const newDensity = Math.min(100, randomGate.density + (scans * 0.1));
      let newStatus = 'NORMAL';
      if (newDensity > 60) newStatus = 'MODERATE';
      if (newDensity > 75) newStatus = 'HIGH';
      if (newDensity > 90) newStatus = 'CRITICAL';

      await stadiumState.updateZone(randomGate.id, {
        density: Math.round(newDensity * 10) / 10,
        status: newStatus
      });

    } catch (err) {
      console.error('[Simulator] Ticket Flow Error:', err.message);
    }
  }, 10000); // Simulate every 10 seconds
}

export function stopTicketSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    console.log('[Simulator] Stopped Ticket Flow Simulator');
  }
}
