'use client';

export default function Logo() {
  const size = 112;

  return (
    <div
      role="img"
      aria-label="TurtleTalk logo"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--v2-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: 'var(--v2-shadow-card)',
        transition: 'opacity var(--v2-transition-fast)',
        opacity: 1,
      }}
    >
      {/* Placeholder: turtle emoji until custom logo is provided */}
      <span
        style={{
          fontSize: 56,
          lineHeight: 1,
        }}
        aria-hidden
      >
        🐢
      </span>
    </div>
  );
}
