'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, Users, UserPlus, LogOut } from 'lucide-react';
import type { Child } from './ChildSwitcher';
import { ChildSwitcher } from './ChildSwitcher';
import { ChildrenModal } from './ChildrenModal';

export interface ParentMe {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
}

interface ParentHeaderProps {
  children: Child[];
  activeChild: Child | null;
  onSelectChild: (child: Child) => void;
  onChildrenChange: () => void;
  childrenModalOpen: boolean;
  onOpenChildrenModal: () => void;
  onCloseChildrenModal: () => void;
}

export function ParentHeader({
  children,
  activeChild,
  onSelectChild,
  onChildrenChange,
  childrenModalOpen,
  onOpenChildrenModal,
  onCloseChildrenModal,
}: ParentHeaderProps) {
  const router = useRouter();
  const [me, setMe] = useState<ParentMe | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [coparentModalOpen, setCoparentModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/parent/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMe(data));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogOff() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push('/');
    router.refresh();
  }

  const label = me?.displayName || me?.email || me?.phone || 'Parent';
  const initial = (label === 'Parent' ? 'P' : label[0]).toUpperCase();

  return (
    <>
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 20px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
            Parent Dashboard
          </span>
          {activeChild && children.length > 0 && (
            <ChildSwitcher
              children={children}
              activeChild={activeChild}
              onSelect={onSelectChild}
            />
          )}
        </div>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 24,
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: '#374151',
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#0f766e',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {initial}
            </span>
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {label}
            </span>
            <ChevronDown size={16} style={{ flexShrink: 0, opacity: dropdownOpen ? 1 : 0.7 }} />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                minWidth: 220,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                padding: '8px 0',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#6b7280',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {me?.email || me?.phone || 'Signed in'}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenChildrenModal();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#111827',
                  textAlign: 'left',
                }}
              >
                <Users size={18} />
                Children
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  setCoparentModalOpen(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#111827',
                  textAlign: 'left',
                }}
              >
                <UserPlus size={18} />
                Co-parent
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogOff}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#dc2626',
                  textAlign: 'left',
                }}
              >
                <LogOut size={18} />
                Log off
              </button>
            </div>
          )}
        </div>
      </header>

      <ChildrenModal
        open={childrenModalOpen}
        onClose={onCloseChildrenModal}
        children={children}
        activeChild={activeChild}
        onSelectChild={onSelectChild}
        onChildrenChange={onChildrenChange}
      />

      {coparentModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setCoparentModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              maxWidth: 360,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Co-parent</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>
              Invite another parent to access the same children. Coming soon.
            </p>
            <button
              type="button"
              onClick={() => setCoparentModalOpen(false)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#0f766e',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
