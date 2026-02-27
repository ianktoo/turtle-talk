'use client';
import { useState, useCallback } from 'react';
import { RotateCcw, Check } from 'lucide-react';

export default function ClearButton({ onClear }: { onClear: () => void }) {
  const [confirmed, setConfirmed] = useState(false);

  const handleClick = useCallback(() => {
    onClear();
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 1500);
  }, [onClear]);

  return (
    <button
      onClick={handleClick}
      aria-label="Start over"
      style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: confirmed ? '#22c55e' : 'rgba(255,255,255,0.18)',
        color: 'white',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(4px)',
        transition: 'background-color 0.3s',
        flexShrink: 0,
      }}
    >
      {confirmed ? <Check size={28} strokeWidth={2.5} /> : <RotateCcw size={28} strokeWidth={2.5} />}
    </button>
  );
}
