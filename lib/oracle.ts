/**
 * Oracle Engine - Phase 1: Data Aggregation
 * Fetches prediction market data and structures it by year
 */

interface PolymarketEvent {
  id: string;
  slug: string;
  question: string;
  description?: string;
  // Note: outcomes and outcomePrices are JSON strings (e.g., "[\"Yes\", \"No\"]")
  // They map 1:1 by index (e.g., outcomes[0] has price outcomePrices[0])
  outcomePrices?: string | string[]; // Can be JSON string or parsed array
  outcomes?: string | string[]; // Can be JSON string or parsed array
  volume?: string;
  endDate?: string;
  startDate?: string;
  active?: boolean;
  closed?: boolean;
  tags?: Array<{
    id: string;
    label: string;
  }>;
  // CLOB token IDs for fetching live prices
  clobTokenIds?: string[];
}

export interface PredictionEvent {
  event: string;
  prob: number;
  category: string;
  confidence: "fact" | "likely" | "uncertain";
  source: "polymarket";
  ticker?: string;
  priceTarget?: number;
  timeframe?: string;
  signal?: "bullish" | "bearish" | "neutral";
}

interface TimelineData {
  [year: string]: PredictionEvent[];
}

/**
 * Extract year from event title or description
 */
function extractYear(text: string): number | null {
  // Look for patterns like "2026", "by 2027", "in 2028", "before 2029", "Q1 2026", "January 2026"
  const yearPatterns = [
    /\b(202[5-9]|203[0-9])\b/,
    /by\s+(202[5-9]|203[0-9])/i,
    /in\s+(202[5-9]|203[0-9])/i,
    /before\s+(202[5-9]|203[0-9])/i,
    /after\s+(202[5-9]|203[0-9])/i,
    /Q[1-4]\s+(202[5-9]|203[0-9])/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(202[5-9]|203[0-9])/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(202[5-9]|203[0-9])/i,
  ];

  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match) {
      const year = parseInt(match[match.length - 1]);
      if (year >= 2025 && year <= 2040) {
        return year;
      }
    }
  }

  return null;
}

/**
 * Categorize event based on keywords
 */
function categorizeEvent(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  const categories: { [key: string]: string[] } = {
    Equities: [
      "stock", "share", "equity", "s&p", "nasdaq", "dow", "ipo", 
      "apple", "google", "microsoft", "amazon", "tesla", "nvidia", "meta",
      "tsla", "aapl", "googl", "msft", "amzn", "nvda"
    ],
    Commodities: [
      "gold", "silver", "oil", "crude", "copper", "platinum",
      "commodity", "wheat", "corn", "natural gas", "wti", "brent"
    ],
    Crypto: [
      "bitcoin", "ethereum", "crypto", "btc", "eth", "blockchain",
      "solana", "cardano", "altcoin", "defi"
    ],
    Indices: [
      "index", "indices", "s&p 500", "nasdaq 100", "dow jones",
      "russell", "vix", "market index"
    ],
    Forex: [
      "dollar", "euro", "yen", "pound", "currency", "forex", "fx",
      "usd", "eur", "gbp", "jpy", "exchange rate"
    ],
    Economy: [
      "fed", "interest rate", "inflation", "recession", "gdp",
      "unemployment", "cpi", "treasury", "bond", "yield"
    ],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "Other";
}

/**
 * Extract stock ticker from text
 */
function extractTicker(text: string): string | undefined {
  const tickerPatterns = [
    /\b([A-Z]{1,5})\s+stock/i,
    /\$([A-Z]{1,5})\b/,
    /ticker:\s*([A-Z]{1,5})/i,
    /\b(AAPL|GOOGL|MSFT|AMZN|TSLA|NVDA|META|NFLX|AMD|INTC|BA|GE|F|GM)\b/,
  ];

  for (const pattern of tickerPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return undefined;
}

/**
 * Extract price target from text
 */
function extractPriceTarget(text: string): number | undefined {
  const pricePatterns = [
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    /price\s+(?:of|at|to)\s+\$(\d+)/i,
    /reach\s+\$(\d+)/i,
    /above\s+\$(\d+)/i,
    /below\s+\$(\d+)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ""));
    }
  }

  return undefined;
}

/**
 * Determine trading signal based on probability and question phrasing
 */
function determineSignal(question: string, prob: number): "bullish" | "bearish" | "neutral" {
  const text = question.toLowerCase();
  const bearishWords = ["below", "fall", "decline", "drop", "crash", "less than", "under"];
  const bullishWords = ["above", "rise", "increase", "surge", "rally", "more than", "over", "reach"];
  
  const isBearishQuestion = bearishWords.some(word => text.includes(word));
  const isBullishQuestion = bullishWords.some(word => text.includes(word));
  
  // High probability bearish question = bearish signal
  if (isBearishQuestion && prob > 0.6) return "bearish";
  
  // High probability bullish question = bullish signal
  if (isBullishQuestion && prob > 0.6) return "bullish";
  
  // Low probability bearish question = bullish signal (inverse)
  if (isBearishQuestion && prob < 0.4) return "bullish";
  
  // Low probability bullish question = bearish signal (inverse)
  if (isBullishQuestion && prob < 0.4) return "bearish";
  
  return "neutral";
}

/**
 * Determine confidence level based on probability
 */
function getConfidence(prob: number): "fact" | "likely" | "uncertain" {
  if (prob >= 0.75) return "fact";
  if (prob >= 0.6) return "likely";
  return "uncertain";
}

/**
 * Fetch events from Polymarket Gamma API with pagination
 *
 * Rate Limits (managed via Cloudflare):
 * - General Gamma Requests: 4,000 per 10 seconds (400/s)
 * - /events endpoint: 500 per 10 seconds (50/s)
 * - /markets endpoint: 300 per 10 seconds (30/s)
 *
 * Note: Returns 429 Too Many Requests if exceeded.
 * Check Retry-After header for pause duration.
 */
async function fetchPolymarketEvents(
  maxMarkets = 1000,
  retries = 3,
  retryDelay = 1000
): Promise<PolymarketEvent[]> {
  const allMarkets: PolymarketEvent[] = [];
  const limit = 100; // Per-request limit
  let offset = 0;

  while (allMarkets.length < maxMarkets) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(
          `https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=${limit}&offset=${offset}`
        );

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const waitTime = retryAfter
            ? parseInt(retryAfter) * 1000
            : retryDelay * Math.pow(2, attempt);

          console.warn(
            `⏳ Rate limited. Retrying in ${waitTime / 1000}s... (Attempt ${
              attempt + 1
            }/${retries})`
          );

          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        if (!response.ok) {
          throw new Error(`Polymarket API error: ${response.status}`);
        }

        const data = await response.json();

        // If no data returned, we've reached the end
        if (!data || data.length === 0) {
          console.log(
            `📭 No more markets available (fetched ${allMarkets.length} total)`
          );
          return allMarkets;
        }

        allMarkets.push(...data);
        console.log(
          `📥 Fetched ${data.length} markets (${allMarkets.length} total so far...)`
        );

        // Break retry loop on success
        break;
      } catch (error) {
        if (attempt === retries - 1) {
          console.error("Error fetching Polymarket data:", error);
          return allMarkets; // Return what we have so far
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }

    // Move to next page
    offset += limit;

    // Small delay to respect rate limits (300 req/10s = ~30ms between requests)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allMarkets.slice(0, maxMarkets);
}

/**
 * Process Polymarket events into structured predictions
 */
function processPolymarketEvents(events: PolymarketEvent[]): PredictionEvent[] {
  const predictions: PredictionEvent[] = [];

  let skipReasons = {
    noTitle: 0,
    lowVolume: 0,
    noYear: 0,
    noPrices: 0,
    invalidProb: 0,
  };

  for (const event of events) {
    // Safety checks
    if (!event || !event.question) {
      skipReasons.noTitle++;
      continue;
    }

    // Filter by volume (> $5,000)
    const volume = parseFloat(event.volume || "0");
    if (volume < 5000) {
      skipReasons.lowVolume++;
      continue;
    }

    // Extract year
    const year =
      extractYear(event.question) || extractYear(event.description || "");
    if (!year) {
      skipReasons.noYear++;
      continue;
    }

    // Get probability - outcomes and outcomePrices map 1:1 by index
    let prob = 0;
    let outcomes: string[] = [];
    let prices: string[] = [];

    // Parse outcomes if present
    if (event.outcomes) {
      if (typeof event.outcomes === "string") {
        try {
          outcomes = JSON.parse(event.outcomes);
        } catch (e) {
          // Skip invalid JSON
        }
      } else if (Array.isArray(event.outcomes)) {
        outcomes = event.outcomes;
      }
    }

    // Parse outcomePrices
    if (event.outcomePrices) {
      if (typeof event.outcomePrices === "string") {
        try {
          prices = JSON.parse(event.outcomePrices);
        } catch (e) {
          skipReasons.invalidProb++;
          continue;
        }
      } else if (Array.isArray(event.outcomePrices)) {
        prices = event.outcomePrices;
      }
    }

    // Find "Yes" outcome or default to first price
    if (outcomes.length > 0 && prices.length > 0) {
      const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === "yes");
      prob = parseFloat(prices[yesIndex !== -1 ? yesIndex : 0]);
    } else if (prices.length > 0) {
      // No outcomes array, assume first is "Yes"
      prob = parseFloat(prices[0]);
    }

    if (isNaN(prob)) {
      skipReasons.invalidProb++;
      continue;
    }

    // Skip if no meaningful probability data
    if (prob === 0) {
      skipReasons.noPrices++;
      continue;
    }

    // Extract trading signal data
    const ticker = extractTicker(event.question + \" \" + (event.description || \"\"));\n    const priceTarget = extractPriceTarget(event.question + \" \" + (event.description || \"\"));\n    const category = categorizeEvent(event.question, event.description || \"\");\n    const signal = determineSignal(event.question, prob);\n    const timeframe = year ? `${year}` : undefined;\n\n    // Only include finance-related predictions\n    if (category === \"Other\") {\n      skipReasons.noYear++; // Reuse this counter for non-finance events\n      continue;\n    }\n\n    predictions.push({\n      event: event.question,\n      prob: prob,\n      category,\n      confidence: getConfidence(prob),\n      source: \"polymarket\",\n      ticker,\n      priceTarget,\n      timeframe,\n      signal,\n    });\n  }\n\n  // Debug output\n  console.log(\"\\n🔍 Filtering breakdown:\");\n  console.log(`   ❌ No title: ${skipReasons.noTitle}`);\n  console.log(`   ❌ Low volume (<$5k): ${skipReasons.lowVolume}`);\n  console.log(`   ❌ Non-finance markets: ${skipReasons.noYear}`);\n  console.log(`   ❌ No prices: ${skipReasons.noPrices}`);\n  console.log(`   ❌ Invalid probability: ${skipReasons.invalidProb}`);

  // Sample some events for debugging
  if (events.length > 0 && predictions.length === 0) {
    console.log("\n📋 Sample event for debugging:");
    const sample = events[0];
    console.log(`   Question: "${sample.question}"`);
    console.log(
      `   Volume: $${parseFloat(sample.volume || "0").toLocaleString()}`
    );
    console.log(`   Prices: ${JSON.stringify(sample.outcomePrices)}`);
    console.log(`   Tokens: ${JSON.stringify(sample.tokens)}`);
    console.log(
      `   Description: "${sample.description?.substring(0, 100)}..."`
    );
  }

  return predictions;
}

/**
 * Group predictions by year
 */
function groupByYear(predictions: PredictionEvent[]): TimelineData {
  const timeline: TimelineData = {};

  for (const prediction of predictions) {
    // Re-extract year from event text
    const year = extractYear(prediction.event);
    if (!year) continue;

    const yearKey = year.toString();
    if (!timeline[yearKey]) {
      timeline[yearKey] = [];
    }

    timeline[yearKey].push(prediction);
  }

  // Sort events within each year by probability (descending)
  for (const year of Object.keys(timeline)) {
    timeline[year].sort((a, b) => b.prob - a.prob);
  }

  return timeline;
}

/**
 * Main function to fetch and aggregate future timeline data
 */
export async function getFutureTimeline(): Promise<TimelineData> {
  console.log("🔮 Fetching prediction market data...");

  // Fetch from Polymarket
  const polymarketEvents = await fetchPolymarketEvents();

  console.log(`📊 Fetched ${polymarketEvents.length} Polymarket events`);

  // Process events
  const predictions = processPolymarketEvents(polymarketEvents);

  console.log(`✅ Processed ${predictions.length} Polymarket predictions`);

  // Group by year
  const timeline = groupByYear(predictions);

  console.log(
    `📅 Generated timeline for years: ${Object.keys(timeline)
      .sort()
      .join(", ")}`
  );

  return timeline;
}

/**
 * Generate predictions.json file
 */
export async function generatePredictionsFile(): Promise<void> {
  const timeline = await getFutureTimeline();

  // Write to file (Node.js environment)
  if (typeof window === "undefined") {
    const fs = await import("fs");
    const path = await import("path");

    const outputPath = path.join(process.cwd(), "predictions.json");
    fs.writeFileSync(outputPath, JSON.stringify(timeline, null, 2));

    console.log(`✅ Generated ${outputPath}`);
  }
}

// CLI execution
if (require.main === module) {
  generatePredictionsFile().catch(console.error);
}
