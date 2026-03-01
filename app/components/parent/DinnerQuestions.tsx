'use client';

import { useState } from 'react';

export interface DinnerQuestion {
  id: string;
  question: string;
  theme: string;
  status?: 'pending' | 'completed';
  completed_at?: string | null;
}

interface Props {
  questions: DinnerQuestion[];
  loading?: boolean;
  onMarkComplete?: (id: string) => Promise<void>;
  onGenerate?: () => Promise<void>;
  generating?: boolean;
}

export function DinnerQuestions({
  questions,
  loading,
  onMarkComplete,
  onGenerate,
  generating,
}: Props) {
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [markingId, setMarkingId] = useState<string | null>(null);

  const pending = questions.filter((q) => q.status !== 'completed');
  const completed = questions.filter((q) => q.status === 'completed');

  const handleToggle = async (id: string) => {
    if (!onMarkComplete || markingId) return;
    const q = questions.find((x) => x.id === id);
    if (q?.status === 'completed') return;
    setMarkingId(id);
    try {
      await onMarkComplete(id);
    } finally {
      setMarkingId(null);
    }
  };

  const list = tab === 'pending' ? pending : completed;

  return (
    <section>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
        Dinner Questions
      </h2>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px' }}>
        Engage with your kid
      </p>

      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <button
          type="button"
          onClick={() => setTab('pending')}
          style={{
            padding: '8px 14px',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            borderBottom: tab === 'pending' ? '2px solid #0f766e' : '2px solid transparent',
            background: 'none',
            color: tab === 'pending' ? '#0f766e' : '#6b7280',
            cursor: 'pointer',
            marginBottom: -1,
          }}
        >
          Pending ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('completed')}
          style={{
            padding: '8px 14px',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            borderBottom: tab === 'completed' ? '2px solid #0f766e' : '2px solid transparent',
            background: 'none',
            color: tab === 'completed' ? '#0f766e' : '#6b7280',
            cursor: 'pointer',
            marginBottom: -1,
          }}
        >
          Completed ({completed.length})
        </button>
      </div>

      {loading && (
        <p style={{ color: '#6b7280', fontSize: 14 }}>Loading…</p>
      )}

      {!loading && list.length === 0 && tab === 'pending' && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 12px' }}>
            No pending questions. Generate some to use at dinner.
          </p>
          {onGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={generating}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#0f766e',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: generating ? 'wait' : 'pointer',
              }}
            >
              {generating ? 'Generating…' : 'Generate questions'}
            </button>
          )}
        </div>
      )}

      {!loading && list.length === 0 && tab === 'completed' && (
        <p style={{ color: '#6b7280', fontSize: 14 }}>No completed questions yet.</p>
      )}

      {!loading && list.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((q) => {
            const done = q.status === 'completed';
            const isMarking = markingId === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => (done ? undefined : handleToggle(q.id))}
                disabled={done ? undefined : isMarking}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  background: done ? '#f0fdf4' : '#fff',
                  border: `1.5px solid ${done ? '#86efac' : '#e5e7eb'}`,
                  borderRadius: 14,
                  padding: '14px 16px',
                  cursor: done ? 'default' : isMarking ? 'wait' : 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: `2px solid ${done ? '#22c55e' : '#d1d5db'}`,
                    background: done ? '#22c55e' : 'transparent',
                    flexShrink: 0,
                    marginTop: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {done && <span style={{ color: '#fff', fontSize: 12, lineHeight: 1 }}>✓</span>}
                  {!done && isMarking && (
                    <span style={{ color: '#6b7280', fontSize: 10 }}>…</span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    color: done ? '#6b7280' : '#374151',
                    textDecoration: done ? 'line-through' : 'none',
                    lineHeight: 1.5,
                  }}
                >
                  {q.question}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
