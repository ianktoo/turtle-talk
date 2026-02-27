import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Missions',
  description:
    'Track your brave challenges. Each mission is a small real-world act of courage, kindness, or creativity suggested by Shelly after your conversation.',
  openGraph: {
    title: 'My Missions | TurtleTalk',
    description: 'Brave challenges for children — easy, medium, or stretch. Complete them in real life and grow stronger!',
  },
};

export default function MissionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
