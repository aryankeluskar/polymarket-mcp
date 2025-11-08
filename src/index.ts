import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

// ============================================================================
// TYPE DEFINITIONS - Polymarket API Response Types
// ============================================================================

interface Market {
  id: string
  question: string
  conditionId: string
  slug: string
  description?: string
  outcomePrices: string[]
  outcomes: string[]
  volume: string
  liquidity: string
  active: boolean
  closed: boolean
  endDate: string
  startDate?: string
  category?: string
  volume24hr?: string
  bestBid?: string
  bestAsk?: string
  events?: Event[]
  tags?: Tag[]
}

interface Event {
  id: string
  slug: string
  title: string
  description?: string
  startDate?: string
  endDate?: string
  active: boolean
  closed: boolean
  archived: boolean
  liquidity: string
  volume: string
  markets?: Market[]
  tags?: Tag[]
}

interface Tag {
  id: string
  label: string
  slug: string
}

interface Trade {
  id: string
  market: string
  asset: string
  side: "BUY" | "SELL"
  size: string
  price: string
  timestamp: number
  transactionHash: string
  outcome?: string
  marketTitle?: string
}

// ============================================================================
// API CLIENT - Polymarket Gamma & Data API
// ============================================================================

const GAMMA_API_BASE = "https://gamma-api.polymarket.com"
const DATA_API_BASE = "https://data-api.polymarket.com"

class PolymarketClient {
  /**
   * Search for markets with various filters
   */
  async searchMarkets(params: {
    limit?: number
    offset?: number
    closed?: boolean
    tag_id?: number
    liquidity_min?: number
    volume_min?: number
    order?: string
    ascending?: boolean
  }): Promise<Market[]> {
    const queryParams = new URLSearchParams()

    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString())
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString())
    if (params.closed !== undefined) queryParams.append("closed", params.closed.toString())
    if (params.tag_id !== undefined) queryParams.append("tag_id", params.tag_id.toString())
    if (params.liquidity_min !== undefined) queryParams.append("liquidity_num_min", params.liquidity_min.toString())
    if (params.volume_min !== undefined) queryParams.append("volume_num_min", params.volume_min.toString())
    if (params.order) queryParams.append("order", params.order)
    if (params.ascending !== undefined) queryParams.append("ascending", params.ascending.toString())

    const url = `${GAMMA_API_BASE}/markets?${queryParams.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get a specific market by slug
   */
  async getMarket(slug: string): Promise<Market> {
    const url = `${GAMMA_API_BASE}/markets/slug/${slug}`
    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Market not found: ${slug}`)
      }
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Search for events with various filters
   */
  async searchEvents(params: {
    limit?: number
    offset?: number
    closed?: boolean
    tag_id?: number
    featured?: boolean
    order?: string
    ascending?: boolean
  }): Promise<Event[]> {
    const queryParams = new URLSearchParams()

    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString())
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString())
    if (params.closed !== undefined) queryParams.append("closed", params.closed.toString())
    if (params.tag_id !== undefined) queryParams.append("tag_id", params.tag_id.toString())
    if (params.featured !== undefined) queryParams.append("featured", params.featured.toString())
    if (params.order) queryParams.append("order", params.order)
    if (params.ascending !== undefined) queryParams.append("ascending", params.ascending.toString())

    const url = `${GAMMA_API_BASE}/events?${queryParams.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get a specific event by slug
   */
  async getEvent(slug: string): Promise<Event> {
    const url = `${GAMMA_API_BASE}/events/slug/${slug}`
    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Event not found: ${slug}`)
      }
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * List all available tags for categorization
   */
  async listTags(params?: {
    limit?: number
    offset?: number
  }): Promise<Tag[]> {
    const queryParams = new URLSearchParams()

    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString())
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString())

    const url = `${GAMMA_API_BASE}/tags?${queryParams.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get recent trades from the Data API
   */
  async getTrades(params: {
    limit?: number
    offset?: number
    market?: string
    eventId?: string
    side?: "BUY" | "SELL"
  }): Promise<Trade[]> {
    const queryParams = new URLSearchParams()

    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString())
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString())
    if (params.market) queryParams.append("market", params.market)
    if (params.eventId) queryParams.append("eventId", params.eventId)
    if (params.side) queryParams.append("side", params.side)

    const url = `${DATA_API_BASE}/trades?${queryParams.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Polymarket Data API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format a market for Claude-friendly analysis
 */
function formatMarketAnalysis(market: Market): string {
  const probability = market.outcomePrices[0] ? (parseFloat(market.outcomePrices[0]) * 100).toFixed(1) : "N/A"
  const volume24h = market.volume24hr ? `$${(parseFloat(market.volume24hr) / 1000).toFixed(1)}k` : "N/A"

  let analysis = `📊 **${market.question}**\n\n`
  analysis += `**Current Probability:** ${probability}% (${market.outcomes[0] || 'Yes'})\n`
  analysis += `**Status:** ${market.closed ? '🔴 Closed' : market.active ? '🟢 Active' : '⚪ Inactive'}\n`
  analysis += `**Volume (24h):** ${volume24h}\n`
  analysis += `**Total Volume:** $${(parseFloat(market.volume) / 1000).toFixed(1)}k\n`
  analysis += `**Liquidity:** $${(parseFloat(market.liquidity) / 1000).toFixed(1)}k\n`

  if (market.endDate) {
    analysis += `**End Date:** ${new Date(market.endDate).toLocaleDateString()}\n`
  }

  if (market.outcomes && market.outcomePrices && market.outcomes.length === market.outcomePrices.length) {
    analysis += `\n**Outcomes & Prices:**\n`
    market.outcomes.forEach((outcome, i) => {
      const price = (parseFloat(market.outcomePrices[i]) * 100).toFixed(1)
      analysis += `  • ${outcome}: ${price}%\n`
    })
  }

  return analysis
}

/**
 * Format trades for analysis
 */
function formatTradesSummary(trades: Trade[]): string {
  const buyTrades = trades.filter(t => t.side === "BUY").length
  const sellTrades = trades.filter(t => t.side === "SELL").length
  const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.size || "0"), 0)

  let summary = `📈 **Recent Trading Activity**\n\n`
  summary += `**Total Trades:** ${trades.length}\n`
  summary += `**Buy Orders:** ${buyTrades} (${((buyTrades / trades.length) * 100).toFixed(1)}%)\n`
  summary += `**Sell Orders:** ${sellTrades} (${((sellTrades / trades.length) * 100).toFixed(1)}%)\n`
  summary += `**Total Volume:** ${totalVolume.toFixed(2)} shares\n`

  if (trades.length > 0) {
    const latestTrade = trades[0]
    summary += `\n**Latest Trade:**\n`
    summary += `  • Side: ${latestTrade.side}\n`
    summary += `  • Price: $${latestTrade.price}\n`
    summary += `  • Size: ${latestTrade.size} shares\n`
    summary += `  • Time: ${new Date(latestTrade.timestamp * 1000).toLocaleString()}\n`
  }

  return summary
}

// ============================================================================
// MCP SERVER CONFIGURATION
// ============================================================================

export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
})

export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>
}) {
  const server = new McpServer({
    name: "Polymarket",
    version: "1.0.0",
  })

  const client = new PolymarketClient()

  // ==========================================================================
  // TOOL: search_markets
  // ==========================================================================
  server.registerTool(
    "search_markets",
    {
      title: "Search Markets",
      description: "Search Polymarket prediction markets with filters. Find active markets, filter by tags, volume, liquidity, and more. Perfect for market discovery and analysis.",
      inputSchema: {
        limit: z.number().optional().default(10).describe("Number of results (max 100)"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        closed: z.boolean().optional().describe("Filter by closed status (false = only active markets)"),
        tag_id: z.number().optional().describe("Filter by tag ID (use list_tags to discover)"),
        liquidity_min: z.number().optional().describe("Minimum liquidity in USD"),
        volume_min: z.number().optional().describe("Minimum volume in USD"),
        order: z.string().optional().describe("Field to order by (e.g., 'volume', 'liquidity')"),
        ascending: z.boolean().optional().describe("Sort direction (true = ascending, false = descending)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (params) => {
      try {
        const markets = await client.searchMarkets(params)

        let response = `Found ${markets.length} markets:\n\n`

        markets.forEach((market, idx) => {
          const prob = market.outcomePrices[0] ? (parseFloat(market.outcomePrices[0]) * 100).toFixed(1) : "N/A"
          response += `${idx + 1}. **${market.question}**\n`
          response += `   Slug: \`${market.slug}\`\n`
          response += `   Probability: ${prob}% | Volume: $${(parseFloat(market.volume) / 1000).toFixed(1)}k\n`
          response += `   Status: ${market.closed ? 'Closed' : market.active ? 'Active' : 'Inactive'}\n\n`
        })

        response += `\n💡 Use \`get_market\` with a slug for detailed analysis.`

        return {
          content: [{ type: "text", text: response }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        }
      }
    }
  )

  // ==========================================================================
  // TOOL: get_market
  // ==========================================================================
  server.registerTool(
    "get_market",
    {
      title: "Get Market Details",
      description: "Get detailed information about a specific market by slug. Returns probabilities, volume, liquidity, outcomes, and full market data.",
      inputSchema: {
        slug: z.string().describe("Market slug (from URL or search results)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ slug }) => {
      try {
        const market = await client.getMarket(slug)
        const analysis = formatMarketAnalysis(market)

        let response = analysis

        if (market.description) {
          response += `\n**Description:** ${market.description}\n`
        }

        if (market.tags && market.tags.length > 0) {
          response += `\n**Tags:** ${market.tags.map(t => t.label).join(', ')}\n`
        }

        response += `\n**Market Slug:** \`${market.slug}\``
        response += `\n**Condition ID:** \`${market.conditionId}\``

        return {
          content: [{ type: "text", text: response }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        }
      }
    }
  )

  // ==========================================================================
  // TOOL: search_events
  // ==========================================================================
  server.registerTool(
    "search_events",
    {
      title: "Search Events",
      description: "Search Polymarket events. Events group related markets together (e.g., 'Presidential Election 2024' contains multiple markets). Great for discovering market clusters.",
      inputSchema: {
        limit: z.number().optional().default(10).describe("Number of results (max 100)"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        closed: z.boolean().optional().describe("Filter by closed status"),
        tag_id: z.number().optional().describe("Filter by tag ID"),
        featured: z.boolean().optional().describe("Show only featured events"),
        order: z.string().optional().describe("Field to order by"),
        ascending: z.boolean().optional().describe("Sort direction"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (params) => {
      try {
        const events = await client.searchEvents(params)

        let response = `Found ${events.length} events:\n\n`

        events.forEach((event, idx) => {
          response += `${idx + 1}. **${event.title}**\n`
          response += `   Slug: \`${event.slug}\`\n`
          response += `   Markets: ${event.markets?.length || 0}\n`
          response += `   Volume: $${(parseFloat(event.volume) / 1000).toFixed(1)}k\n`
          response += `   Status: ${event.closed ? 'Closed' : event.active ? 'Active' : 'Inactive'}\n\n`
        })

        response += `\n💡 Use \`get_event\` with a slug for detailed event info.`

        return {
          content: [{ type: "text", text: response }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        }
      }
    }
  )

  // ==========================================================================
  // TOOL: get_event
  // ==========================================================================
  server.registerTool(
    "get_event",
    {
      title: "Get Event Details",
      description: "Get detailed information about a specific event by slug, including all related markets.",
      inputSchema: {
        slug: z.string().describe("Event slug (from URL or search results)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ slug }) => {
      try {
        const event = await client.getEvent(slug)

        let response = `🎯 **${event.title}**\n\n`

        if (event.description) {
          response += `**Description:** ${event.description}\n\n`
        }

        response += `**Status:** ${event.closed ? '🔴 Closed' : event.active ? '🟢 Active' : '⚪ Inactive'}\n`
        response += `**Total Volume:** $${(parseFloat(event.volume) / 1000).toFixed(1)}k\n`
        response += `**Liquidity:** $${(parseFloat(event.liquidity) / 1000).toFixed(1)}k\n`

        if (event.endDate) {
          response += `**End Date:** ${new Date(event.endDate).toLocaleDateString()}\n`
        }

        if (event.markets && event.markets.length > 0) {
          response += `\n**Markets (${event.markets.length}):**\n\n`
          event.markets.forEach((market, idx) => {
            const prob = market.outcomePrices[0] ? (parseFloat(market.outcomePrices[0]) * 100).toFixed(1) : "N/A"
            response += `${idx + 1}. ${market.question}\n`
            response += `   Probability: ${prob}% | Slug: \`${market.slug}\`\n\n`
          })
        }

        if (event.tags && event.tags.length > 0) {
          response += `**Tags:** ${event.tags.map(t => t.label).join(', ')}\n`
        }

        return {
          content: [{ type: "text", text: response }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        }
      }
    }
  )

  // ==========================================================================
  // TOOL: list_tags
  // ==========================================================================
  server.registerTool(
    "list_tags",
    {
      title: "List Tags",
      description: "List all available tags/categories for filtering markets and events. Use tag IDs with search_markets or search_events.",
      inputSchema: {
        limit: z.number().optional().default(50).describe("Number of tags to return"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (params) => {
      try {
        const tags = await client.listTags(params)

        let response = `📑 **Available Tags (${tags.length}):**\n\n`

        tags.forEach((tag, idx) => {
          response += `${idx + 1}. **${tag.label}** (ID: ${tag.id})\n`
          response += `   Slug: \`${tag.slug}\`\n\n`
        })

        response += `💡 Use the tag ID with \`search_markets\` or \`search_events\` to filter by category.`

        return {
          content: [{ type: "text", text: response }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        }
      }
    }
  )

  // ==========================================================================
  // TOOL: get_trades
  // ==========================================================================
  server.registerTool(
    "get_trades",
    {
      title: "Get Recent Trades",
      description: "Get recent trade activity from Polymarket's Data API. Analyze trading patterns, volume, and market sentiment.",
      inputSchema: {
        limit: z.number().optional().default(20).describe("Number of trades to fetch (max 100)"),
        offset: z.number().optional().default(0).describe("Pagination offset"),
        market: z.string().optional().describe("Filter by market condition ID"),
        eventId: z.string().optional().describe("Filter by event ID"),
        side: z.enum(["BUY", "SELL"]).optional().describe("Filter by trade side"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (params) => {
      try {
        const trades = await client.getTrades(params)

        if (trades.length === 0) {
          return {
            content: [{ type: "text", text: "No trades found matching the criteria." }],
          }
        }

        const summary = formatTradesSummary(trades)

        let response = summary

        response += `\n\n**Recent Trades:**\n`
        trades.slice(0, 10).forEach((trade, idx) => {
          response += `\n${idx + 1}. ${trade.side === "BUY" ? "🟢 BUY" : "🔴 SELL"} ${trade.size} @ $${trade.price}\n`
          if (trade.marketTitle) {
            response += `   Market: ${trade.marketTitle}\n`
          }
          response += `   Time: ${new Date(trade.timestamp * 1000).toLocaleString()}\n`
        })

        return {
          content: [{ type: "text", text: response }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        }
      }
    }
  )

  // ==========================================================================
  // TOOL: analyze_market
  // ==========================================================================
  server.registerTool(
    "analyze_market",
    {
      title: "Analyze Market",
      description: "Get comprehensive market analysis including probabilities, trading activity, and AI-friendly insights. Combines market data with recent trades.",
      inputSchema: {
        slug: z.string().describe("Market slug to analyze"),
        include_trades: z.boolean().optional().default(true).describe("Include recent trading activity"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ slug, include_trades }) => {
      try {
        const market = await client.getMarket(slug)
        let response = formatMarketAnalysis(market)

        // Add detailed outcome analysis
        if (market.outcomes && market.outcomePrices) {
          response += `\n\n**📊 Probability Analysis:**\n`
          const prices = market.outcomePrices.map(p => parseFloat(p) * 100)
          const maxProb = Math.max(...prices)
          const minProb = Math.min(...prices)

          response += `• Highest: ${maxProb.toFixed(1)}%\n`
          response += `• Lowest: ${minProb.toFixed(1)}%\n`
          response += `• Spread: ${(maxProb - minProb).toFixed(1)}%\n`

          if (maxProb > 75) {
            response += `\n🎯 **Market Sentiment:** Strong consensus (${maxProb.toFixed(1)}% probability)\n`
          } else if (maxProb < 60) {
            response += `\n⚖️ **Market Sentiment:** Uncertain / Divided opinion\n`
          } else {
            response += `\n📈 **Market Sentiment:** Moderate confidence\n`
          }
        }

        // Include trading activity if requested
        if (include_trades && market.conditionId) {
          try {
            const trades = await client.getTrades({ market: market.conditionId, limit: 20 })
            if (trades.length > 0) {
              response += `\n\n${formatTradesSummary(trades)}`
            }
          } catch (e) {
            // Silently fail if trades not available
          }
        }

        // Add market health indicators
        const liquidityNum = parseFloat(market.liquidity)
        const volumeNum = parseFloat(market.volume)

        response += `\n\n**💡 Market Health:**\n`
        if (liquidityNum > 100000) {
          response += `• Liquidity: 🟢 High (Easy to trade)\n`
        } else if (liquidityNum > 10000) {
          response += `• Liquidity: 🟡 Moderate\n`
        } else {
          response += `• Liquidity: 🔴 Low (May have slippage)\n`
        }

        if (volumeNum > 500000) {
          response += `• Activity: 🟢 Very Active\n`
        } else if (volumeNum > 50000) {
          response += `• Activity: 🟡 Moderate\n`
        } else {
          response += `• Activity: 🔴 Low Volume\n`
        }

        return {
          content: [{ type: "text", text: response }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        }
      }
    }
  )

  // ==========================================================================
  // PROMPTS - Common use cases
  // ==========================================================================

  server.registerPrompt(
    "analyze_market",
    {
      title: "Analyze Specific Market",
      description: "Get comprehensive analysis of a specific Polymarket prediction market",
      argsSchema: {
        market_slug: z.string().describe("The market slug (e.g., trump-wins-2024)"),
      },
    },
    async ({ market_slug }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please analyze the Polymarket prediction market "${market_slug}". Use the analyze_market tool to get comprehensive data including probabilities, trading activity, market health, and sentiment. Provide insights on what the market is predicting and how confident traders are.`,
            },
          },
        ],
      }
    }
  )

  server.registerPrompt(
    "find_trending",
    {
      title: "Find Trending Markets",
      description: "Discover the most active and high-volume prediction markets",
      argsSchema: {
        category: z.string().optional().describe("Optional category/tag to filter by (e.g., politics, sports, crypto)"),
      },
    },
    async ({ category }) => {
      const categoryText = category ? ` in the ${category} category` : ""
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Find the most active and trending prediction markets${categoryText}. Use search_markets with appropriate filters to find high-volume, high-liquidity markets that are currently active. Order by volume and show me the top 10. For each market, provide the current probability, volume, and a brief analysis of what it's predicting.`,
            },
          },
        ],
      }
    }
  )

  server.registerPrompt(
    "compare_event",
    {
      title: "Compare Markets in Event",
      description: "Analyze and compare all markets within a specific event",
      argsSchema: {
        event_slug: z.string().describe("The event slug (e.g., presidential-election-2024)"),
      },
    },
    async ({ event_slug }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Analyze the Polymarket event "${event_slug}" and compare all markets within it. Use get_event to retrieve the event and all its markets. For each market, show the current probabilities and trading volume. Identify any interesting patterns or contradictions between related markets. Summarize the overall prediction for this event.`,
            },
          },
        ],
      }
    }
  )

  server.registerPrompt(
    "market_discovery",
    {
      title: "Discover Markets by Category",
      description: "Explore prediction markets in a specific category or topic",
      argsSchema: {
        category: z.string().describe("Category or topic to explore (e.g., politics, sports, crypto, economics)"),
      },
    },
    async ({ category }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Help me discover prediction markets related to "${category}". First, use list_tags to find relevant category tags. Then use search_markets with the appropriate tag_id to find active markets in this category. Show me the most interesting markets with their current probabilities, volume, and what they're predicting. Highlight any markets with strong consensus (>75% probability) or divided opinion (<60% probability).`,
            },
          },
        ],
      }
    }
  )

  // ==========================================================================
  // RESOURCES - Expose useful market data
  // ==========================================================================

  server.registerResource(
    "trending-markets",
    "polymarket://trending",
    {
      title: "Trending Markets",
      description: "Currently trending prediction markets with high volume and activity",
      mimeType: "application/json",
    },
    async () => {
      try {
        const markets = await client.searchMarkets({
          limit: 20,
          closed: false,
          order: "volume24hr",
          ascending: false,
        })

        return {
          contents: [
            {
              uri: "polymarket://trending",
              mimeType: "application/json",
              text: JSON.stringify(markets, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          contents: [
            {
              uri: "polymarket://trending",
              mimeType: "text/plain",
              text: `Error fetching trending markets: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        }
      }
    }
  )

  server.registerResource(
    "market-categories",
    "polymarket://categories",
    {
      title: "Market Categories",
      description: "All available categories/tags for filtering Polymarket prediction markets",
      mimeType: "application/json",
    },
    async () => {
      try {
        const tags = await client.listTags({ limit: 100 })

        return {
          contents: [
            {
              uri: "polymarket://categories",
              mimeType: "application/json",
              text: JSON.stringify(tags, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          contents: [
            {
              uri: "polymarket://categories",
              mimeType: "text/plain",
              text: `Error fetching categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        }
      }
    }
  )

  server.registerResource(
    "featured-events",
    "polymarket://featured",
    {
      title: "Featured Events",
      description: "Featured prediction market events with multiple related markets",
      mimeType: "application/json",
    },
    async () => {
      try {
        const events = await client.searchEvents({
          limit: 10,
          featured: true,
          closed: false,
        })

        return {
          contents: [
            {
              uri: "polymarket://featured",
              mimeType: "application/json",
              text: JSON.stringify(events, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          contents: [
            {
              uri: "polymarket://featured",
              mimeType: "text/plain",
              text: `Error fetching featured events: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        }
      }
    }
  )

  return server.server
}
