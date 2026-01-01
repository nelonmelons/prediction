/**
 * Timeline Weaver - Phase 2: LLM Backend
 * Turns prediction data into trading signals and market analysis
 */

import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PredictionEvent } from "./oracle";

interface TradingSignal {
  asset: string;
  category: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number; // 0-100
  priceTarget?: string;
  rationale: string;
  timeframe: string;
  key_events: string[];
}

interface MarketAnalysis {
  period: string; // e.g., "Q1 2025", "2025", "Jan-Mar 2025"
  summary: string;
  signals: TradingSignal[];
  risk_level: "low" | "medium" | "high";
}

/**
 * Generate trading signals for a specific time period
 * @param period - The time period (year or quarter)
 * @param events - Array of prediction events for that period
 * @param bias - Optional bias: 'aggressive', 'conservative', or null for balanced
 * @returns Market analysis with trading signals
 */
export async function generateMarketAnalysis(
  period: string,
  events: PredictionEvent[],
  bias: "aggressive" | "conservative" | null = null
): Promise<MarketAnalysis> {
  // Initialize Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  // Sort by probability and group by category
  const topEvents = events.sort((a, b) => b.prob - a.prob).slice(0, 20);

  // Build strategy instruction
  let strategyInstruction = "";
  if (bias === "aggressive") {
    strategyInstruction =
      "Focus on high-conviction trades with higher risk/reward. Emphasize momentum and growth opportunities. Recommend BUY/SELL over HOLD.";
  } else if (bias === "conservative") {
    strategyInstruction =
      "Focus on capital preservation and lower-risk positions. Emphasize defensive plays and quality. Recommend HOLD more often.";
  }

  const systemPrompt = `You are a quantitative analyst at a leading hedge fund. Your job is to translate prediction market data into actionable trading signals.

${strategyInstruction ? `STRATEGY: ${strategyInstruction}\n` : ""}
Analyze these prediction markets for ${period} and generate trading signals. Use probabilities to determine conviction:
- >70% probability = High confidence signal
- 60-70% = Medium confidence
- <60% = Lower confidence or HOLD

Return ONLY valid JSON with this structure:
{
  "period": "${period}",
  "summary": "Brief 2-sentence market overview (30-40 words)",
  "signals": [
    {
      "asset": "Asset name or ticker (e.g., 'Bitcoin', 'Gold', 'TSLA')",
      "category": "Equities/Crypto/Commodities/Indices/Forex/Economy",
      "signal": "BUY or SELL or HOLD",
      "confidence": 75, // number 0-100
      "priceTarget": "Optional: e.g. '$4500' or 'Above $50k'",
      "rationale": "One sentence explaining the trade (20-30 words)",
      "timeframe": "e.g., 'Q1 2025', '6 months', '2025'",
      "key_events": ["Event 1 from data", "Event 2 from data"]
    }
  ],
  "risk_level": "low or medium or high"
}`;

  const userPrompt = `Prediction market data for ${period}:

${topEvents
  .map(
    (e, i) =>
      `${i + 1}. [${(e.prob * 100).toFixed(1)}%] ${e.event}\n   Category: ${e.category}${e.ticker ? ` | Ticker: ${e.ticker}` : ""}${e.priceTarget ? ` | Target: $${e.priceTarget}` : ""}${e.signal ? ` | Signal: ${e.signal}` : ""}`
  )
  .join("\n\n")}

Generate 3-8 actionable trading signals based on this data. Focus on the highest-probability, highest-volume predictions.`;

  try {
    console.log(`\n📊 Generating trading signals for ${period}...`);

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = result.response.text();

    // Parse JSON response
    const analysis = JSON.parse(response) as MarketAnalysis;

    // Validate structure
    if (!analysis.period || !analysis.summary || !analysis.signals) {
      throw new Error("Generated analysis missing required fields");
    }

    console.log(`✅ Generated ${analysis.signals.length} signals for ${period}`);

    return analysis;
  } catch (error) {
    console.error(`Error generating analysis for ${period}:`, error);
    throw error;
  }
}

/**
 * Generate all market analyses for a timeline
 * @param timeline - Timeline data grouped by year
 * @param bias - Optional bias for strategy
 * @returns Array of market analyses
 */
export async function generateTimelineAnalysis(
  timeline: { [year: string]: PredictionEvent[] },
  bias: "aggressive" | "conservative" | null = null
): Promise<MarketAnalysis[]> {
  const analyses: MarketAnalysis[] = [];
  const years = Object.keys(timeline).sort();

  console.log(
    `\n📊 Generating trading signals for ${years.length} periods...`
  );
  if (bias) {
    console.log(`📈 Strategy: ${bias.toUpperCase()}`);
  }

  for (const yearStr of years) {
    const events = timeline[yearStr];

    if (events.length === 0) {
      console.log(`⏭️  Skipping ${yearStr} (no events)`);
      continue;
    }

    const analysis = await generateMarketAnalysis(yearStr, events, bias);
    analyses.push(analysis);

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Generated ${analyses.length} market analyses`);

  return analyses;
}

/**
 * Generate trading signals and save to file
 */
export async function generateSignalsFile(
  bias: "aggressive" | "conservative" | null = null
): Promise<void> {
  // Import oracle to get predictions
  const { getFutureTimeline } = await import("./oracle");

  // Get prediction data
  const timeline = await getFutureTimeline();

  // Generate analyses
  const analyses = await generateTimelineAnalysis(timeline, bias);

  // Save to file
  if (typeof window === "undefined") {
    const fs = await import("fs");
    const path = await import("path");

    const filename = bias ? `signals-${bias}.json` : "signals.json";

    // Save to public directory for Next.js
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, filename);

    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          strategy: bias || "balanced",
          analyses,
        },
        null,
        2
      )
    );

    console.log(`\n✅ Saved trading signals to ${outputPath}`);
  }
}

// Auto-run when executed directly
if (typeof require !== "undefined" && require.main === module) {
  generateSignalsFile().catch(console.error);
}
  }
}

// CLI execution
if (require.main === module) {
  const bias = process.argv[2] as "doomer" | "utopian" | null;
  generateTimelineFile(bias).catch(console.error);
}
