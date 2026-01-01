"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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

interface SignalCardProps {
  signal: TradingSignal;
  index: number;
}

export default function SignalCard({ signal, index }: SignalCardProps) {
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Generate mock chart data (in production, use Yahoo Finance API)
  useEffect(() => {
    // Simulate loading and generate mock data
    const generateMockData = () => {
      const data = [];
      const baseValue = 100;
      const trend =
        signal.signal === "BUY" ? 0.5 : signal.signal === "SELL" ? -0.5 : 0;

      for (let i = 0; i < 30; i++) {
        const randomWalk = (Math.random() - 0.5) * 2;
        const value = baseValue + i * trend + randomWalk * 3;
        data.push({
          date: `Day ${i + 1}`,
          value: Math.max(0, value),
        });
      }
      return data;
    };

    setTimeout(() => {
      setChartData(generateMockData());
      setLoading(false);
    }, 100 * index); // Stagger loading
  }, [signal, index]);

  const signalColor =
    signal.signal === "BUY"
      ? "border-green-500 bg-green-500/5"
      : signal.signal === "SELL"
      ? "border-red-500 bg-red-500/5"
      : "border-gray-500 bg-gray-500/5";

  const signalBadgeColor =
    signal.signal === "BUY"
      ? "bg-green-500 text-green-100"
      : signal.signal === "SELL"
      ? "bg-red-500 text-red-100"
      : "bg-gray-500 text-gray-100";

  const chartColor =
    signal.signal === "BUY"
      ? "#22c55e"
      : signal.signal === "SELL"
      ? "#ef4444"
      : "#6b7280";

  return (
    <motion.div
      className={`relative border ${signalColor} rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      {/* Signal Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${signalBadgeColor}`}
          >
            {signal.signal}
          </span>
          <span className="text-gray-400 text-xs">{signal.category}</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{signal.confidence}%</div>
          <div className="text-xs text-gray-500">Confidence</div>
        </div>
      </div>

      {/* Asset Name */}
      <h3 className="text-2xl font-serif font-bold mb-2">{signal.asset}</h3>

      {/* Price Target */}
      {signal.priceTarget && (
        <div className="text-sm text-gray-400 mb-4">
          Target:{" "}
          <span className="text-white font-semibold">{signal.priceTarget}</span>
        </div>
      )}

      {/* Chart */}
      <div className="h-32 mb-4 -mx-2">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#cbd5e1" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Rationale */}
      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
        {signal.rationale}
      </p>

      {/* Timeframe */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>Timeframe:</span>
        <span className="text-gray-400">{signal.timeframe}</span>
      </div>

      {/* Key Events */}
      {signal.key_events.length > 0 && (
        <div className="pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2">Key Events:</div>
          <ul className="space-y-1">
            {signal.key_events.slice(0, 2).map((event, i) => (
              <li
                key={i}
                className="text-xs text-gray-400 flex items-start gap-2"
              >
                <span className="text-gray-600 mt-0.5">•</span>
                <span className="line-clamp-2">{event}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-xl overflow-hidden">
        <motion.div
          className={`h-full ${
            signal.signal === "BUY"
              ? "bg-green-500"
              : signal.signal === "SELL"
              ? "bg-red-500"
              : "bg-gray-500"
          }`}
          initial={{ width: 0 }}
          whileInView={{ width: `${signal.confidence}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: index * 0.05 }}
        />
      </div>
    </motion.div>
  );
}
