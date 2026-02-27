import BottomNav from "./components/BottomNav";
import MessagesButton from "./components/MessagesButton";

export default function Home() {
  return (
    <>
      <main
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 select-none"
        style={{ paddingBottom: 140, gap: 0 }}
      >
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
            marginBottom: 28,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          Your friendly sea turtle! 🌊
        </p>

        {/* Messages pill — glassy, below the hero text */}
        <MessagesButton count={0} />
      </main>

      <BottomNav />
    </>
  );
}
