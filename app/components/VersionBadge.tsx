import pkg from "../../package.json";

export default function VersionBadge() {
  return (
    <div
      className="fixed bottom-3 right-3 z-50 pointer-events-none"
      style={{
        fontSize: "0.65rem",
        fontWeight: 600,
        color: "rgba(255,255,255,0.5)",
        letterSpacing: "0.05em",
        userSelect: "none",
      }}
    >
      v{pkg.version}
    </div>
  );
}
