import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages',
  description:
    'Read past conversation highlights from your chats with Shelly — fun moments, topics explored, and encouragement to revisit.',
  openGraph: {
    title: 'Messages | TurtleTalk',
    description: 'Conversation highlights from your sessions with Shelly the sea turtle.',
  },
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
