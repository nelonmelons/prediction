import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Market Signals - AI-Powered Trading Insights",
  description:
    "Real-time trading signals generated from prediction market data using AI",
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
