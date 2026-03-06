'use client';

import { useRouter } from 'next/navigation';
import { useMicPermission } from '@/app/hooks/useMicPermission';
import MicPermission from '@/app/components/talk/MicPermission';
import { ConversationView } from '@/app/components/talk/ConversationView';

export default function TalkPage() {
  const { status, requestPermission } = useMicPermission();
  const router = useRouter();

  if (status === 'checking') {
    return (
      <main
        style={{
          position: 'relative', zIndex: 10, minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <p style={{ color: 'white', fontSize: 18 }}>Loading...</p>
      </main>
    );
  }

  if (status === 'denied' || status === 'prompt') {
    return <MicPermission onGranted={requestPermission} onDenied={() => router.push('/')} />;
  }

  return <ConversationView />;
}
