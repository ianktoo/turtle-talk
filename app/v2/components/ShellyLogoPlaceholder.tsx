'use client';

export default function ShellyLogoPlaceholder() {
  return (
    <div
      style={{
        minHeight: 120,
        width: '100%',
        maxWidth: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
      }}
      aria-hidden
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'var(--v2-primary)',
          opacity: 0.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          lineHeight: 1,
        }}
      >
        🐢
      </div>
    </div>
  );
}
