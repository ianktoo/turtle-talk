'use client';

import { useState } from 'react';

export interface DinnerQuestion {
  id: string;
  question: string;
  theme: string;
}

interface Props {
  questions: DinnerQuestion[];
}

export function DinnerQuestions({ questions }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <section>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
        Dinner Questions
      </h2>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px' }}>
        Engage with your kid
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {questions.map((q) => {
          const done = checked.has(q.id);
          return (
            <button
              key={q.id}
              onClick={() => toggle(q.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                background: done ? '#f0fdf4' : '#fff',
                border: `1.5px solid ${done ? '#86efac' : '#e5e7eb'}`,
                borderRadius: 14,
                padding: '14px 16px',
                cursor: 'pointer',
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
    </section>
  );
}
