'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Package } from 'lucide-react';
import MenuButton from '@/app/v2/components/MenuButton';
import ChristmasTreeSVG from '@/app/appreciation/ChristmasTreeSVG';
import { useChildSession } from '@/app/hooks/useChildSession';
import { useTree } from '@/app/hooks/useTree';
import { useEncouragement } from '@/app/hooks/useEncouragement';
import { useLocalTree } from '@/app/hooks/useLocalTree';
import { useMissions } from '@/app/hooks/useMissions';
import { useGardenState } from '@/app/hooks/useGardenState';
import { useGuestWishes } from '@/app/hooks/useGuestWishes';

type GiftSource = 'parent' | 'mission';
type GardenModal = 'wish' | 'decoration' | 'missions' | 'talk' | 'treeFull';

interface GiftGroup {
  emoji: string;
  items: { id: string; emoji: string }[];
  count: number;
}

function groupByEmoji(items: { id: string; emoji: string }[]): GiftGroup[] {
  const byEmoji = new Map<string, { id: string; emoji: string }[]>();
  for (const item of items) {
    const list = byEmoji.get(item.emoji) ?? [];
    list.push(item);
    byEmoji.set(item.emoji, list);
  }
  return Array.from(byEmoji.entries()).map(([emoji, items]) => ({
    emoji,
    items,
    count: items.length,
  }));
}

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

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        padding: '20px 20px 12px',
        borderBottom: '1px solid var(--v2-glass-border)',
        position: 'relative',
      }}
    >
      <h2
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

export default function V2GardenPage() {
  const router = useRouter();
  const { child } = useChildSession();
  const { tree, isLoading: treeLoading, refetch: refetchTree, placeOnTree } = useTree();
  const { items: encouragementItems, refetch: refetchEncouragement } = useEncouragement();
  const guestChildId = child?.childId ?? 'default';
  const { activeMissions, completedMissions } = useMissions(guestChildId);
  const {
    unplacedDecorations,
    placedDecorations: localPlacedDecorations,
    growthStage: localGrowthStage,
    placeDecoration: placeLocalDecoration,
  } = useLocalTree(guestChildId);

  const gardenState = useGardenState(!!child);
  const {
    missionsCompletedInCycle,
    activeWishRound,
    options: wishOptions,
    isLoading: gardenStateLoading,
    refetch: refetchGardenState,
  } = gardenState;
  const guestWishes = useGuestWishes();

  const [whichModal, setWhichModal] = useState<GardenModal | null>(null);
  const [selected, setSelected] = useState<{ source: GiftSource; id: string } | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [wishSelectIds, setWishSelectIds] = useState<Set<string>>(new Set());
  const [wishSubmitLoading, setWishSubmitLoading] = useState(false);
  const [wishGenerateLoading, setWishGenerateLoading] = useState(false);

  const isGuest = !child;

  const parentGroups = useMemo(() => groupByEmoji(encouragementItems), [encouragementItems]);
  const missionGroups = useMemo(() => groupByEmoji(unplacedDecorations), [unplacedDecorations]);

  const isWishPicking =
    (!!child && activeWishRound?.status === 'child_picking') || (isGuest && !guestWishes.completed);
  const isWishGenerating = !!child && activeWishRound?.status === 'generating';

  const serverPlacedDecorations = tree?.placed_decorations ?? [];
  const serverGrowthStage = tree?.growth_stage ?? 0;
  const placedDecorations = isGuest ? localPlacedDecorations : serverPlacedDecorations;
  const placedCount = placedDecorations.length;
  const growthStage = isGuest ? localGrowthStage : serverGrowthStage;
  const showStar = growthStage >= 1 || !!gardenState.lastGrowthAt;

  const hasDecorationsToPlace = parentGroups.length > 0 || missionGroups.length > 0;
  const hasAnyDecorations = placedCount > 0 || hasDecorationsToPlace;
  const noMissionsAtAll = completedMissions.length === 0 && activeMissions.length === 0;

  useEffect(() => {
    if (isWishGenerating && activeWishRound?.id) {
      setWishGenerateLoading(true);
      fetch('/api/wishes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roundId: activeWishRound.id }),
      })
        .then((res) => (res.ok ? refetchGardenState() : Promise.reject()))
        .catch(() => {})
        .finally(() => setWishGenerateLoading(false));
    }
  }, [isWishGenerating, activeWishRound?.id, refetchGardenState]);

  const openGardenAction = useCallback(() => {
    if (placedCount >= 15) {
      setWhichModal('treeFull');
      return;
    }
    if (isWishPicking) {
      setWhichModal('wish');
      return;
    }
    if (hasAnyDecorations) {
      setWhichModal('decoration');
      return;
    }
    if (noMissionsAtAll) {
      setWhichModal('talk');
      return;
    }
    setWhichModal('missions');
  }, [placedCount, isWishPicking, hasAnyDecorations, noMissionsAtAll]);

  const handlePlace = useCallback(async () => {
    if (!selected || isPlacing) return;
    if (selected.source === 'mission') {
      placeLocalDecoration(selected.id);
      setSelected(null);
      setWhichModal(null);
      return;
    }
    setIsPlacing(true);
    try {
      await placeOnTree(selected.id);
      setSelected(null);
      setWhichModal(null);
      refetchTree();
      refetchEncouragement();
    } catch (e) {
      console.error('[V2Garden] placeOnTree', e);
    } finally {
      setIsPlacing(false);
    }
  }, [selected, isPlacing, placeLocalDecoration, placeOnTree, refetchTree, refetchEncouragement]);

  const handleWishToggle = useCallback((optionId: string) => {
    setWishSelectIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else if (next.size < 3) next.add(optionId);
      return next;
    });
  }, []);

  const handleWishSubmit = useCallback(async () => {
    if (wishSelectIds.size !== 3 || !activeWishRound?.id || wishSubmitLoading) return;
    setWishSubmitLoading(true);
    try {
      const res = await fetch(`/api/wishes/rounds/${activeWishRound.id}/select`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ optionIds: Array.from(wishSelectIds) }),
      });
      if (res.ok) {
        setWishSelectIds(new Set());
        refetchGardenState();
        setWhichModal(null);
      }
    } finally {
      setWishSubmitLoading(false);
    }
  }, [wishSelectIds, activeWishRound?.id, wishSubmitLoading, refetchGardenState]);

  const handleRegenerateWishes = useCallback(() => {
    if (!activeWishRound?.id || wishGenerateLoading) return;
    setWishGenerateLoading(true);
    fetch('/api/wishes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ roundId: activeWishRound.id }),
    })
      .then((res) => (res.ok ? refetchGardenState() : Promise.reject()))
      .catch(() => {})
      .finally(() => setWishGenerateLoading(false));
  }, [activeWishRound?.id, wishGenerateLoading, refetchGardenState]);

  useEffect(() => {
    if (whichModal !== 'decoration') setSelected(null);
  }, [whichModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && whichModal) setWhichModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [whichModal]);

  const canSelect = selected !== null;

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
            minHeight: 0,
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
            My Garden
          </h1>

          <div
            style={{
              width: '100%',
              flex: 1,
              minHeight: '65vh',
              maxHeight: '65vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {(treeLoading && !isGuest) || gardenStateLoading ? (
              <p style={{ color: 'var(--v2-text-muted)', fontSize: '0.95rem' }}>Loading tree…</p>
            ) : (
              <button
                type="button"
                onClick={openGardenAction}
                aria-label="Open garden"
                style={{
                  width: '100%',
                  maxWidth: 360,
                  aspectRatio: '1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <ChristmasTreeSVG
                  growthStage={showStar ? Math.max(growthStage, 1) : growthStage}
                  placedDecorations={placedDecorations}
                />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={openGardenAction}
            aria-label="Decorate tree"
            style={{
              marginTop: 'auto',
              width: '100%',
              maxWidth: 240,
              padding: '16px 24px',
              borderRadius: 'var(--v2-radius-card)',
              border: 'none',
              background: 'var(--v2-primary)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--v2-shadow-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Package size={22} strokeWidth={2.5} />
            Decorate
          </button>
        </div>
      </main>

      {/* Wish modal */}
      {whichModal === 'wish' && (
        <>
          <div role="presentation" style={modalBackdropStyle} onClick={() => setWhichModal(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wish-modal-title"
            style={modalDialogStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader title="Pick 3 wishes" onClose={() => setWhichModal(null)} />
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'var(--v2-text-secondary)' }}>
                {isGuest
                  ? 'Choose the 3 you like best. Try it out!'
                  : 'Choose the 3 you like best. Your grown-up will pick one to make come true!'}
              </p>
              {!isGuest && wishGenerateLoading && wishOptions.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--v2-text-muted)' }}>Generating wishes…</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(isGuest ? guestWishes.options : wishOptions).map((opt) => {
                      const sel = isGuest ? guestWishes.selectedIds.has(opt.id) : wishSelectIds.has(opt.id);
                      const onToggle = isGuest ? () => guestWishes.toggle(opt.id) : () => handleWishToggle(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={onToggle}
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
                      disabled={
                        (isGuest ? guestWishes.selectedIds.size : wishSelectIds.size) !== 3 ||
                        (!isGuest && wishSubmitLoading)
                      }
                      onClick={isGuest ? () => guestWishes.submit() : handleWishSubmit}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 'var(--v2-radius-pill)',
                        border: 'none',
                        background:
                          (isGuest ? guestWishes.selectedIds.size : wishSelectIds.size) === 3
                            ? 'var(--v2-primary)'
                            : 'var(--v2-glass)',
                        color: (isGuest ? guestWishes.selectedIds.size : wishSelectIds.size) === 3 ? '#fff' : 'var(--v2-text-muted)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor:
                          (isGuest ? guestWishes.selectedIds.size : wishSelectIds.size) === 3 && (isGuest || !wishSubmitLoading)
                            ? 'pointer'
                            : 'default',
                      }}
                    >
                      {!isGuest && wishSubmitLoading ? 'Sending…' : `Submit ${(isGuest ? guestWishes.selectedIds.size : wishSelectIds.size)}/3`}
                    </button>
                    <button
                      type="button"
                      disabled={!isGuest && wishGenerateLoading}
                      onClick={isGuest ? guestWishes.regenerate : handleRegenerateWishes}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 'var(--v2-radius-card)',
                        border: '1px solid var(--v2-glass-border)',
                        background: 'var(--v2-surface)',
                        color: 'var(--v2-text-secondary)',
                        fontSize: '0.9rem',
                        cursor: !isGuest && wishGenerateLoading ? 'wait' : 'pointer',
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

      {/* Decoration picker modal */}
      {whichModal === 'decoration' && (
        <>
          <div role="presentation" style={modalBackdropStyle} onClick={() => setWhichModal(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="decorate-modal-title"
            aria-label="Pick a gift to put on your tree"
            style={modalDialogStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader title="Pick a gift to put on your tree" onClose={() => setWhichModal(null)} />
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {!child && (
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--v2-text-muted)', textAlign: 'center' }}>
                  Log in to see gifts from your grown-up.
                </p>
              )}
              {child && (
                <section aria-label="From your grown-up">
                  <h3
                    style={{
                      margin: '0 0 10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'var(--v2-text-muted)',
                    }}
                  >
                    From your grown-up
                  </h3>
                  {parentGroups.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--v2-text-secondary)' }}>
                      No gifts from grown-up yet.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {parentGroups.map((group) => {
                        const firstId = group.items[0]?.id;
                        const isSelected = selected?.source === 'parent' && group.items.some((i) => i.id === selected.id);
                        return (
                          <button
                            key={group.emoji + firstId}
                            type="button"
                            onClick={() =>
                              setSelected((prev) =>
                                prev?.source === 'parent' && prev?.id === firstId ? null : { source: 'parent', id: firstId }
                              )
                            }
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '12px 16px',
                              borderRadius: 12,
                              border: isSelected ? '2px solid var(--v2-primary)' : '1px solid var(--v2-glass-border)',
                              background: isSelected ? 'rgba(0, 207, 185, 0.12)' : 'var(--v2-glass)',
                              color: 'var(--v2-text-primary)',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <span style={{ fontSize: '1.5rem' }}>{group.emoji}</span>
                            {group.count > 1 && (
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--v2-text-muted)', marginLeft: 4 }}>
                                ×{group.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
              <section aria-label="From missions">
                <h3
                  style={{
                    margin: '0 0 10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--v2-text-muted)',
                  }}
                >
                  From missions
                </h3>
                {missionGroups.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--v2-text-secondary)' }}>
                    Complete missions to earn decorations.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {missionGroups.map((group) => {
                      const firstId = group.items[0]?.id;
                      const isSelected = selected?.source === 'mission' && group.items.some((i) => i.id === selected.id);
                      return (
                        <button
                          key={group.emoji + firstId}
                          type="button"
                          onClick={() =>
                            setSelected((prev) =>
                              prev?.source === 'mission' && prev?.id === firstId ? null : { source: 'mission', id: firstId }
                            )
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            borderRadius: 12,
                            border: isSelected ? '2px solid var(--v2-primary)' : '1px solid var(--v2-glass-border)',
                            background: isSelected ? 'rgba(0, 207, 185, 0.12)' : 'var(--v2-glass)',
                            color: 'var(--v2-text-primary)',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontSize: '1.5rem' }}>{group.emoji}</span>
                          {group.count > 1 && (
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--v2-text-muted)', marginLeft: 4 }}>
                              ×{group.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
            {canSelect && (
              <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--v2-glass-border)' }}>
                <button
                  type="button"
                  onClick={handlePlace}
                  disabled={isPlacing}
                  aria-label="Select and put on tree"
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: 'var(--v2-radius-pill)',
                    border: 'none',
                    background: 'var(--v2-primary)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: isPlacing ? 'wait' : 'pointer',
                    opacity: isPlacing ? 0.8 : 1,
                  }}
                >
                  {isPlacing ? 'Putting on tree…' : 'Select'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Missions modal */}
      {whichModal === 'missions' && (
        <>
          <div role="presentation" style={modalBackdropStyle} onClick={() => setWhichModal(null)} />
          <div role="dialog" aria-modal="true" style={modalDialogStyle} onClick={(e) => e.stopPropagation()}>
            <ModalHeader title="My missions" onClose={() => setWhichModal(null)} />
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 20px', color: 'var(--v2-text-secondary)', fontSize: '1rem' }}>
                Complete missions to earn decorations for your tree.
              </p>
              <Link
                href="/missions"
                onClick={() => setWhichModal(null)}
                style={{
                  display: 'inline-block',
                  padding: '14px 28px',
                  borderRadius: 'var(--v2-radius-pill)',
                  background: 'var(--v2-primary)',
                  color: '#fff',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                My missions
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Brave Call with Shelly modal */}
      {whichModal === 'talk' && (
        <>
          <div role="presentation" style={modalBackdropStyle} onClick={() => setWhichModal(null)} />
          <div role="dialog" aria-modal="true" style={modalDialogStyle} onClick={(e) => e.stopPropagation()}>
            <ModalHeader title="Start a Brave Call with Shelly" onClose={() => setWhichModal(null)} />
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 20px', color: 'var(--v2-text-secondary)', fontSize: '1rem' }}>
                Start a Brave Call with Shelly to talk about your day. Then complete brave missions to earn decorations!
              </p>
              <button
                type="button"
                onClick={() => {
                  setWhichModal(null);
                  router.push('/talk');
                }}
                style={{
                  padding: '14px 28px',
                  borderRadius: 'var(--v2-radius-pill)',
                  border: 'none',
                  background: 'var(--v2-primary)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Start Brave Call
              </button>
            </div>
          </div>
        </>
      )}

      {/* Tree full modal */}
      {whichModal === 'treeFull' && (
        <>
          <div role="presentation" style={modalBackdropStyle} onClick={() => setWhichModal(null)} />
          <div role="dialog" aria-modal="true" style={modalDialogStyle} onClick={(e) => e.stopPropagation()}>
            <ModalHeader title="Your tree is full!" onClose={() => setWhichModal(null)} />
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: 'var(--v2-text-secondary)', fontSize: '1rem' }}>
                You have 15 decorations on your tree. Great job!
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
