import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Future History - A Self-Writing Timeline",
  description:
    "A history book that writes itself based on real-time prediction markets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
