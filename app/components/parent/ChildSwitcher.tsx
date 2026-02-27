'use client';

import { useState } from 'react';

export interface Child {
  id: string;
  name: string;
  age: number;
  avatar: string;
  completedMissions: number;
}

interface Props {
  children: Child[];
  activeChild: Child;
  onSelect: (child: Child) => void;
}

export function ChildSwitcher({ children, activeChild, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#f3f4f6',
          border: '1px solid #e5e7eb',
          borderRadius: 24,
          padding: '6px 14px 6px 8px',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          color: '#374151',
        }}
      >
        <span style={{ fontSize: 22 }}>{activeChild.avatar}</span>
        <span>{activeChild.name}</span>
        <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 2 }}>▼</span>
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
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: 28,
              width: 320,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Switch child
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>
              Select a child profile to view
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => { onSelect(child); setOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    background: child.id === activeChild.id ? '#eff6ff' : '#f9fafb',
                    border: `1.5px solid ${child.id === activeChild.id ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: 14,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{ fontSize: 32 }}>{child.avatar}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{child.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      Age {child.age} · {child.completedMissions} missions completed
                    </div>
                  </div>
                  {child.id === activeChild.id && (
                    <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: 16 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
