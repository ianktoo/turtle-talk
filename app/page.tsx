import Link from "next/link";
import { Phone, Star, Leaf } from "lucide-react";

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
        TurtleTalk
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
        Chat with Shelly!
      </p>

      {/* Primary call button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <Link href="/talk">
          <button
            style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              boxShadow: "0 8px 32px rgba(22,163,74,0.55)",
              animation: "btnPulse 3s ease-in-out infinite",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Phone size={52} color="white" strokeWidth={2} />
          </button>
        </Link>
        <p
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "white",
            textShadow: "0 2px 6px rgba(0,0,0,0.4)",
            margin: "12px 0 0",
            textAlign: "center",
          }}
        >
          Talk to Shelly!
        </p>
      </div>

      {/* Secondary nav row */}
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 360, marginTop: 24 }}>

        <Link href="/missions" style={{ flex: 1, textDecoration: "none" }}>
          <button
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 20,
              border: "none",
              background: "linear-gradient(135deg, #ea580c, #f97316)",
              boxShadow: "0 4px 16px rgba(234,88,12,0.45)",
              animation: "btnPulse 3s ease-in-out infinite",
              animationDelay: "1.5s",
              color: "white",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Star size={20} color="white" strokeWidth={2} />
            My Missions
          </button>
        </Link>

        <Link href="/world" style={{ flex: 1, textDecoration: "none" }}>
          <button
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 20,
              border: "none",
              background: "linear-gradient(135deg, #0e7490, #06b6d4)",
              boxShadow: "0 4px 16px rgba(6,182,212,0.45)",
              animation: "btnPulse 3s ease-in-out infinite",
              animationDelay: "3s",
              color: "white",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Leaf size={20} color="white" strokeWidth={2} />
            My Garden
          </button>
        </Link>

      </div>
    </main>
  );
}
