import dbService from '../services/database/index.js';

class StadiumState {
  constructor() {
    this.zones = {};
    this.alerts = [];
    this.incidents = [];
    this.stadium_state = {};
    
    // Subscribe to DB changes to keep local cache in sync (for reads)
    dbService.onSnapshot('zones', (data) => {
      this.zones = data || {};
    });
    dbService.onSnapshot('alerts', (data) => {
      this.alerts = Object.values(data || {});
    });
    dbService.onSnapshot('incidents', (data) => {
      this.incidents = Object.values(data || {});
    });
    dbService.onSnapshot('stadium_state', (data) => {
      this.stadium_state = data || {};
    });
  }

  // --- Readers (from cache for speed) ---
  getZones() {
    return Object.values(this.zones);
  }

  getZone(zoneId) {
    return this.zones[zoneId];
  }

  getAlerts() {
    return this.alerts;
  }

  getIncidents() {
    return this.incidents;
  }

  getStadiumState() {
    return this.stadium_state;
  }

  // --- Writers (write through to DB) ---
  async updateStadiumState(key, value) {
    const currentState = this.stadium_state;
    await dbService.setDocument('stadium_state', 'global', {
      ...currentState,
      [key]: value
    });
  }

  async updateZone(zoneId, data) {
    await dbService.updateDocument('zones', zoneId, data);
  }

  async reportIncident(incidentData) {
    return await dbService.addDocument('incidents', {
      timestamp: Date.now(),
      status: 'OPEN',
      ...incidentData
    });
  }

  async addAlert(alertData) {
    return await dbService.addDocument('alerts', {
      timestamp: Date.now(),
      ...alertData
    });
  }

  async clearAlerts() {
    // In a real implementation, we might iterate and delete or mark as resolved.
    // For MVP, we'll reset the collection in mock, or iterate in Firestore.
    // Since mock doesn't support clear natively yet, we just overwrite.
    // To keep it simple, we'll just log it.
    await dbService.addDocument('audit_logs', {
      actor: 'ADMIN',
      action: 'CLEAR_ALERTS',
      timestamp: Date.now()
    });
    // In mock we can set doc if we modify the mock to allow it, 
    // but for now let's leave it as a placeholder. We will clear alerts individually.
  }
}

const stadiumState = new StadiumState();
export default stadiumState;
