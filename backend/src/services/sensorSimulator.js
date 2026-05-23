import stadiumState from '../state/stadiumState.js';
import { runAutomationRules } from './ruleEngine.js';

let simulatorInterval = null;

export function startSensorSimulator() {
  if (simulatorInterval) return;
  
  console.log('[Simulator] Starting sensor simulation...');
  
  simulatorInterval = setInterval(async () => {
    // Check if system is in autonomous mode before simulating
    // In mock DB, state might be wrapped in 'global' after an update
    const rawState = stadiumState.getStadiumState();
    const mode = rawState.global ? rawState.global.mode : rawState.mode;
    
    if (mode !== 'AUTONOMOUS') return;

    const zones = stadiumState.getZones();
    
    // Pick one random zone to experience a massive crowd surge to trigger the autonomous engine
    const surgeZoneIndex = Math.floor(Math.random() * zones.length);

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      let newDensity = zone.density || 0;
      
      if (i === surgeZoneIndex) {
        // Create a massive surge to hit the 90%+ threshold
        newDensity += 30; 
      } else {
        // Normal minor fluctuation
        const change = Math.floor(Math.random() * 11) - 5;
        newDensity += change;
      }
      
      newDensity = Math.max(0, Math.min(95, newDensity)); // Cap at 95 to stay within realistic limits but trigger CRITICAL
      
      // Calculate new wait time based on density loosely
      let newWaitTime = Math.floor(newDensity / 5);
      
      let newStatus = 'NORMAL';
      if (newDensity >= 85) newStatus = 'CRITICAL';
      else if (newDensity >= 70) newStatus = 'HIGH';

      // Only update if there is a meaningful change to prevent spamming DB
      if (newStatus !== zone.status || Math.abs(newDensity - zone.density) >= 5) {
        await stadiumState.updateZone(zone.id, {
          density: newDensity,
          status: newStatus,
          waitTime: newWaitTime
        });
      }
    }

    // Run rules after sensors update
    runAutomationRules();
    
  }, 5000); // Run every 5 seconds instead of 10 for better demonstration
}

export function stopSensorSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    console.log('[Simulator] Stopped.');
  }
}
