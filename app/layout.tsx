import type { Metadata } from "next";
import { Varela_Round } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import Scene from "./components/Scene";
import VersionBadge from "./components/VersionBadge";

const varelaRound = Varela_Round({ variable: "--font-varela", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "TurtleTalk",
  description: "TurtleTalk — chat with Shelly!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${varelaRound.variable} antialiased`}>
        <Theme>
          <Scene />
          {children}
          <VersionBadge />
        </Theme>
      </body>
    </html>
  );
}
