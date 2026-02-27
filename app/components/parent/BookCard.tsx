'use client';

import { useState } from 'react';

export interface Book {
  id: string;
  title: string;
  author: string;
  shortDescription: string;
  coverEmoji: string;
  ageRange: string;
  recommendedFor: string[];
  whyRecommended: string;
  fullDescription: string;
}

interface Props {
  book: Book;
}

export function BookCard({ book }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: '20px',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          transition: 'box-shadow 0.15s',
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.boxShadow = 'none')
        }
      >
        <div style={{ display: 'flex', gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 68,
              background: '#f3f4f6',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            {book.coverEmoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
              {book.title}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              {book.author} · Ages {book.ageRange}
            </div>
            <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.4 }}>
              {book.shortDescription}
            </p>
          </div>
        </div>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 28,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 64,
                  height: 84,
                  background: '#f3f4f6',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  flexShrink: 0,
                }}
              >
                {book.coverEmoji}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  {book.title}
                </h3>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6b7280' }}>
                  {book.author} · Ages {book.ageRange}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#3b82f6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}
              >
                Why we recommend this
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
                {book.whyRecommended}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}
              >
                About the book
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
                {book.fullDescription}
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{
                width: '100%',
                padding: '10px 0',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
