interface Props {
  onEnd: () => void;
}

export default function EndButton({ onEnd }: Props) {
  return (
    <button
      onClick={onEnd}
      aria-label="End conversation"
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        fontSize: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        color: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        transition: 'background-color 0.2s',
      }}
    >
      ✕
    </button>
  );
}
