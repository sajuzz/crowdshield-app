import React from 'react';

export default function AttendeeDashboard({ zones, alerts, stadiumState }) {
  // Filter active emergency alerts to display them prominently
  const emergencyAlerts = alerts.filter(a => a.isEmergency);
  const standardAlerts = alerts.filter(a => !a.isEmergency);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      
      {/* IPL Scoreboard Banner */}
      <div className="panel" style={{ backgroundColor: 'var(--accent-blue)', color: '#fff', textAlign: 'center', marginBottom: '2rem', borderColor: 'var(--accent-blue)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🏆 Live IPL Match Score</h2>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stadiumState?.matchScore || 'Match not started'}</p>
      </div>

      {emergencyAlerts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          {emergencyAlerts.map((alert, idx) => (
            <div key={idx} className="panel" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'var(--status-critical)', animation: 'flash 2s infinite' }}>
              <h2 style={{ color: 'var(--status-critical)', marginBottom: '0.5rem' }}>🚨 {alert.title}</h2>
              <p style={{ fontSize: '1.125rem' }}>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {standardAlerts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          {standardAlerts.map((alert, idx) => (
            <div key={idx} className="panel" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'var(--status-high)' }}>
              <h3 style={{ color: 'var(--status-high)' }}>⚠️ {alert.title}</h3>
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginBottom: '1rem' }}>Live Wait Times</h2>
      <div className="grid-cols-2">
        {zones.map(zone => {
          let badgeClass = 'badge-low';
          if (zone.status === 'MODERATE') badgeClass = 'badge-moderate';
          if (zone.status === 'HIGH') badgeClass = 'badge-high';
          if (zone.status === 'CRITICAL') badgeClass = 'badge-critical';
          if (zone.status === 'EMERGENCY') badgeClass = 'badge-emergency';

          return (
            <div key={zone.id} className="panel flex-col justify-between">
              <div>
                <h3 style={{ fontSize: '1.125rem' }}>{zone.name}</h3>
                <div style={{ margin: '0.75rem 0' }}>
                  <span className={`badge ${badgeClass}`}>{zone.status}</span>
                </div>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Estimated Wait:</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{zone.waitTime} mins</p>
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-base)', borderRadius: '4px' }}>
                  <p style={{ fontSize: '0.875rem', color: zone.density > 75 ? 'var(--status-critical)' : 'var(--text-light)' }}>
                    <strong>Crowd Density:</strong> {zone.density}% {zone.density > 75 ? '(High Crowd)' : '(Normal)'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
