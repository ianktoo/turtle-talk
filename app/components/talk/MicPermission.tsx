import TurtleCharacter from './TurtleCharacter';

interface Props {
  onGranted: () => void;
  onDenied: () => void;
}

export default function MicPermission({ onGranted, onDenied }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          borderRadius: 24,
          padding: '40px 32px',
          maxWidth: 360,
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <TurtleCharacter mood="happy" size={140} />

        <h2
          style={{
            marginTop: 24,
            fontSize: 22,
            fontWeight: 700,
            color: '#1a3a2a',
            lineHeight: 1.3,
          }}
        >
          Hi! I need to hear you!
        </h2>
        <p
          style={{
            marginTop: 12,
            fontSize: 16,
            color: '#3a5a4a',
            lineHeight: 1.5,
          }}
        >
          Can I use your microphone?
        </p>

        <button
          onClick={onGranted}
          style={{
            marginTop: 28,
            width: '100%',
            padding: '16px 24px',
            fontSize: 18,
            fontWeight: 700,
            backgroundColor: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: 16,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(34,197,94,0.35)',
            transition: 'transform 0.1s',
          }}
        >
          Allow Microphone 🎤
        </button>

        <button
          onClick={onDenied}
          style={{
            marginTop: 16,
            background: 'none',
            border: 'none',
            color: '#6b8a7a',
            fontSize: 14,
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
