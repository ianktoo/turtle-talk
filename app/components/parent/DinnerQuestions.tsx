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
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--pd-text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
        Dinner Questions
      </h2>
      <p style={{ fontSize: 15, color: 'var(--pd-text-secondary)', margin: '0 0 16px' }}>
        Engage with your kid
      </p>

      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
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
            borderBottom: tab === 'pending' ? '2px solid var(--pd-accent)' : '2px solid transparent',
            background: 'none',
            color: tab === 'pending' ? 'var(--pd-accent)' : 'var(--pd-text-tertiary)',
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
            borderBottom: tab === 'completed' ? '2px solid var(--pd-accent)' : '2px solid transparent',
            background: 'none',
            color: tab === 'completed' ? 'var(--pd-accent)' : 'var(--pd-text-tertiary)',
            cursor: 'pointer',
            marginBottom: -1,
          }}
        >
          Completed ({completed.length})
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[80, 65, 72].map((w, i) => (
            <div key={i} className="pd-skeleton" style={{ height: 52, width: `${w}%`, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {!loading && list.length === 0 && tab === 'pending' && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: 'var(--pd-text-secondary)', fontSize: 15, margin: '0 0 12px' }}>
            No pending questions. Generate some to use at dinner.
          </p>
          {onGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={generating}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--pd-accent)',
                color: 'white',
                fontSize: 15,
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
        <p style={{ color: 'var(--pd-text-tertiary)', fontSize: 15 }}>No completed questions yet.</p>
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
                  background: done ? 'var(--pd-success-soft)' : 'var(--pd-surface-soft)',
                  border: `1px solid ${done ? 'var(--pd-success-border)' : 'var(--pd-card-border)'}`,
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
                    border: `2px solid ${done ? 'var(--pd-success)' : 'var(--pd-card-border)'}`,
                    background: done ? 'var(--pd-success)' : 'transparent',
                    flexShrink: 0,
                    marginTop: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {done && <span style={{ color: 'white', fontSize: 12, lineHeight: 1 }}>✓</span>}
                  {!done && isMarking && (
                    <span style={{ color: 'var(--pd-text-tertiary)', fontSize: 10 }}>…</span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 15,
                    color: done ? 'var(--pd-text-tertiary)' : 'var(--pd-text-primary)',
                    textDecoration: done ? 'line-through' : 'none',
                    lineHeight: 1.5,
                  }}
                >
                  {q.question}
                </span>
                {q.theme && (
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--pd-accent)',
                      background: 'var(--pd-accent-soft)',
                      border: '1px solid var(--pd-accent)',
                      borderRadius: 4,
                      padding: '1px 5px',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.03em',
                      flexShrink: 0,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {q.theme}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
