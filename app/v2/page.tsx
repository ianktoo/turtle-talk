'use client';

import Logo from './components/Logo';
import Title from './components/Title';
import MenuButton from './components/MenuButton';
import NotificationArea from './components/NotificationArea';
import TalkButton from './components/TalkButton';

export default function V2HomePage() {
  return (
    <>
      <MenuButton />

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'max(24px, env(safe-area-inset-top)) 24px max(120px, calc(24px + env(safe-area-inset-bottom)))',
          gap: 28,
          maxWidth: 500,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Logo />
          <Title />
        </div>

        <NotificationArea />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <TalkButton />
        </div>
      </main>
    </>
  );
}
