'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

interface Props {
  count?: number;
}

export default function MessagesButton({ count = 0 }: Props) {
  const hasNew = count > 0;

  return (
    <Link href="/messages" style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 22px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          transition: 'background 0.15s',
          userSelect: 'none',
        }}
      >
        {/* Icon with optional notification dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <MessageCircle size={22} color="rgba(255,255,255,0.75)" strokeWidth={1.75} />
          {hasNew && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#ef4444',
                border: '2px solid rgba(8,22,48,0.9)',
              }}
            />
          )}
        </div>

        {/* Label + count */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            Messages
          </span>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: hasNew ? '#fcd34d' : 'rgba(255,255,255,0.45)',
              background: hasNew ? 'rgba(255,255,255,0.12)' : 'transparent',
              padding: hasNew ? '1px 7px' : '0',
              borderRadius: 999,
            }}
          >
            {count === 0 ? 'none yet' : count}
          </span>
        </span>
      </div>
    </Link>
  );
}
