import type { Metadata } from "next";
import "./v2-tokens.css";

export const metadata: Metadata = {
  title: "TurtleTalk",
};

export default function V2Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className="v2-ui"
      style={{
        minHeight: "100vh",
        background: "transparent",
        fontFamily: "var(--font-varela), 'Varela Round', sans-serif",
      }}
    >
      {children}
    </div>
  );
}
