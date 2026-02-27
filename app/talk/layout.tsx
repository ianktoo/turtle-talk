import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Talk to Shelly',
  description:
    'Start a voice conversation with Shelly the sea turtle. She listens, responds warmly, and at the end offers you a brave challenge to try in real life.',
  openGraph: {
    title: 'Talk to Shelly 🐢 | TurtleTalk',
    description:
      'Have a friendly voice chat with Shelly. Safe, fun, and encouraging for children aged 4–10.',
  },
};

export default function TalkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
