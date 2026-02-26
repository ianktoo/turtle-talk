import Link from "next/link";

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 select-none">

      {/* Turtle mascot */}
      <div
        style={{
          fontSize: 110,
          lineHeight: 1,
          animation: "turtleBob 3s ease-in-out infinite",
          marginBottom: 12,
          filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.25))",
        }}
      >
        🐢
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: "clamp(2.4rem, 8vw, 4rem)",
          fontWeight: 900,
          color: "white",
          textShadow: "0 3px 12px rgba(0,0,0,0.35)",
          letterSpacing: "-0.02em",
          marginBottom: 6,
          textAlign: "center",
        }}
      >
        Turtle Talk
      </h1>

      <p
        style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: "clamp(1rem, 3.5vw, 1.25rem)",
          marginBottom: 36,
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        What do you want to do?
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 360 }}>

        <Link href="/talk" style={{ width: "100%", textDecoration: "none" }}>
          <button
            style={{
              width: "100%",
              padding: "18px 24px",
              borderRadius: 24,
              border: "none",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "white",
              fontSize: "1.35rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 6px 24px rgba(22,163,74,0.45)",
              animation: "btnPulse 3s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: "1.8rem" }}>🗣️</span>
            <span style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.2 }}>
              <span>Turtle Talk</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 500, opacity: 0.85 }}>Chat with Shelly!</span>
            </span>
          </button>
        </Link>

        <Link href="/missions" style={{ width: "100%", textDecoration: "none" }}>
          <button
            style={{
              width: "100%",
              padding: "18px 24px",
              borderRadius: 24,
              border: "none",
              background: "linear-gradient(135deg, #ea580c, #f97316)",
              color: "white",
              fontSize: "1.35rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 6px 24px rgba(234,88,12,0.45)",
              animation: "btnPulse 3s ease-in-out infinite",
              animationDelay: "1.5s",
            }}
          >
            <span style={{ fontSize: "1.8rem" }}>🥗</span>
            <span style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.2 }}>
              <span>Feed Turtle</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 500, opacity: 0.85 }}>Complete missions!</span>
            </span>
          </button>
        </Link>

      </div>
    </main>
  );
}
