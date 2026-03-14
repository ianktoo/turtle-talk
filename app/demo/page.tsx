import { redirect } from 'next/navigation';
import { isDemoModeEnabled } from '@/lib/env/demo';
import DemoFlow from './ui/DemoFlow';

export default function DemoPage() {
  if (!isDemoModeEnabled()) redirect('/');
  return <DemoFlow />;
}

