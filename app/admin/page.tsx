import Link from 'next/link';

export const metadata = {
  title: 'Admin | TurtleTalk',
  description: 'User and application management',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f9fafb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
          Admin
        </h1>
        <Link
          href="/parent"
          style={{ fontSize: 14, color: '#0f766e', textDecoration: 'none' }}
        >
          ← Parent dashboard
        </Link>
      </header>
      <main
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <p style={{ color: '#6b7280', margin: 0 }}>
          Admin dashboard. User management, customer management, role management, support requests, and feature flags will appear here as cards.
        </p>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 20,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>User management</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Coming soon</p>
          </div>
          <div
            style={{
              padding: 20,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>Customer management</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Coming soon</p>
          </div>
          <div
            style={{
              padding: 20,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>Role management</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Coming soon</p>
          </div>
          <div
            style={{
              padding: 20,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>Support requests</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Coming soon</p>
          </div>
          <div
            style={{
              padding: 20,
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>Feature flags</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Coming soon</p>
          </div>
        </section>
      </main>
    </div>
  );
}
