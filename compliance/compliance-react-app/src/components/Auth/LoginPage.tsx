import React, { useState } from 'react';
import { Icons } from '../shared/Icons';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
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
    
    try {
      const ok = await login(email, password);
      if (!ok) {
        setErrors({ general: 'Invalid credentials. Please check your email and password.' });
      }
      // If successful, user will be redirected automatically by AuthContext
    } catch (error: any) {
      // Handle network errors or other exceptions
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Unable to connect to server. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  const isProcessing = loading || authLoading;

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
                disabled={isProcessing}
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
                disabled={isProcessing}
              />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            {errors.general && <p className="form-error" style={{ marginBottom: 12 }}>{errors.general}</p>}

            <button className="btn btn-primary" type="submit" disabled={isProcessing}>
              {isProcessing && (
                <span
                  className="spin"
                  style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                />
              )}
              {isProcessing ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="hint-box">
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Demo accounts (click to fill):</p>
            {[
              { role: 'Admin',   email: 'admin@techcorp.com',   pwd: 'Admin@123' },
              { role: 'Manager', email: 'manager@techcorp.com', pwd: 'Manager@123' },
            ].map(({ role, email: e, pwd }) => (
              <p
                key={role}
                style={{ marginTop: 4, cursor: 'pointer', borderRadius: 4, padding: '2px 4px', transition: 'background 0.15s' }}
                onMouseEnter={(ev) => (ev.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
                onMouseLeave={(ev) => (ev.currentTarget.style.background = 'transparent')}
                onClick={() => { setEmail(e); setPassword(pwd); setErrors({}); }}
                title={`Click to fill ${role} credentials`}
              >
                {role}: <code>{e}</code> / <code>{pwd}</code>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
