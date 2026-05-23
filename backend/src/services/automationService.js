import stadiumState from '../state/stadiumState.js';
import dbService from './database/index.js';

export async function triggerAlert(alertData) {
  console.log(`[Automation] Triggering Alert: ${alertData.title}`);
  
  // 1. Add to alerts collection
  const docId = await stadiumState.addAlert(alertData);
  
  // 2. Add audit log
  await dbService.addDocument('audit_logs', {
    actor: 'AUTONOMOUS_ENGINE',
    action: 'ALERT_TRIGGERED',
    details: alertData.title,
    timestamp: Date.now()
  });
  
  return docId;
}

export async function clearResolvedAlerts(activeAlertKeys) {
  // Logic to clear resolved alerts goes here
}

export async function handleIncident(incidentData) {
  console.log(`[Automation] Processing New Incident: ${incidentData.type}`);
  
  // 1. Report incident to state
  await stadiumState.reportIncident(incidentData);
  
  // 2. Audit log
  await dbService.addDocument('audit_logs', {
    actor: incidentData.reportedBy || 'SYSTEM',
    action: 'INCIDENT_REPORTED',
    details: `${incidentData.type} at ${incidentData.zoneId}`,
    timestamp: Date.now()
  });

  // 3. Autonomous rule: If incident is severe (e.g. MEDICAL, FIRE), trigger emergency
  if (['MEDICAL', 'FIRE', 'SECURITY_BREACH'].includes(incidentData.type)) {
    console.log(`[Automation] Escalating ${incidentData.type} incident to EMERGENCY mode.`);
    await triggerEmergency(incidentData.zoneId);
  }
}

export async function triggerEmergency(zoneId) {
  const zone = stadiumState.getZone(zoneId);
  if (!zone) return;

  console.log(`[Automation] EMERGENCY INITIATED AT ${zone.name}`);

  await stadiumState.updateZone(zoneId, {
    status: 'CRITICAL',
    density: 100,
    waitTime: 99
  });

  await triggerAlert({
    key: `EMERGENCY_${zoneId}`,
    type: 'EMERGENCY',
    title: `EMERGENCY: ${zone.name} CLOSED`,
    message: `An emergency has been declared at ${zone.name}. Evacuate immediately.`,
    isEmergency: true,
    zoneId: zone.id
  });

  await dbService.addDocument('audit_logs', {
    actor: 'ADMIN',
    action: 'EMERGENCY_TRIGGERED',
    details: `Emergency declared at ${zone.name}`,
    timestamp: Date.now()
  });
}
