'use client';

import type { PlacedDecoration } from '@/app/hooks/useTree';

const MAX_DECORATIONS = 15;

interface ChristmasTreeSVGProps {
  growthStage: number;
  placedDecorations: PlacedDecoration[];
}

// Slot positions as percentages for Turtle-Talk-Tree (1080x1080 viewBox)
const TREE_SLOTS = [
  { id: 'slot-0', x: 50, y: 18 },
  { id: 'slot-1', x: 38, y: 26 },
  { id: 'slot-2', x: 62, y: 26 },
  { id: 'slot-3', x: 44, y: 34 },
  { id: 'slot-4', x: 56, y: 34 },
  { id: 'slot-5', x: 50, y: 42 },
  { id: 'slot-6', x: 32, y: 50 },
  { id: 'slot-7', x: 68, y: 50 },
  { id: 'slot-8', x: 50, y: 56 },
  { id: 'slot-9', x: 40, y: 63 },
  { id: 'slot-10', x: 60, y: 63 },
  { id: 'slot-11', x: 36, y: 70 },
  { id: 'slot-12', x: 64, y: 70 },
  { id: 'slot-13', x: 44, y: 76 },
  { id: 'slot-14', x: 56, y: 76 },
];

export default function ChristmasTreeSVG({
  growthStage,
  placedDecorations,
}: ChristmasTreeSVGProps) {
  const placedBySlot = new Map(placedDecorations.map((d) => [d.slotId, d.emoji]));
  const scale = 0.75 + growthStage * 0.05;

  const treeSrc =
    growthStage >= 1
      ? '/tree/Turtle-Talk-Tree_With Star.svg'
      : '/tree/Turtle-Talk-Tree_No Star.svg';

  const visibleSlots = TREE_SLOTS.slice(0, Math.min(placedDecorations.length + 3, MAX_DECORATIONS));

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          transformOrigin: 'center center',
          transform: `scale(${scale})`,
          position: 'relative',
          width: '100%',
          maxWidth: 360,
          aspectRatio: '1',
        }}
      >
        <img
          src={treeSrc}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center center',
            display: 'block',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          {visibleSlots.map((slot) => {
            const emoji = placedBySlot.get(slot.id);
            const leftPct = slot.x / 100;
            const topPct = slot.y / 100;
            return (
              <div
                key={slot.id}
                style={{
                  position: 'absolute',
                  left: `calc(${leftPct * 100}% - 14px)`,
                  top: `calc(${topPct * 100}% - 14px)`,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: emoji ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                  border: emoji ? '2px solid rgba(255,255,255,0.5)' : '1.5px dashed rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                {emoji ?? ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
