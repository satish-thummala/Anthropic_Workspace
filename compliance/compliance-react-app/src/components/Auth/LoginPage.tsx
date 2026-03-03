import React, { useState } from 'react';
import { Icons } from '../shared/Icons';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!email)                          e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = 'Invalid email format';
    if (!password)                       e.password = 'Password is required';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (!ok) setErrors({ general: 'Invalid credentials. Try the demo accounts below.' });
  }

  return (
    <div className="login-wrap">
      <div className="login-left">
        <div className="login-logo">
          <Icons.Shield style={{ width: 28, height: 28, color: 'white' }} />
        </div>
        <h1 className="login-hero-title">AI-Powered<br /><span>Compliance Platform</span></h1>
        <p className="login-hero-desc">
          Automate compliance documentation, track audit evidence, and identify regulatory gaps
          across ISO, SOC, HIPAA, and GDPR frameworks.
        </p>
        <div className="login-features">
          {[
            'Automated gap analysis across 4+ frameworks',
            'Risk scoring and compliance dashboards',
            'Document ingestion from Word, PDF, Confluence',
            'Audit-ready reporting and policy generation',
          ].map((f) => (
            <div key={f} className="login-feature">
              <div className="login-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">Sign in to access your compliance dashboard</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className={`form-input${errors.email ? ' error' : ''}`}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className={`form-input${errors.password ? ' error' : ''}`}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
              />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            {errors.general && <p className="form-error" style={{ marginBottom: 12 }}>{errors.general}</p>}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading && (
                <span
                  className="spin"
                  style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="hint-box">
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Demo accounts:</p>
            <p>Admin:   <code>admin@techcorp.com</code> / <code>Admin@123</code></p>
            <p style={{ marginTop: 4 }}>Manager: <code>manager@techcorp.com</code> / <code>Manager@123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
