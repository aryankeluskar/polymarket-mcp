# Polymarket MCP Server

[![smithery badge](https://smithery.ai/badge/@aryankeluskar/polymarket-mcp)](https://smithery.ai/server/@aryankeluskar/polymarket-mcp)

A comprehensive Model Context Protocol (MCP) server for accessing Polymarket's prediction markets through Claude AI. Build market analysis tools, trading assistants, event outcome analyzers, and educational platforms that make prediction markets more accessible.

Built with [Smithery SDK](https://smithery.ai/docs) | Powered by [Polymarket API](https://docs.polymarket.com)

## Features

- **Market Discovery**: Search and filter prediction markets by tags, volume, liquidity, and more
- **Event Analysis**: Access grouped markets and event clusters (e.g., elections, sports, economics)
- **Trading Data**: View recent trades, analyze trading patterns and market sentiment
- **Comprehensive Analysis**: Get AI-friendly insights with probabilities, volume, liquidity, and market health
- **Public Access**: No authentication required - uses Polymarket's public APIs
- **Real-time Data**: Access to both Gamma Markets API and Data API

<img width="1572" height="1754" alt="image" src="https://github.com/user-attachments/assets/271d4d9d-2fc7-44d4-b591-65f051d35b98" />


## Tools Included

### 1. `search_markets`
Search Polymarket prediction markets with advanced filtering:
- Filter by tags, volume, liquidity, closed status
- Order by any field (volume, liquidity, etc.)
- Pagination support

**Example**: "Show me the top 5 most active political markets"

### 2. `get_market`
Get detailed information about a specific market by slug:
- Current probabilities for all outcomes
- Volume (24h and total), liquidity
- Market status and end date
- Full market metadata

**Example**: "Analyze the market for trump-popular-vote-2024"

### 3. `search_events`
Search Polymarket events (collections of related markets):
- Filter by tags, featured status, closed status
- See all markets within an event
- Event-level volume and liquidity

**Example**: "Find all active sports events"

### 4. `get_event`
Get detailed information about a specific event:
- All markets within the event
- Event-level statistics
- Market probabilities and slugs

**Example**: "Show me all markets in the presidential-election-2024 event"

### 5. `list_tags`
List all available tags/categories:
- Discover market categories (Politics, Sports, Crypto, etc.)
- Get tag IDs for filtering
- Browse market taxonomy

**Example**: "What categories of markets are available?"

### 6. `get_trades`
Get recent trade activity from Data API:
- Filter by market, event, or trade side (BUY/SELL)
- Analyze trading patterns
- View buy/sell ratio and volume

**Example**: "Show me the last 20 trades for a specific market"

### 7. `analyze_market`
Comprehensive market analysis combining multiple data sources:
- Probability analysis with sentiment indicators
- Market health scoring (liquidity & activity levels)
- Optional trade data integration
- AI-friendly insights for decision-making

**Example**: "Give me a full analysis of trump-wins-2024"

## Prompts Included

Prompts provide guided workflows for common use cases:

### 1. `analyze_market`
Get comprehensive analysis of a specific market by slug.
- **Args**: `market_slug` (e.g., "trump-wins-2024")
- **Use**: Provides probabilities, trading activity, market health, and sentiment analysis

### 2. `find_trending`
Discover the most active prediction markets.
- **Args**: `category` (optional, e.g., "politics", "sports")
- **Use**: Shows top 10 high-volume markets with analysis

### 3. `compare_event`
Analyze and compare all markets within an event.
- **Args**: `event_slug` (e.g., "presidential-election-2024")
- **Use**: Compares related markets and identifies patterns

### 4. `market_discovery`
Explore markets in a specific category.
- **Args**: `category` (e.g., "crypto", "economics")
- **Use**: Discovers markets with strong consensus or divided opinion

## Resources Exposed

Resources provide direct access to curated market data:

### 1. `polymarket://trending`
Currently trending markets with high volume and activity (top 20 by 24h volume)

### 2. `polymarket://categories`
All available tags/categories for filtering markets (up to 100 tags)

### 3. `polymarket://featured`
Featured events with multiple related markets (top 10 featured events)

## Use Cases

### Market Analysis Tools
```
"Analyze the top 10 political markets by volume and identify
which have the strongest consensus vs divided opinion"
```

### Trading Assistant
```
"Find high-liquidity markets with recent trading activity above
$100k volume and show me the buy/sell ratios"
```

### Event Outcome Analyzer
```
"Track all markets related to the 2024 election and summarize
the current probabilities for each outcome"
```

### Educational Platform
```
"Explain how prediction markets work using current Polymarket
data and show examples of different market types"
```

### Trend Detection
```
"Compare trading activity across sports markets today vs
yesterday and identify any unusual patterns"
```

## API Endpoints Used

- **Gamma Markets API**: `https://gamma-api.polymarket.com`
  - `/markets` - Market search and discovery
  - `/markets/slug/{slug}` - Individual market data
  - `/events` - Event search
  - `/events/slug/{slug}` - Individual event data
  - `/tags` - Category taxonomy

- **Data API**: `https://data-api.polymarket.com`
  - `/trades` - Trade history and activity

## Prerequisites

- **Smithery API key**: Get yours at [smithery.ai/account/api-keys](https://smithery.ai/account/api-keys)
- **Node.js** 18+
- No Polymarket authentication required (public read-only access)

## Getting Started

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. The server will be available in the Smithery playground. Try:
   - "Show me the most active prediction markets"
   - "Analyze the market for trump-wins-2024"
   - "What trading categories are available?"

### Building

```bash
npm run build
```

Creates bundled server in `.smithery/` directory.

## Deployment to Smithery

Deploy your Polymarket MCP server to Smithery for global access:

1. **Create a new GitHub repository** at [github.com/new](https://github.com/new)

2. **Initialize git and push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Add Polymarket MCP server"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. **Deploy to Smithery** at [smithery.ai/new](https://smithery.ai/new):
   - Connect your GitHub repository
   - Smithery will auto-detect the configuration
   - Click "Deploy"

4. **Use in Claude**: Once deployed, the server will be available to use with Claude AI through the Smithery platform.

## Project Structure

```
polymarket-mcp/
├── src/
│   └── index.ts          # Main server implementation
├── package.json          # Dependencies and scripts
├── smithery.yaml         # Runtime specification
├── README.md             # This file
└── .smithery/            # Build output (generated)
```

## Development

The server is organized into:

### Type Definitions
- `Market`, `Event`, `Tag`, `Trade` interfaces matching Polymarket API responses

### API Client (`PolymarketClient`)
- `searchMarkets()` - Query markets with filters
- `getMarket()` - Fetch single market by slug
- `searchEvents()` - Query events with filters
- `getEvent()` - Fetch single event by slug
- `listTags()` - List all categories
- `getTrades()` - Fetch recent trades

### Utility Functions
- `formatMarketAnalysis()` - Format market data for Claude
- `formatTradesSummary()` - Summarize trading activity

### MCP Tools
- 7 tools with comprehensive schemas, error handling, and annotations
- All tools are annotated as read-only, non-destructive, and idempotent
- 4 prompts for common workflows (market analysis, trending, comparison, discovery)
- 3 resources exposing curated data (trending markets, categories, featured events)

## Example Conversations

### Political Market Analysis
```
User: "What's the current probability for Trump winning the 2024 election?"
Claude: [Uses get_market or search_markets to find relevant market]
        "Based on Polymarket data, the current probability is 52.3%..."
```

### Market Discovery
```
User: "Find prediction markets related to cryptocurrency"
Claude: [Uses list_tags to find crypto tag ID, then search_markets]
        "Found 23 active cryptocurrency markets. Here are the top 5..."
```

### Trading Pattern Analysis
```
User: "Analyze recent trading activity for election markets"
Claude: [Uses search_markets + get_trades to combine data]
        "Recent trading shows 67% buy orders vs 33% sell orders..."
```

## Rate Limits

Polymarket's public APIs have generous rate limits:
- ~1,000 requests/hour for Gamma API
- No authentication required
- Consider implementing caching for production use

## Error Handling

The server includes comprehensive error handling:
- API errors are caught and returned with descriptive messages
- 404 errors for missing markets/events
- Network errors handled gracefully
- Invalid parameters validated via Zod schemas

## Contributing

Contributions are welcome! Some ideas:
- Add caching layer for frequently accessed markets
- Implement WebSocket support for real-time updates
- Add more analytical tools (correlation, trend detection)
- Create market comparison tools
- Add support for historical data analysis

## Learn More

- [Smithery Documentation](https://smithery.ai/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Polymarket API Documentation](https://docs.polymarket.com)
- [Polymarket Platform](https://polymarket.com)

## License

ISC

## Acknowledgments

Built with the Model Context Protocol by Anthropic and deployed via Smithery.