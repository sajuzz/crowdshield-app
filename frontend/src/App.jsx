import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import AdminDashboard from './components/AdminDashboard';
import AttendeeDashboard from './components/AttendeeDashboard';
import AdminLogin from './components/AdminLogin';

const socket = io('/', { autoConnect: false });

export default function App() {
  const [view, setView] = useState('admin');
  const [authToken, setAuthToken] = useState(null);
  const [stadiumState, setStadiumState] = useState({});
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    socket.connect();
    
    socket.on('initial-state', (state) => {
      if (state.stadiumState) setStadiumState(state.stadiumState);
      if (state.zones) setZones(state.zones);
      if (state.alerts) setAlerts(state.alerts);
      if (state.auditLogs) setAuditLogs(state.auditLogs);
    });

    socket.on('state-update', (state) => {
      if (state.stadiumState) setStadiumState(state.stadiumState);
      if (state.zones) setZones(state.zones);
      if (state.alerts) setAlerts(state.alerts);
      if (state.auditLogs) setAuditLogs(state.auditLogs);
    });
    
    socket.on('action-error', (err) => {
      alert(`Backend Error: ${err.message}`);
    });

    return () => {
      socket.off('initial-state');
      socket.off('state-update');
      socket.off('action-error');
    };
  }, []);

  const handleAdminAction = (action) => {
    socket.emit('admin-action', { ...action, token: authToken });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header className="flex-row justify-between" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h1 style={{ color: 'var(--accent-blue)' }}>CrowdShield AutoOps</h1>
        <div className="flex-row gap-4">
          <button 
            className={view === 'attendee' ? 'button-primary' : 'button-outline'} 
            onClick={() => setView('attendee')}
          >
            Attendee View
          </button>
          <button 
            className={view === 'admin' ? 'button-primary' : 'button-outline'}
            onClick={() => setView('admin')}
          >
            Admin Ops Panel
          </button>
        </div>
      </header>

      {view === 'attendee' ? (
        <AttendeeDashboard zones={zones} alerts={alerts} stadiumState={stadiumState} />
      ) : !authToken ? (
        <AdminLogin onLogin={(token) => setAuthToken(token)} />
      ) : (
        <AdminDashboard 
          stadiumState={stadiumState}
          zones={zones} 
          alerts={alerts}
          auditLogs={auditLogs} 
          onAdminAction={handleAdminAction}
        />
      )}
    </div>
  );
}
