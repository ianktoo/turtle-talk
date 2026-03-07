'use client';

export default function Title() {
  return (
    <h1
      style={{
        margin: 0,
        fontSize: 'clamp(2rem, 8vw, 3rem)',
        fontWeight: 900,
        color: 'var(--v2-text-primary)',
        letterSpacing: '-0.02em',
        textAlign: 'center',
        lineHeight: 1.1,
      }}
    >
      TurtleTalk
    </h1>
  );
}
