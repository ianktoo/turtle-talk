interface Props {
  isMuted: boolean;
  onToggle: () => void;
}

export default function MuteButton({ isMuted, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      aria-pressed={isMuted}
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        fontSize: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isMuted ? '#ef4444' : '#22c55e',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        transition: 'background-color 0.2s',
      }}
    >
      {isMuted ? '🔇' : '🎤'}
    </button>
  );
}
