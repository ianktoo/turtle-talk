'use client';

interface MicPermissionV2Props {
  onGranted: () => void;
  onDenied: () => void;
}

export default function MicPermissionV2({ onGranted, onDenied }: MicPermissionV2Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        background: 'var(--v2-bg)',
        padding: 24,
      }}
    >
      <div
        style={{
          background: 'var(--v2-glass)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid var(--v2-glass-border)',
          borderRadius: 'var(--v2-radius-card)',
          padding: '40px 32px',
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--v2-shadow-menu)',
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            margin: '0 auto 24px',
            borderRadius: '50%',
            background: 'var(--v2-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
            lineHeight: 1,
          }}
          aria-hidden
        >
          🐢
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--v2-text-primary)',
            lineHeight: 1.3,
            textShadow: '0 1px 1px rgba(255,255,255,0.5)',
          }}
        >
          Hi! I need to hear you!
        </h2>
        <p
          style={{
            margin: '12px 0 0 0',
            fontSize: '1rem',
            fontWeight: 500,
            color: 'var(--v2-text-secondary)',
            lineHeight: 1.5,
          }}
        >
          Can I use your microphone?
        </p>

        <button
          type="button"
          onClick={onGranted}
          style={{
            marginTop: 28,
            width: '100%',
            padding: '16px 24px',
            fontSize: '1.125rem',
            fontWeight: 700,
            backgroundColor: 'var(--v2-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--v2-radius-card)',
            cursor: 'pointer',
            boxShadow: 'var(--v2-shadow-card)',
            transition: 'transform var(--v2-transition-fast)',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Allow Microphone
        </button>

        <button
          type="button"
          onClick={onDenied}
          style={{
            marginTop: 16,
            background: 'none',
            border: 'none',
            color: 'var(--v2-text-muted)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
