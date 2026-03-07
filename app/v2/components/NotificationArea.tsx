'use client';

import NotificationCard from './NotificationCard';

export type NotificationItem = {
  id: string;
  from: string;
  text: string;
  emoji?: string;
};

const PLACEHOLDER_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', from: 'Message from mom', text: "You're braver than you know!", emoji: '💪' },
  { id: 'n2', from: 'Message from dad', text: "Proud of you!", emoji: '🌟' },
  { id: 'n3', from: 'Message from Shelly', text: 'Keep being brave!', emoji: '🐢' },
];

export default function NotificationArea() {
  const items = PLACEHOLDER_NOTIFICATIONS.slice(0, 3);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        maxWidth: 400,
      }}
    >
      {items.map((item) => (
        <NotificationCard
          key={item.id}
          id={item.id}
          from={item.from}
          text={item.text}
          emoji={item.emoji}
        />
      ))}
    </div>
  );
}
