import React from 'react';

interface Props {
  countdown:    number;
  onStay:       () => void;
  onLogout:     () => void;
}

export function SessionWarningModal({ countdown, onStay, onLogout }: Props) {
  // Colour the ring based on urgency
  const pct       = countdown / 60;
  const ringColor = pct > 0.5 ? '#F59E0B' : pct > 0.25 ? '#EF4444' : '#7C2D12';
  const radius    = 36;
  const circ      = 2 * Math.PI * radius;
  const dash      = circ * pct;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.6)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 20,
        padding: '36px 32px',
        width: 420,
        maxWidth: '95vw',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        border: '1px solid var(--border)',
        textAlign: 'center',
        animation: 'slideIn 0.25s ease',
      }}>

        {/* Countdown ring */}
        <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 24px' }}>
          <svg width={96} height={96} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={48} cy={48} r={radius} fill="none" stroke="var(--border2)" strokeWidth={6} />
            {/* Progress */}
            <circle
              cx={48} cy={48} r={radius} fill="none"
              stroke={ringColor} strokeWidth={6}
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.5s ease' }}
            />
          </svg>
          {/* Number inside ring */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: ringColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {countdown}
          </div>
        </div>

        {/* Icon + heading */}
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          Session Expiring Soon
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 28 }}>
          You've been inactive for a while.<br />
          You'll be logged out automatically in{' '}
          <strong style={{ color: ringColor }}>{countdown} second{countdown !== 1 ? 's' : ''}</strong>{' '}
          unless you choose to stay.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onLogout}
            style={{
              padding: '9px 20px', borderRadius: 8,
              border: '1.5px solid var(--border2)',
              background: 'var(--surface)',
              color: 'var(--text2)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Log Out Now
          </button>
          <button
            onClick={onStay}
            style={{
              padding: '9px 24px', borderRadius: 8,
              border: 'none',
              background: '#1D4ED8',
              color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(29,78,216,0.35)',
            }}
          >
            Stay Logged In
          </button>
        </div>

      </div>
    </div>
  );
}
