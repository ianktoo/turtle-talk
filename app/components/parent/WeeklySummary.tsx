'use client';

export interface SummaryArea {
  id: string;
  label: string;
  description: string;
  score: number;
  maxScore: number;
  icon: string;
  highlights: string[];
}

export interface WeeklySummaryData {
  childId: string;
  weekOf: string;
  areas: SummaryArea[];
}

interface Props {
  data: WeeklySummaryData;
}

function ScoreDots({ score, max }: { score: number; max: number }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i < score ? '#3b82f6' : '#e5e7eb',
          }}
        />
      ))}
    </div>
  );
}

export function WeeklySummary({ data }: Props) {
  return (
    <section>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
        Weekly Summary
      </h2>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px' }}>
        This week your explorer practised:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {data.areas.map((area) => (
          <div
            key={area.id}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>{area.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{area.label}</div>
                <ScoreDots score={area.score} max={area.maxScore} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px', lineHeight: 1.4 }}>
              {area.description}
            </p>
            {area.highlights.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {area.highlights.map((h, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 2 }}>
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
