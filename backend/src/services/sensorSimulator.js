import stadiumState from '../state/stadiumState.js';
import { runAutomationRules } from './ruleEngine.js';

let simulatorInterval = null;

export function startSensorSimulator() {
  if (simulatorInterval) return;
  
  console.log('[Simulator] Starting sensor simulation...');
  
  simulatorInterval = setInterval(async () => {
    // Check if system is in autonomous mode before simulating
    const state = stadiumState.getStadiumState();
    if (state.mode !== 'AUTONOMOUS') return;

    const zones = stadiumState.getZones();
    
    // Randomly fluctuate density for each zone
    for (const zone of zones) {
      // Small random fluctuation between -5 and +5
      const change = Math.floor(Math.random() * 11) - 5;
      let newDensity = Math.max(0, Math.min(100, (zone.density || 0) + change));
      
      // Calculate new wait time based on density loosely
      let newWaitTime = Math.floor(newDensity / 5);
      
      let newStatus = 'NORMAL';
      if (newDensity > 85) newStatus = 'CRITICAL';
      else if (newDensity > 70) newStatus = 'HIGH';

      // Only update if there is a meaningful change to prevent spamming DB
      if (newStatus !== zone.status || Math.abs(newDensity - zone.density) > 5) {
        await stadiumState.updateZone(zone.id, {
          density: newDensity,
          status: newStatus,
          waitTime: newWaitTime
        });
      }
    }

    // Run rules after sensors update
    runAutomationRules();
    
  }, 10000); // Run every 10 seconds
}

export function stopSensorSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    console.log('[Simulator] Stopped.');
  }
}
