'use client';

import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  return (
    <main
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 20px 120px',
      }}
    >
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 500, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '8px 16px',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} /> Back
          </button>
        </Link>
        <h1
          style={{
            color: 'white',
            fontSize: '1.6rem',
            fontWeight: 900,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            margin: 0,
          }}
        >
          Messages 💬
        </h1>
      </div>

      {/* Empty state */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          marginTop: 60,
        }}
      >
        <MessageCircle size={64} color="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        <p
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: '1.05rem',
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: 300,
          }}
        >
          Messages from your grown-up will appear here soon! 🐢
        </p>
      </div>
    </main>
  );
}
