'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminPageHeader } from '@/app/components/admin/AdminPageHeader';

interface SatisfactionStats {
  total: number;
  happy: number;
  neutral: number;
  sad: number;
  noRating: number;
  recent: Array<{
    id: string;
    childId: string;
    rating: 'happy' | 'neutral' | 'sad' | null;
    dismissedAt: string;
    source: string;
  }>;
}

const RATING_LABELS: Record<string, string> = {
  happy: '😊 Happy',
  neutral: '😐 Neutral',
  sad: '😢 Sad',
  null: '— No rating',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminSatisfactionPage() {
  const [stats, setStats] = useState<SatisfactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/satisfaction', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? 'Forbidden' : 'Failed to load');
        return res.json();
      })
      .then((data) => {
        if (data.error && !data.total && data.total !== 0) {
          setError(data.error);
          setStats(null);
        } else {
          setError(data.error ?? null);
          setStats({
            total: data.total ?? 0,
            happy: data.happy ?? 0,
            neutral: data.neutral ?? 0,
            sad: data.sad ?? 0,
            noRating: data.noRating ?? 0,
            recent: Array.isArray(data.recent) ? data.recent : [],
          });
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const backLink = (
    <Link href="/admin" style={{ fontSize: 13, color: 'var(--pd-accent)', textDecoration: 'none' }}>
      ← Admin
    </Link>
  );

  const rated = (stats?.happy ?? 0) + (stats?.neutral ?? 0) + (stats?.sad ?? 0);
  const satisfactionPct = stats && stats.total > 0
    ? Math.round((rated > 0 ? (stats.happy / rated) * 100 : 0))
    : 0;

  return (
    <>
      <AdminPageHeader title="Call satisfaction" parentHref="/admin" right={backLink} />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 60px' }}>
        {error && (
          <div
            style={{
              padding: 16,
              marginBottom: 20,
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 12,
              color: 'var(--pd-error)',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div style={{ padding: 32, color: 'var(--pd-text-tertiary)', fontSize: 14 }}>
            Loading…
          </div>
        )}

        {!loading && stats && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 28,
              }}
            >
              <div
                className="pd-card-elevated"
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--pd-card-border)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--pd-text-tertiary)', marginBottom: 4 }}>
                  Total
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--pd-text-primary)' }}>
                  {stats.total}
                </div>
              </div>
              <div
                className="pd-card-elevated"
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--pd-card-border)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--pd-text-tertiary)', marginBottom: 4 }}>
                  😊 Happy
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{stats.happy}</div>
              </div>
              <div
                className="pd-card-elevated"
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--pd-card-border)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--pd-text-tertiary)', marginBottom: 4 }}>
                  😐 Neutral
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--pd-text-secondary)' }}>
                  {stats.neutral}
                </div>
              </div>
              <div
                className="pd-card-elevated"
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--pd-card-border)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--pd-text-tertiary)', marginBottom: 4 }}>
                  😢 Sad
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>{stats.sad}</div>
              </div>
              <div
                className="pd-card-elevated"
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--pd-card-border)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--pd-text-tertiary)', marginBottom: 4 }}>
                  No rating
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--pd-text-tertiary)' }}>
                  {stats.noRating}
                </div>
              </div>
              <div
                className="pd-card-elevated"
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--pd-card-border)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--pd-text-tertiary)', marginBottom: 4 }}>
                  Happy %
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--pd-accent)' }}>
                  {rated > 0 ? `${satisfactionPct}%` : '—'}
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--pd-text-primary)', marginBottom: 12 }}>
              Recent feedback
            </h2>
            <div className="pd-card-elevated" style={{ overflow: 'hidden', border: '1px solid var(--pd-card-border)', borderRadius: 16 }}>
              {stats.recent.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--pd-text-tertiary)', fontSize: 14 }}>
                  No feedback yet
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--pd-card-border)' }}>
                        {['Child ID', 'Rating', 'Dismissed', 'Source'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '10px 16px',
                              textAlign: 'left',
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              color: 'var(--pd-text-tertiary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent.map((row, i) => (
                        <tr
                          key={row.id}
                          style={{
                            borderBottom: i < stats.recent.length - 1 ? '1px solid var(--pd-card-border)' : 'none',
                          }}
                        >
                          <td
                            style={{
                              padding: '12px 16px',
                              fontSize: 13,
                              fontFamily: 'ui-monospace, monospace',
                              color: 'var(--pd-text-secondary)',
                              maxWidth: 180,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row.childId}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--pd-text-primary)' }}>
                            {RATING_LABELS[String(row.rating)] ?? row.rating ?? '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              fontSize: 12,
                              color: 'var(--pd-text-tertiary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatDate(row.dismissedAt)}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--pd-text-tertiary)' }}>
                            {row.source}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
