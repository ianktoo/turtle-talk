import { Mic, MicOff } from 'lucide-react';

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
        width: 64,
        height: 64,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isMuted ? '#f59e0b' : 'rgba(255,255,255,0.18)',
        color: 'white',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(4px)',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      {isMuted ? <MicOff size={28} strokeWidth={2.5} /> : <Mic size={28} strokeWidth={2.5} />}
    </button>
  );
}
