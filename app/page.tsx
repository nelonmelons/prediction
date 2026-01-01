"use client";

import { motion, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import SignalCard from "@/components/SignalCard";

interface TradingSignal {
  asset: string;
  category: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  priceTarget?: string | null;
  rationale: string;
  timeframe: string;
  key_events: string[];
}

interface MarketAnalysis {
  period: string;
  summary: string;
  signals: TradingSignal[];
  risk_level: "low" | "medium" | "high";
}

interface SignalsData {
  generated_at: string;
  strategy: string;
  analyses: MarketAnalysis[];
}

export default function TradingDashboard() {
  const [signalsData, setSignalsData] = useState<SignalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Load signals data
  useEffect(() => {
    fetch("/signals.json")
      .then((res) => res.json())
      .then((data) => {
        setSignalsData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading signals:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-2xl font-serif">Loading market signals...</div>
        </div>
      </div>
    );
  }

  if (!signalsData || !signalsData.analyses.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center max-w-lg px-4">
          <div className="text-6xl mb-4">📈</div>
          <h1 className="text-3xl font-serif mb-4">No Signals Generated</h1>
          <p className="text-gray-400 mb-6">
            Run{" "}
            <code className="bg-gray-800 px-2 py-1 rounded">
              npm run generate
            </code>{" "}
            to create trading signals first.
          </p>
        </div>
      </div>
    );
  }

  // Flatten all signals from all periods
  const allSignals = signalsData.analyses.flatMap((analysis) =>
    analysis.signals.map((signal) => ({
      ...signal,
      period: analysis.period,
      risk_level: analysis.risk_level,
    }))
  );

  return (
    <div
      ref={containerRef}
      className="relative bg-black text-white min-h-screen"
    >
      {/* Fixed Background Gradient */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-900 via-black to-slate-900" />

      {/* Scrolling Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-4xl">
            <motion.div
              className="inline-block text-6xl mb-6"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              📊
            </motion.div>
            <motion.h1
              className="text-6xl md:text-8xl font-serif font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              Market Signals
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              AI-powered trading signals from real-time prediction markets
            </motion.p>
            <motion.div
              className="flex items-center justify-center gap-6 text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span>Live Data</span>
              </div>
              <div>Strategy: {signalsData.strategy}</div>
              <div>{allSignals.length} Signals</div>
            </motion.div>
            <motion.div
              className="text-sm text-gray-500 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              Scroll to explore signals →
            </motion.div>
          </div>
        </div>

        {/* Signals Grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          {signalsData.analyses.map((analysis, periodIndex) => (
            <div key={analysis.period} className="mb-20">
              {/* Period Header */}
              <motion.div
                className="mb-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-5xl font-serif font-bold mb-4">
                  {analysis.period}
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  {analysis.summary}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      analysis.risk_level === "high"
                        ? "bg-red-500"
                        : analysis.risk_level === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm text-gray-300">
                    {analysis.risk_level.toUpperCase()} RISK
                  </span>
                </div>
              </motion.div>

              {/* Signals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analysis.signals.map((signal, signalIndex) => (
                  <SignalCard
                    key={`${analysis.period}-${signalIndex}`}
                    signal={signal}
                    index={periodIndex * analysis.signals.length + signalIndex}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="min-h-[50vh] flex items-center justify-center px-4 border-t border-slate-800">
          <div className="text-center max-w-2xl">
            <div className="text-4xl font-serif mb-4">⚡</div>
            <h2 className="text-3xl font-serif mb-4">Data-Driven Trading</h2>
            <p className="text-gray-400 mb-6">
              Generated from {allSignals.length} prediction market signals
            </p>
            <p className="text-xs text-gray-600">
              Strategy: {signalsData.strategy} • Generated:{" "}
              {new Date(signalsData.generated_at).toLocaleString()}
            </p>
            <p className="text-xs text-gray-700 mt-4">
              Not financial advice. For educational purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
