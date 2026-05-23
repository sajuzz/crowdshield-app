import stadiumState from '../state/stadiumState.js';
import { triggerEmergency } from './automationService.js';
import dbService from './database/index.js';

export async function runAutomationRules() {
  const state = stadiumState.getStadiumState();
  if (state.mode === 'MANUAL') return;

  const matchPhase = state.matchPhase || 'PRE_MATCH';
  const zones = stadiumState.getZones();
  const alerts = stadiumState.getAlerts();

  for (const zoneId in zones) {
    const zone = zones[zoneId];
    
    // 1. Dynamic Thresholds based on Match Phase
    let criticalThreshold = 90;
    
    // E.g., During INTERVAL, food courts tolerate higher density before alarming
    if (matchPhase === 'INTERVAL' && zoneId.includes('food')) {
      criticalThreshold = 95;
    }
    // E.g., During POST_MATCH, gates tolerate higher density but we route aggressively
    if (matchPhase === 'POST_MATCH' && zoneId.includes('gate')) {
      criticalThreshold = 95;
    }

    if (zone.density >= criticalThreshold && zone.status !== 'EMERGENCY') {
      const alertExists = alerts.find(a => a.zoneId === zoneId && a.isEmergency);
      if (!alertExists) {
        console.log(`[AutoOps] Rule Triggered: ${zone.name} hit ${zone.density}% density (Phase: ${matchPhase})`);
        
        await dbService.addDocument('audit_logs', {
          actor: 'AUTONOMOUS_ENGINE',
          action: 'THRESHOLD_BREACH',
          details: `${zone.name} exceeded ${criticalThreshold}% density`,
          timestamp: Date.now()
        });

        // Trigger reroute or emergency
        await triggerEmergency(zoneId);
      }
    }
  }
}
