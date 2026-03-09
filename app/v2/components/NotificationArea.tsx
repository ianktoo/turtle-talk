'use client';

import { useState, useEffect } from 'react';
import NotificationCard from './NotificationCard';
import { getRandomKidQuote, QUOTE_THEMATIC_AREAS } from '@/lib/quotes/kid-quotes';

export type NotificationItem = {
  id: string;
  from: string;
  text: string;
  emoji?: string;
};

/** Reserved height for up to 3 notification cards (card + gap) so layout stays stable. */
const NOTIFICATION_SLOT_HEIGHT = 82;
const NOTIFICATION_GAP = 12;
const MIN_HEIGHT = 3 * NOTIFICATION_SLOT_HEIGHT + 2 * NOTIFICATION_GAP;

export default function NotificationArea() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [fallback, setFallback] = useState<NotificationItem | null>(null);

  useEffect(() => {
    // Choose a stable, deterministic default quote for the very first render
    // to avoid server/client hydration mismatches, then allow randomisation
    // on the client once mounted.
    const firstArea = QUOTE_THEMATIC_AREAS[0];
    const initialQuote = getRandomKidQuote(firstArea.slug);
    setFallback({
      id: 'quote',
      from: initialQuote.label,
      text: initialQuote.text,
      emoji: initialQuote.emoji,
    });

    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data: { notifications?: NotificationItem[] }) => {
        const list = Array.isArray(data?.notifications) ? data.notifications : [];
        setNotifications(list);
      })
      .catch(() => setNotifications([]));
  }, []);

  const items = notifications.slice(0, 3);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: NOTIFICATION_GAP,
        width: '100%',
        maxWidth: 400,
        minHeight: MIN_HEIGHT,
      }}
    >
      {items.length > 0 ? (
        items.map((item) => (
          <NotificationCard
            key={item.id}
            id={item.id}
            from={item.from}
            text={item.text}
            emoji={item.emoji}
          />
        ))
      ) : fallback ? (
        <NotificationCard
          key="quote"
          id={fallback.id}
          from={fallback.from}
          text={fallback.text}
          emoji={fallback.emoji}
        />
      ) : null}
    </div>
  );
}
