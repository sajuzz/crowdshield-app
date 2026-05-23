import React, { useState } from 'react';

export default function AdminDashboard({ 
  stadiumState, 
  zones, 
  auditLogs,
  onAdminAction
}) {
  const [incidentType, setIncidentType] = useState('MEDICAL');
  const [incidentZone, setIncidentZone] = useState(zones[0]?.id || '');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [matchScore, setMatchScore] = useState(stadiumState.matchScore || 'MI: 145/3 (15.2) | CSK: Yet to bat');

  const handleGlobalToggle = (key, value) => {
    onAdminAction({ type: 'UPDATE_GLOBAL_STATE', payload: { key, value } });
  };

  const handleReportIncident = () => {
    onAdminAction({ 
      type: 'REPORT_INCIDENT', 
      payload: { type: incidentType, zoneId: incidentZone, reportedBy: 'ADMIN_DASHBOARD' } 
    });
  };

  const handleBroadcast = () => {
    onAdminAction({
      type: 'BROADCAST_MESSAGE',
      payload: { title: broadcastTitle, message: broadcastMessage, isEmergency: false }
    });
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  const handleUpdateScore = () => {
    onAdminAction({
      type: 'UPDATE_GLOBAL_STATE',
      payload: { key: 'matchScore', value: matchScore }
    });
  };

  // Filter logs for the Autonomous feed
  const autoLogs = auditLogs.filter(log => log.actor === 'AUTONOMOUS_ENGINE').slice(-50);
  const generalLogs = auditLogs.slice(-50);

  // Metrics calculations
  const activeIncidents = auditLogs.filter(l => l.action === 'INCIDENT_REPORTED').length;
  const emergencyCount = alerts.filter(a => a.isEmergency).length;
  const congestedZones = zones.filter(z => z.density > 75).length;
  const avgWaitTime = zones.length > 0 ? Math.round(zones.reduce((acc, z) => acc + z.waitTime, 0) / zones.length) : 0;
  const autoActions = auditLogs.filter(l => l.actor === 'AUTONOMOUS_ENGINE').length;

  return (
    <div className="flex-col gap-4">
      
      {/* Metrics Banner */}
      <div className="panel grid-cols-4" style={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--accent-blue)' }}>
        <div className="flex-col" style={{ alignItems: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Avg Wait Time</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{avgWaitTime}m</p>
        </div>
        <div className="flex-col" style={{ alignItems: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Congested Zones</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: congestedZones > 0 ? 'var(--status-high)' : 'inherit' }}>{congestedZones}</p>
        </div>
        <div className="flex-col" style={{ alignItems: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Active Emergencies</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: emergencyCount > 0 ? 'var(--status-critical)' : 'inherit' }}>{emergencyCount}</p>
        </div>
        <div className="flex-col" style={{ alignItems: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>AutoOps Actions</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{autoActions}</p>
        </div>
      </div>

      {/* Top Control Bar */}
      <div className="panel flex-row justify-between">
        <div className="flex-row gap-4">
          <div className="flex-col">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Match Phase</label>
            <select 
              value={stadiumState.matchPhase || 'PRE_MATCH'} 
              onChange={(e) => handleGlobalToggle('matchPhase', e.target.value)}
            >
              <option value="PRE_MATCH">Pre-Match</option>
              <option value="LIVE_MATCH">Live Match</option>
              <option value="POST_MATCH">Post-Match</option>
            </select>
          </div>
          <div className="flex-col">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Weather</label>
            <select 
              value={stadiumState.weather || 'CLEAR'} 
              onChange={(e) => handleGlobalToggle('weather', e.target.value)}
            >
              <option value="CLEAR">Clear</option>
              <option value="RAIN">Rain</option>
              <option value="STORM">Storm / Lightning</option>
            </select>
          </div>
        </div>
        <div className="flex-col">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>System Mode</label>
            <select 
              value={stadiumState.mode || 'AUTONOMOUS'} 
              onChange={(e) => handleGlobalToggle('mode', e.target.value)}
              style={{ fontWeight: 'bold', color: stadiumState.mode === 'AUTONOMOUS' ? 'var(--status-low)' : 'var(--status-moderate)' }}
            >
              <option value="AUTONOMOUS">Autonomous Ops</option>
              <option value="MANUAL">Manual Override</option>
            </select>
        </div>
      </div>

      {/* Broadcast & Match Score Bar */}
      <div className="panel flex-row gap-4" style={{ backgroundColor: 'var(--bg-dark)' }}>
        <div className="flex-col" style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Update Match Score (IPL)</h4>
          <div className="flex-row gap-2">
            <input 
              type="text" 
              value={matchScore} 
              onChange={e => setMatchScore(e.target.value)} 
              placeholder="e.g. MI: 145/3 (15.2)"
              style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-light)', borderRadius: '4px' }}
            />
            <button className="button-primary" onClick={handleUpdateScore}>Update</button>
          </div>
        </div>
        <div className="flex-col" style={{ flex: 2 }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Broadcast Message to Attendees</h4>
          <div className="flex-row gap-2">
            <input 
              type="text" 
              value={broadcastTitle} 
              onChange={e => setBroadcastTitle(e.target.value)} 
              placeholder="Title"
              style={{ width: '150px', padding: '0.5rem', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-light)', borderRadius: '4px' }}
            />
            <input 
              type="text" 
              value={broadcastMessage} 
              onChange={e => setBroadcastMessage(e.target.value)} 
              placeholder="Message..."
              style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-light)', borderRadius: '4px' }}
            />
            <button className="button-primary" onClick={handleBroadcast}>Send Broadcast</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Zones and Incidents */}
        <div className="flex-col gap-4">
          
          {/* Incident Reporting Panel */}
          <div className="panel" style={{ borderLeft: '4px solid var(--status-high)' }}>
            <h3 className="panel-header">🚨 Dispatch Incident</h3>
            <div className="flex-row gap-4">
              <select value={incidentType} onChange={e => setIncidentType(e.target.value)} style={{ flex: 1 }}>
                <option value="MEDICAL">Medical Emergency (HIGH)</option>
                <option value="FIRE">Fire / Smoke (CRITICAL)</option>
                <option value="SECURITY_BREACH">Security Breach (CRITICAL)</option>
                <option value="CROWD_SURGE">Crowd Surge (HIGH)</option>
                <option value="BLOCKED_EXIT">Blocked Exit (CRITICAL)</option>
                <option value="WEATHER_ALERT">Severe Weather (MEDIUM)</option>
              </select>
              <select value={incidentZone} onChange={e => setIncidentZone(e.target.value)} style={{ flex: 1 }}>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
              <button className="button-danger" onClick={handleReportIncident}>
                Report Incident
              </button>
            </div>
          </div>

          {/* Zone Grid */}
          <div className="panel">
            <h3 className="panel-header">Live Zone Monitoring</h3>
            <div className="grid-cols-2">
              {zones.map(zone => {
                let badgeClass = 'badge-low';
                if (zone.status === 'MODERATE') badgeClass = 'badge-moderate';
                if (zone.status === 'HIGH') badgeClass = 'badge-high';
                if (zone.status === 'CRITICAL') badgeClass = 'badge-critical';
                if (zone.status === 'EMERGENCY') badgeClass = 'badge-emergency';

                return (
                  <div key={zone.id} className="panel flex-col" style={{ backgroundColor: 'var(--bg-dark)', padding: '1rem' }}>
                    <div className="flex-row justify-between" style={{ marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1rem' }}>{zone.name}</h4>
                      <span className={`badge ${badgeClass}`}>{zone.status}</span>
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ width: '100%', backgroundColor: 'var(--border-color)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${zone.density}%`, 
                          height: '100%', 
                          backgroundColor: zone.density > 85 ? 'var(--status-critical)' : zone.density > 70 ? 'var(--status-high)' : 'var(--status-low)',
                          transition: 'width 0.5s ease'
                        }}></div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>Density: {zone.density}%</p>
                    </div>

                    <div className="flex-row gap-2" style={{ flexWrap: 'wrap' }}>
                      <button className="button-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => onAdminAction({ type: 'SET_CROWD_LEVEL', zoneId: zone.id, level: 'Normal' })}>Set Normal</button>
                      <button className="button-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => onAdminAction({ type: 'SET_CROWD_LEVEL', zoneId: zone.id, level: 'High' })}>Set High</button>
                      <button className="button-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => onAdminAction({ type: 'TRIGGER_EMERGENCY', zoneId: zone.id })}>EMERGENCY</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Feeds */}
        <div className="flex-col gap-4">
          
          {/* Autonomous Action Feed */}
          <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="panel-header" style={{ color: 'var(--accent-blue)' }}>⚡ Autonomous Actions</h3>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
              {autoLogs.length === 0 ? <p className="text-muted">No autonomous actions yet.</p> : null}
              {autoLogs.slice().reverse().map((log, idx) => (
                <div key={idx} className="feed-item">
                  <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <strong>AUTOOPS: </strong> {log.action} - {log.details}
                </div>
              ))}
            </div>
          </div>

          {/* General Audit Logs */}
          <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="flex-row justify-between panel-header">
              <h3>System Audit Logs</h3>
              <button className="button-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => onAdminAction({ type: 'CLEAR_ALERTS' })}>
                Clear Active Alerts
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
              {generalLogs.length === 0 ? <p className="text-muted">No logs yet.</p> : null}
              {generalLogs.slice().reverse().map((log, idx) => (
                <div key={idx} className="feed-item">
                  <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span style={{ color: log.actor === 'ADMIN' ? 'var(--status-moderate)' : 'inherit' }}>{log.actor}:</span> {log.action} {log.details && `- ${log.details}`}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
