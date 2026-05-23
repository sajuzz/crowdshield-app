import React, { useState } from 'react';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulated Auth for MVP. To be replaced with Firebase Auth.
    if (password === 'admin123') {
      onLogin('mock-jwt-admin-token');
    } else if (password === 'sec456') {
      onLogin('mock-jwt-security-token');
    } else {
      setError('Invalid credentials. (Hint: admin123)');
    }
  };

  return (
    <div className="flex-col" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>Admin Portal</h2>
        <form onSubmit={handleLogin} className="flex-col gap-4">
          <div className="flex-col gap-2">
            <label>Security Key</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          {error && <p style={{ color: 'var(--status-critical)', fontSize: '0.875rem' }}>{error}</p>}
          <button type="submit" className="button-primary" style={{ marginTop: '1rem' }}>
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
}
