import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brave Garden',
  description:
    'Your personal Brave Garden — a visual collection of every challenge you have completed. Watch your courage grow, one brave act at a time.',
  openGraph: {
    title: 'Brave Garden 🌿 | TurtleTalk',
    description: 'See all the brave acts your child has completed. A growing garden of real-world courage.',
  },
};

export default function WorldLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
