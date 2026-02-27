import { PhoneOff } from 'lucide-react';

interface Props {
  onEnd: () => void;
}

export default function EndButton({ onEnd }: Props) {
  return (
    <button
      onClick={onEnd}
      aria-label="End conversation"
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dc2626, #ef4444)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(239,68,68,0.55)',
        transition: 'transform 0.1s',
        flexShrink: 0,
      }}
    >
      <PhoneOff size={34} strokeWidth={2.5} />
    </button>
  );
}
