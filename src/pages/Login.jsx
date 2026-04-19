import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginAsGuest } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = () => {
    setLoading(true); setError('');
    setTimeout(() => {
      const result = login(username, password);
      if (!result.success) setError('❌ Invalid username or password');
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '40px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>☕</div>
          <h1 style={{ color: '#fff', fontSize: '2rem', margin: 0 }}>CafeIQ</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '6px 0 0', fontSize: '0.9rem' }}>
            Cafeteria Management System
          </p>
        </div>

        {/* Staff Login */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Staff Login
          </p>

          <input
            type="text" value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Username"
            style={inputStyle}
          />
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            style={inputStyle}
          />

          {error && (
            <div style={{
              background: 'rgba(255,80,80,0.15)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: '8px', padding: '10px 14px',
              color: '#ff6b6b', fontSize: '0.85rem'
            }}>{error}</div>
          )}

          <button onClick={handleLogin} disabled={loading} style={btnPrimary}>
            {loading ? 'Signing in...' : '🔐 Sign In as Staff'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Guest / Student button */}
        <button onClick={loginAsGuest} style={btnGuest}>
          🎓 Enter as Student / Guest
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '400', opacity: 0.8, marginTop: '2px' }}>
            No password needed — order food directly
          </span>
        </button>

        {/* Staff credentials hint */}
        <div style={{ marginTop: '24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', textAlign: 'center', marginBottom: '10px' }}>
            Staff Demo Credentials (click to fill)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { role: 'Admin / Manager', user: 'admin',   pass: 'admin123',   color: '#667eea' },
              { role: 'Kitchen Staff',   user: 'kitchen', pass: 'kitchen123', color: '#f59e0b' },
            ].map(c => (
              <div
                key={c.role}
                onClick={() => { setUsername(c.user); setPassword(c.pass); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${c.color}40`,
                  borderRadius: '8px', padding: '8px 12px', cursor: 'pointer'
                }}
              >
                <span style={{ color: c.color, fontSize: '0.8rem', fontWeight: '600' }}>{c.role}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                  {c.user} / {c.pass}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 16px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px', color: '#fff',
  fontSize: '0.95rem', outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimary = {
  padding: '13px', width: '100%',
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  border: 'none', borderRadius: '10px',
  color: '#fff', fontSize: '0.95rem',
  fontWeight: '600', cursor: 'pointer',
};

const btnGuest = {
  width: '100%', padding: '14px',
  background: 'linear-gradient(135deg, #10b981, #059669)',
  border: 'none', borderRadius: '12px',
  color: '#fff', fontSize: '1rem',
  fontWeight: '700', cursor: 'pointer',
  textAlign: 'center', lineHeight: '1.4',
};