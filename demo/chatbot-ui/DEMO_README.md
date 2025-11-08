# Polymarket MCP Demo - Complete Tutorial

> A comprehensive demo showing how to build AI-powered prediction market analysis tools using Claude AI and the Polymarket MCP server.

This demo demonstrates how to leverage Polymarket's prediction markets with Claude AI to build:
- 📊 Market analysis tools
- 💹 Trading assistants
- 🎯 Event outcome analyzers
- 📚 Educational platforms

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐         ┌────────────────────┐
│   React Frontend    │ ◄─────► │  Node.js Backend     │ ◄─────► │  Polymarket MCP    │
│   (Chat UI)         │   WS    │  (MCP Client +       │  HTTP   │    (Smithery)      │
│   Port 5173         │         │   Claude AI)         │         │                    │
│                     │         │  Port 8090           │         │                    │
└─────────────────────┘         └──────────────────────┘         └────────────────────┘
```

## What You'll Learn

1. **MCP Integration**: How to connect to MCP servers from a Node.js backend
2. **Claude AI Tool Use**: How to enable Claude to call MCP tools automatically
3. **Real-time Streaming**: WebSocket implementation for streaming AI responses
4. **Polymarket Data**: Working with prediction market data and probabilities
5. **Full-Stack AI Apps**: Building complete applications with AI capabilities

## Prerequisites

- [Bun](https://bun.sh/) installed
- [Anthropic API key](https://console.anthropic.com/settings/keys)
- Basic knowledge of TypeScript and React

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
bun install

# Create environment file
cp .env.example .env

# Add your Anthropic API key to .env
echo "ANTHROPIC_API_KEY=your_key_here" >> .env

# Start the backend
bun run dev
```

The backend will start on `http://localhost:8090`.

### 2. Frontend Setup

In a new terminal:

```bash
cd .. # back to chatbot-ui root

# Install dependencies (if not already done)
bun install

# Start the frontend
bun run dev
```

The frontend will start on `http://localhost:5173`.

### 3. Try It Out!

Open your browser to `http://localhost:5173` and try these queries:

- "Show me the top 10 trending prediction markets"
- "Analyze the market for trump-wins-2024"
- "Find all active sports prediction markets"
- "What categories of prediction markets are available?"
- "Show me recent trading activity"

## How It Works

### Backend Flow

1. **MCP Connection**: Backend connects to Polymarket MCP server on Smithery
   ```typescript
   const transport = new StreamableHTTPClientTransport(
     new URL("https://server.smithery.ai/@aryankeluskar/polymarket-mcp/mcp")
   );
   await mcpClient.connect(transport);
   ```

2. **Tool Registration**: Backend fetches available tools from MCP server
   ```typescript
   const toolsResponse = await mcpClient.listTools();
   ```

3. **Claude Integration**: Tools are converted to Anthropic format
   ```typescript
   availableTools = toolsResponse.tools.map((tool) => ({
     name: tool.name,
     description: tool.description,
     input_schema: tool.inputSchema,
   }));
   ```

4. **Message Processing**: User messages trigger Claude with tools
   ```typescript
   const response = await anthropic.messages.create({
     model: "claude-haiku-4-5",
     messages,
     tools: availableTools,
   });
   ```

5. **Tool Calling Loop**: Claude decides which tools to call
   ```typescript
   if (response.stop_reason === "tool_use") {
     const toolResult = await mcpClient.callTool({
       name: toolUse.name,
       arguments: toolUse.input,
     });
     // Continue conversation with tool result
   }
   ```

### Frontend Flow

1. **WebSocket Connection**: Frontend connects to backend via WebSocket
2. **User Input**: User types a message and sends it
3. **Streaming Response**: Backend streams words back in real-time
4. **Message Display**: Messages are rendered with markdown support

## Available Polymarket Tools

The MCP server provides these tools (see [MCP Server README](../../README.md) for details):

1. **search_markets** - Search and filter prediction markets
2. **get_market** - Get detailed market information by slug
3. **search_events** - Find event clusters with related markets
4. **get_event** - View all markets within a specific event
5. **list_tags** - Browse market categories
6. **get_trades** - Analyze recent trading activity
7. **analyze_market** - Comprehensive market analysis with AI insights

## Project Structure

```
demo/chatbot-ui/
├── backend/                  # Node.js backend with MCP client
│   ├── src/
│   │   └── index.ts         # Main server implementation
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── src/                      # React frontend
│   ├── pages/
│   │   └── chat/
│   │       └── chat.tsx     # Main chat interface
│   ├── components/
│   │   └── custom/
│   │       ├── message.tsx  # Message display
│   │       ├── chatinput.tsx
│   │       └── header.tsx
│   └── interfaces/
│       └── interfaces.ts    # TypeScript interfaces
├── package.json
└── DEMO_README.md           # This file
```

## Customization Guide

### Adding New Features

#### 1. Add Custom UI Components

Create Polymarket-specific components in `src/components/custom/`:

```typescript
// Example: MarketCard.tsx
export function MarketCard({ market }) {
  return (
    <div className="border rounded-lg p-4">
      <h3>{market.question}</h3>
      <div className="flex justify-between mt-2">
        <span>Probability: {market.probability}%</span>
        <span>Volume: ${market.volume}</span>
      </div>
    </div>
  );
}
```

#### 2. Add Quick Action Buttons

Modify `src/components/custom/overview.tsx` to add preset queries:

```typescript
const quickActions = [
  "Show trending markets",
  "Analyze election markets",
  "Find sports predictions",
];
```

#### 3. Enhance Backend Processing

Modify `backend/src/index.ts` to add custom processing:

```typescript
// Add custom system prompt
system: `You are a prediction market expert...`

// Add response formatting
const formattedResponse = formatMarketData(toolResult);
```

### Styling

The app uses Tailwind CSS. Customize in:
- `tailwind.config.js` - Theme configuration
- `src/index.css` - Global styles
- Component files - Component-specific styles

## Example Use Cases

### Market Analysis Tool

```typescript
User: "Analyze the top 5 political markets by volume"

Claude: [Uses search_markets with filters]
→ [Uses get_market for each to get details]
→ [Uses analyze_market for comprehensive analysis]
→ Presents formatted analysis with probabilities, trends, sentiment
```

### Trading Assistant

```typescript
User: "Find high-liquidity markets with recent trading activity"

Claude: [Uses search_markets with liquidity_min]
→ [Uses get_trades for each market]
→ [Analyzes buy/sell ratios]
→ Recommends markets based on activity
```

### Educational Platform

```typescript
User: "Explain how prediction markets work with real examples"

Claude: [Uses list_tags to show categories]
→ [Uses get_event to show event structure]
→ [Uses get_market to explain probabilities]
→ Provides educational explanation with live data
```

## Troubleshooting

### Backend Issues

**"Failed to connect to MCP server"**
- Check internet connection
- Verify MCP server URL is correct
- Check if Smithery is accessible

**"ANTHROPIC_API_KEY is required"**
- Ensure `.env` file exists in `backend/` directory
- Verify API key is valid
- No spaces around the `=` sign

**WebSocket connection refused**
- Ensure backend is running (`bun run dev`)
- Check port 8090 is not in use
- Verify firewall settings

### Frontend Issues

**"Cannot connect to WebSocket"**
- Ensure backend is running first
- Check console for connection errors
- Verify WebSocket URL matches backend port

**Messages not streaming**
- Check browser console for errors
- Verify WebSocket connection is open
- Check backend logs for errors

### General Issues

**Slow responses**
- First request may be slower (MCP connection setup)
- Check network connection
- Verify API key has sufficient rate limits

**Tools not being called**
- Check backend logs to see if tools were discovered
- Verify MCP server is accessible
- Try restarting the backend

## Performance Tips

1. **Connection Pooling**: The MCP connection is maintained across requests
2. **Caching**: Consider caching frequently requested market data
3. **Rate Limiting**: Implement rate limiting for production use
4. **Error Handling**: Add retry logic for failed MCP calls

## Deployment

### Backend Deployment

Deploy to any Node.js hosting:

```bash
# Build
bun run build

# Deploy dist/ folder to:
# - Railway
# - Render
# - Fly.io
# - Your own server
```

Set environment variables:
- `ANTHROPIC_API_KEY`
- `POLYMARKET_MCP_URL`
- `PORT` (if different from 8090)

### Frontend Deployment

Build and deploy static files:

```bash
bun run build

# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - GitHub Pages
# - Any static host
```

Update WebSocket URL to your deployed backend.

## Next Steps

### Enhancements to Try

1. **Add Visualizations**: Chart market probabilities over time
2. **User Authentication**: Add user accounts and saved queries
3. **Market Alerts**: Notify users of probability changes
4. **Portfolio Tracking**: Track and analyze user positions
5. **Historical Data**: Add time-series analysis
6. **Export Features**: Download market data as CSV/JSON
7. **Mobile App**: Convert to React Native
8. **Voice Interface**: Add speech-to-text input

### Learning Resources

- [MCP Protocol Docs](https://modelcontextprotocol.io)
- [Smithery Documentation](https://smithery.ai/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com)
- [Polymarket API Docs](https://docs.polymarket.com)

## Contributing

This demo is meant to be a starting point. Feel free to:
- Add new features
- Improve the UI
- Enhance error handling
- Add more Polymarket-specific tools
- Create additional visualizations

## License

ISC

## Support

For issues with:
- **This demo**: Open an issue in the repo
- **MCP Server**: See [main README](../../README.md)
- **Polymarket API**: Check [Polymarket docs](https://docs.polymarket.com)
- **Claude API**: Check [Anthropic docs](https://docs.anthropic.com)

---

**Built with**: React + TypeScript + Tailwind CSS + WebSockets + Claude AI + MCP + Polymarket
