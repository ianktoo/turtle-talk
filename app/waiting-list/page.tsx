'use client';

import { useState } from 'react';

export default function WaitingListPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      setSuccess(data.message || "You're on the list!");
      setEmail('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(180deg, #0f766e 0%, #134e4a 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 20,
          padding: 32,
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 24,
            fontWeight: 700,
            color: 'white',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          Join the waitlist
        </h1>
        <p
          style={{
            margin: '0 0 24px',
            fontSize: 14,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          Be the first to know when TurtleTalk is ready for your family.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: 16,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 20px',
              borderRadius: 12,
              border: 'none',
              background: 'white',
              color: '#134e4a',
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Joining…' : 'Join the list'}
          </button>
        </form>

        {error && (
          <p style={{ margin: '16px 0 0', color: '#fecaca', fontSize: 14 }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ margin: '16px 0 0', color: 'rgba(255,255,255,0.95)', fontSize: 14 }}>
            {success}
          </p>
        )}
      </div>
    </main>
  );
}
