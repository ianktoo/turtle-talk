'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import MenuButton from '@/app/v2/components/MenuButton';
import { useChildSession } from '@/app/hooks/useChildSession';
import { useWishRounds, type WishRoundOption } from '@/app/hooks/useWishRounds';

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(4px)',
};

const modalDialogStyle: React.CSSProperties = {
  position: 'fixed',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 101,
  width: 'calc(100% - 32px)',
  maxWidth: 360,
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--v2-surface)',
  borderRadius: 'var(--v2-radius-card)',
  boxShadow: 'var(--v2-shadow-menu)',
  overflow: 'hidden',
};

function ModalHeader({ title, onClose, id }: { title: string; onClose: () => void; id?: string }) {
  return (
    <div
      style={{
        padding: '20px 20px 12px',
        borderBottom: '1px solid var(--v2-glass-border)',
        position: 'relative',
      }}
    >
      <h2
        id={id ?? 'wish-list-modal-title'}
        style={{
          margin: 0,
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--v2-text-primary)',
          textAlign: 'center',
          paddingRight: 36,
        }}
      >
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          color: 'var(--v2-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--v2-glass)';
          e.currentTarget.style.color = 'var(--v2-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--v2-text-muted)';
        }}
      >
        <X size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function runConfetti() {
  const count = 80;
  const defaults = { origin: { y: 0.6 }, zIndex: 200 };
  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92 });
  fire(0.15, { spread: 120, startVelocity: 45 });
}

export default function V2WishListPage() {
  const { child } = useChildSession();
  const { rounds, activeRoundOptions, isLoading, refetch } = useWishRounds();

  const [whichModal, setWhichModal] = useState<'pick' | 'success' | null>(null);
  const [pickOptions, setPickOptions] = useState<WishRoundOption[]>([]);
  const [pickRoundId, setPickRoundId] = useState<string | null>(null);
  const [wishSelectIds, setWishSelectIds] = useState<Set<string>>(new Set());
  const [generateLoading, setGenerateLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const hasAutoOpenedSuccessRef = useRef(false);

  const isGuest = !child;
  const currentApproved = rounds[0]?.status === 'parent_honored' ? rounds[0].honoredOption : null;
  const previousCompleted = rounds.filter((r) => r.status === 'parent_honored').slice(1);
  const activeRound = rounds.find((r) => r.status === 'generating' || r.status === 'child_picking');
  const showGenerateCTA =
    !isGuest && !activeRound && (rounds.length === 0 || rounds[0]?.status === 'parent_honored');

  const openPickModal = useCallback(async () => {
    if (activeRound?.status === 'child_picking' && activeRoundOptions && activeRoundOptions.length === 5) {
      setPickRoundId(activeRound.id);
      setPickOptions(activeRoundOptions);
      setWishSelectIds(new Set());
      setWhichModal('pick');
      return;
    }
    if (activeRound?.status === 'generating' || !activeRound) {
      setWhichModal('pick');
      setPickOptions([]);
      setPickRoundId(activeRound?.id ?? null);
      setWishSelectIds(new Set());
      setGenerateLoading(true);
      try {
        let roundId = activeRound?.id;
        if (!roundId) {
          const createRes = await fetch('/api/wishes/rounds', {
            method: 'POST',
            credentials: 'include',
          });
          const createData = await createRes.json();
          if (!createRes.ok) throw new Error(createData.error ?? 'Failed to create round');
          roundId = createData.roundId;
        }
        if (!roundId) throw new Error('No round id');
        const genRes = await fetch('/api/wishes/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ roundId }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error ?? 'Failed to generate wishes');
        setPickRoundId(roundId);
        setPickOptions(genData.options ?? []);
        refetch();
      } catch (e) {
        console.error('[wish-list] openPickModal', e);
        setWhichModal(null);
      } finally {
        setGenerateLoading(false);
      }
    }
  }, [activeRound, activeRoundOptions]);

  useEffect(() => {
    if (whichModal === 'pick' && pickRoundId && pickOptions.length === 0 && !generateLoading && activeRound?.id === pickRoundId && activeRound?.status === 'child_picking' && activeRoundOptions?.length === 5) {
      setPickOptions(activeRoundOptions);
    }
  }, [whichModal, pickRoundId, pickOptions.length, generateLoading, activeRound, activeRoundOptions]);

  const handleWishToggle = useCallback((optionId: string) => {
    setWishSelectIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else if (next.size < 3) next.add(optionId);
      return next;
    });
  }, []);

  const handleWishSubmit = useCallback(async () => {
    if (wishSelectIds.size !== 3 || !pickRoundId || submitLoading) return;
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/wishes/rounds/${pickRoundId}/select`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ optionIds: Array.from(wishSelectIds) }),
      });
      if (res.ok) {
        setWhichModal(null);
        setPickRoundId(null);
        setPickOptions([]);
        setWishSelectIds(new Set());
        refetch();
      }
    } finally {
      setSubmitLoading(false);
    }
  }, [wishSelectIds, pickRoundId, submitLoading, refetch]);

  const handleRegenerate = useCallback(async () => {
    if (!pickRoundId || generateLoading) return;
    setGenerateLoading(true);
    try {
      const res = await fetch('/api/wishes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roundId: pickRoundId }),
      });
      const data = await res.json();
      if (res.ok && data.options) {
        setPickOptions(data.options);
        setWishSelectIds(new Set());
      }
    } finally {
      setGenerateLoading(false);
    }
  }, [pickRoundId, generateLoading]);

  useEffect(() => {
    if (whichModal === 'success') {
      runConfetti();
    }
  }, [whichModal]);

  useEffect(() => {
    if (
      !isGuest &&
      !isLoading &&
      currentApproved &&
      !hasAutoOpenedSuccessRef.current
    ) {
      hasAutoOpenedSuccessRef.current = true;
      setWhichModal('success');
    }
  }, [isGuest, isLoading, currentApproved]);

  const openSuccessModal = useCallback(() => {
    setWhichModal('success');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWhichModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <MenuButton />

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'max(24px, env(safe-area-inset-top)) 24px max(120px, calc(24px + env(safe-area-inset-bottom)))',
          maxWidth: 500,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            width: '100%',
            flex: 1,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--v2-text-primary)',
              textAlign: 'center',
            }}
          >
            My Wish List
          </h1>

          {isGuest && (
            <p style={{ color: 'var(--v2-text-muted)', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>
              Log in to see your wish list
            </p>
          )}

          {!isGuest && isLoading ? (
            <p style={{ color: 'var(--v2-text-muted)', fontSize: '0.95rem' }}>Loading…</p>
          ) : !isGuest && (
            <>
              {currentApproved && (
                <div
                  style={{
                    width: '100%',
                    padding: '20px',
                    borderRadius: 'var(--v2-radius-card)',
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: '2px solid var(--v2-mission-easy)',
                    boxShadow: 'var(--v2-shadow-card)',
                  }}
                >
                  <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--v2-text-secondary)', fontWeight: 600 }}>
                    Your wish
                  </p>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--v2-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={20} style={{ color: 'var(--v2-mission-easy)', flexShrink: 0 }} aria-hidden />
                    {currentApproved.label}
                  </p>
                  <button
                    type="button"
                    onClick={openSuccessModal}
                    style={{
                      marginTop: 12,
                      padding: '8px 16px',
                      borderRadius: 'var(--v2-radius-pill)',
                      border: '1px solid var(--v2-glass-border)',
                      background: 'var(--v2-glass)',
                      color: 'var(--v2-text-secondary)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Celebrate again
                  </button>
                </div>
              )}

              {previousCompleted.length > 0 && (
                <div style={{ width: '100%' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--v2-text-secondary)', fontWeight: 600 }}>
                    Previous wishes
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {previousCompleted.map((r) => (
                      <li key={r.id} style={{ color: 'var(--v2-text-primary)', fontSize: '0.95rem' }}>
                        {r.honoredOption?.label ?? '—'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showGenerateCTA && (
                <div
                  style={{
                    width: '100%',
                    padding: '24px 20px',
                    borderRadius: 'var(--v2-radius-card)',
                    background: 'var(--v2-glass)',
                    border: '1px solid var(--v2-glass-border)',
                    boxShadow: 'var(--v2-shadow-card)',
                  }}
                >
                  <p
                    style={{
                      color: 'var(--v2-text-secondary)',
                      fontSize: '1rem',
                      textAlign: 'center',
                      lineHeight: 1.6,
                      margin: '0 0 16px',
                    }}
                  >
                    {rounds.length === 0
                      ? 'Generate 5 wishes and pick your top 3. Your grown-up will choose one to make come true!'
                      : 'Generate more wishes and pick 3. Your grown-up will pick one to make come true!'}
                  </p>
                  <button
                    type="button"
                    onClick={openPickModal}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      borderRadius: 'var(--v2-radius-pill)',
                      border: 'none',
                      background: 'var(--v2-primary)',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Generate wishes
                  </button>
                </div>
              )}

              {activeRound?.status === 'child_picking' && activeRoundOptions?.length === 5 && !showGenerateCTA && (
                <button
                  type="button"
                  onClick={openPickModal}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 'var(--v2-radius-pill)',
                    border: 'none',
                    background: 'var(--v2-primary)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Pick 3 wishes
                </button>
              )}

              {activeRound?.status === 'child_picked' && (
                <p style={{ color: 'var(--v2-text-secondary)', fontSize: '0.95rem', margin: 0, textAlign: 'center' }}>
                  Your grown-up will pick one to make come true!
                </p>
              )}

              <Link
                href="/garden"
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  padding: '12px 24px',
                  borderRadius: 'var(--v2-radius-pill)',
                  background: 'var(--v2-glass)',
                  border: '1px solid var(--v2-glass-border)',
                  color: 'var(--v2-text-primary)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: 'var(--v2-shadow-card)',
                  transition: 'background var(--v2-transition-fast), border-color var(--v2-transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 207, 185, 0.12)';
                  e.currentTarget.style.borderColor = 'var(--v2-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--v2-glass)';
                  e.currentTarget.style.borderColor = 'var(--v2-glass-border)';
                }}
              >
                Back to my tree
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Pick 3 modal */}
      {whichModal === 'pick' && (
        <>
          <div role="presentation" style={modalBackdropStyle} onClick={() => setWhichModal(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wish-list-success-title"
            style={modalDialogStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader title="Pick 3 wishes" onClose={() => setWhichModal(null)} />
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'var(--v2-text-secondary)' }}>
                Choose the 3 you like best. Your grown-up will pick one to make come true!
              </p>
              {generateLoading && pickOptions.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--v2-text-muted)' }}>Generating wishes…</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pickOptions.map((opt) => {
                      const sel = wishSelectIds.has(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleWishToggle(opt.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            borderRadius: 12,
                            border: sel ? '2px solid var(--v2-primary)' : '1px solid var(--v2-glass-border)',
                            background: sel ? 'rgba(0, 207, 185, 0.12)' : 'var(--v2-surface)',
                            color: 'var(--v2-text-primary)',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ flexShrink: 0 }}>{sel ? '✓' : '○'}</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={wishSelectIds.size !== 3 || submitLoading}
                      onClick={handleWishSubmit}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 'var(--v2-radius-pill)',
                        border: 'none',
                        background: wishSelectIds.size === 3 ? 'var(--v2-primary)' : 'var(--v2-glass)',
                        color: wishSelectIds.size === 3 ? '#fff' : 'var(--v2-text-muted)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: wishSelectIds.size === 3 && !submitLoading ? 'pointer' : 'default',
                      }}
                    >
                      {submitLoading ? 'Sending…' : `Submit ${wishSelectIds.size}/3`}
                    </button>
                    <button
                      type="button"
                      disabled={generateLoading}
                      onClick={handleRegenerate}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 'var(--v2-radius-card)',
                        border: '1px solid var(--v2-glass-border)',
                        background: 'var(--v2-surface)',
                        color: 'var(--v2-text-secondary)',
                        fontSize: '0.9rem',
                        cursor: generateLoading ? 'wait' : 'pointer',
                      }}
                    >
                      Generate again
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Success modal (confetti + CTA) */}
      {whichModal === 'success' && currentApproved && (
        <>
          <div role="presentation" style={modalBackdropStyle} onClick={() => setWhichModal(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wish-list-success-title"
            style={modalDialogStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader id="wish-list-success-title" title="Your wish!" onClose={() => setWhichModal(null)} />
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--v2-text-primary)', textAlign: 'center' }}>
                {currentApproved.label}
              </p>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--v2-text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
                Start a Brave Call with Shelly or interact with your parent for more decorations that can help you unlock more wishes and decorate trees!
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Link
                  href="/talk"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 'var(--v2-radius-pill)',
                    background: 'var(--v2-primary)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    textDecoration: 'none',
                  }}
                >
                  Brave Call with Shelly
                </Link>
                <Link
                  href="/garden"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 'var(--v2-radius-pill)',
                    border: '1px solid var(--v2-glass-border)',
                    background: 'var(--v2-glass)',
                    color: 'var(--v2-text-primary)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textAlign: 'center',
                    textDecoration: 'none',
                  }}
                >
                  My tree
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
