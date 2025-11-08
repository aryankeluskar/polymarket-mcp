# Polymarket MCP Chat Template

Build AI-powered prediction market applications with Claude AI and Polymarket's real-time market data. This template demonstrates how to create market analysis tools, trading assistants, event outcome analyzers, and educational platforms that make prediction markets more accessible.

## What You Can Build

This template shows you how to leverage Polymarket's prediction markets with Claude AI to build:

- **Market Analysis Tools**: Real-time analysis of prediction market trends, volume patterns, and probability shifts
- **Trading Assistants**: AI-powered tools that help users discover relevant markets, compare outcomes, and analyze trading opportunities
- **Event Outcome Analyzers**: Track and analyze real-world events through the lens of prediction markets
- **Educational Platforms**: Make prediction markets accessible and understandable for newcomers
- **Custom Research Tools**: Query market data, analyze trends, and discover insights across thousands of prediction markets

## How It Works

This template integrates three powerful components:

1. **Polymarket MCP Server** (via Smithery): Provides Claude with real-time access to Polymarket's prediction markets, including market search, event tracking, trade data, and trend analysis
2. **Claude AI** (Anthropic): Powers intelligent conversations and tool use for market analysis
3. **Chat Interface**: A clean, modern UI for interacting with your AI-powered market tools

The architecture uses the Model Context Protocol (MCP) to connect Claude to Polymarket's APIs, enabling Claude to search markets, analyze events, track trends, and answer questions about prediction markets in real-time.

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed on your machine
- [Anthropic API key](https://console.anthropic.com/)
- [Smithery account](https://smithery.ai) (free, for MCP server OAuth)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd demo/chatbot-ui

# Install frontend dependencies
cd frontend
bun install

# Install backend dependencies
cd ../backend
bun install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your API keys:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
POLYMARKET_MCP_URL=https://server.smithery.ai/@aryankeluskar/polymarket-mcp/mcp
PORT=3001
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
bun run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
bun run dev
```

The application will open at `http://localhost:5173`

### 4. Complete OAuth Authentication (First Time Only)

On first run, you'll need to authenticate with Smithery:

1. The backend will print an OAuth URL to the console
2. Open the URL in your browser and click "Approve"
3. You'll be redirected back, and the token will be saved
4. The server will automatically reconnect with authentication

After the first time, tokens are saved to `.oauth-tokens.json` and authentication is automatic.

## Try These Example Queries

Once running, try asking Claude:

- "What are the trending markets right now?"
- "Show me prediction markets about the 2024 US election"
- "What's the current probability for [specific event]?"
- "Find markets with high trading volume in the last 24 hours"
- "Compare the odds between [outcome A] and [outcome B]"
- "Analyze the most popular markets in politics"

## Architecture Overview

### Backend (`/backend`)

The Node.js backend connects Claude AI to the Polymarket MCP server:

**Key Files:**
- `src/index.ts`: Main server with Claude integration and tool calling loop
- `src/oauth-provider.ts`: Handles OAuth authentication with Smithery
- `package.json`: Dependencies and scripts

**How It Works:**
1. Connects to Polymarket MCP server using OAuth
2. Discovers available tools (search_markets, get_market, analyze_market, etc.)
3. Receives user messages via WebSocket
4. Sends messages to Claude with MCP tools available
5. Handles tool calling loop when Claude needs market data
6. Streams responses back to the frontend

### Frontend (`/frontend`)

A React + TypeScript chat interface with WebSocket connection:

**Key Files:**
- `src/App.tsx`: Main chat component
- `src/components/`: Reusable UI components
- `src/hooks/`: WebSocket connection logic

### MCP Server Integration

The template uses the **Polymarket MCP Server** which provides 7 powerful tools:

| Tool | Description |
|------|-------------|
| `search_markets` | Search for markets by text query with filters |
| `get_market` | Get detailed information about a specific market |
| `search_events` | Search for events containing multiple markets |
| `get_event` | Get detailed event information with all markets |
| `list_tags` | List all available market tags/categories |
| `get_trades` | Get recent trade data for a market |
| `analyze_market` | Analyze market trends, volume, and probability changes |

## Customizing for Your Use Case

### 1. Change the AI Model

Edit `backend/src/index.ts` to use a different Claude model:

```typescript
const response = await anthropic.messages.create({
  model: "claude-opus-4-5", // or "claude-sonnet-4-5", "claude-haiku-4-5"
  max_tokens: 4096,
  messages,
  tools: availableTools,
});
```

### 2. Add Custom System Prompts

Add domain-specific instructions in `backend/src/index.ts:230`:

```typescript
const response = await anthropic.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 4096,
  system: "You are a Polymarket trading assistant. Help users find profitable trading opportunities and analyze market trends with a focus on risk management.",
  messages,
  tools: availableTools,
});
```

### 3. Pre-load Context with MCP Resources

The Polymarket MCP provides resources for trending markets, categories, and featured events:

```typescript
// In backend/src/index.ts, after MCP connection:
const trendingMarkets = await mcpClient.readResource({
  uri: "polymarket://trending"
});

// Add to system prompt or first message
```

### 4. Build Specialized Tools

Example: Create a "Market Alert" system that monitors specific markets:

```typescript
// Add to backend/src/index.ts
async function monitorMarket(marketId: string, threshold: number) {
  const market = await mcpClient.callTool({
    name: "get_market",
    arguments: { market_id: marketId }
  });

  // Check if probability crossed threshold
  // Send notification to user via WebSocket
}
```

### 5. Customize the UI

The frontend is fully customizable:
- Modify `frontend/src/App.tsx` for layout changes
- Update `frontend/src/components/` for UI components
- Add charts/visualizations for market data
- Implement custom formatting for market results

## Example: Building a Market Scanner

Here's how you could modify this template to build a market scanner:

1. **Add a system prompt** that focuses on finding high-volume markets
2. **Pre-load trending markets** using the `polymarket://trending` resource
3. **Add UI filters** in the frontend for market categories
4. **Implement auto-refresh** to periodically check for new markets
5. **Add visualization** using a charting library to show probability changes

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Claude |
| `POLYMARKET_MCP_URL` | Yes | Smithery MCP server URL |
| `PORT` | No | Backend server port (default: 3001) |

## Troubleshooting

### OAuth Authentication Issues

If you see `401 Unauthorized` errors:
1. Delete `.oauth-tokens.json`
2. Restart the backend
3. Complete the OAuth flow again

### WebSocket Connection Failed

- Ensure backend is running on the correct port
- Check that `VITE_WS_URL` in frontend matches backend port
- Verify firewall settings allow WebSocket connections

### Tool Calling Errors

If Claude can't use tools:
- Verify the MCP server URL is correct
- Check that OAuth authentication completed successfully
- Review backend logs for MCP connection errors

## Deployment

### Backend Deployment

The backend can be deployed to any Node.js hosting platform:

```bash
cd backend
bun run build
bun run start
```

Update environment variables on your hosting platform.

### Frontend Deployment

Build and deploy the frontend:

```bash
cd frontend
bun run build
# Deploy the 'dist' folder to your static hosting (Vercel, Netlify, etc.)
```

Update `VITE_WS_URL` to point to your deployed backend.

## Project Structure

```
demo/chatbot-ui/
├── frontend/           # React chat interface
│   ├── src/
│   │   ├── App.tsx    # Main chat component
│   │   ├── components/ # UI components
│   │   └── hooks/     # WebSocket hooks
│   └── package.json
├── backend/           # Node.js server
│   ├── src/
│   │   ├── index.ts         # Main server + Claude integration
│   │   └── oauth-provider.ts # OAuth handling
│   ├── .env                  # Configuration (create this)
│   └── package.json
├── QUICK_START.md    # 5-minute setup guide
└── DEMO_README.md    # Detailed tutorial
```

## Learn More

- [Polymarket MCP Documentation](https://github.com/aryankeluskar/polymarket-mcp)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Smithery MCP Hosting](https://smithery.ai/docs)

## Use Cases Gallery

### Market Analysis Dashboard
Monitor multiple markets simultaneously and get AI-powered insights on probability shifts and volume patterns.

### Event Tracker
Follow real-world events through prediction markets - elections, sports, crypto, tech announcements, and more.

### Trading Assistant
Get help discovering relevant markets, understanding probabilities, and analyzing potential trades.

### Educational Tool
Learn about prediction markets through conversational AI that explains concepts and interprets market data.

## Credits

This template was built using:
- Original chat UI by [Leon Binder](https://github.com/LeonBinder) and [Christoph Handschuh](https://github.com/ChristophHandschuh)
- WebSocket refactoring by [GBG7](https://github.com/GBG7)
- Web search contribution by [CameliaK](https://github.com/CameliaK)
- Some components inspired by [Vercel's AI Chatbot](https://github.com/vercel/ai-chatbot)
- Polymarket MCP integration and backend by Aryan Keluskar

## License

This project is licensed under the Apache License 2.0.
