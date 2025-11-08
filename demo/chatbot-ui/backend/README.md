# Polymarket MCP Demo Backend

Backend server for the Polymarket MCP demo application. Connects to the Polymarket MCP server and provides a WebSocket interface for the frontend chat UI.

## Features

- **MCP Client**: Connects to Polymarket MCP server on Smithery
- **Claude AI Integration**: Uses Anthropic's Claude 3.5 Sonnet for natural language processing
- **Tool Calling**: Automatically calls Polymarket tools based on user queries
- **WebSocket Streaming**: Streams responses back to the frontend in real-time
- **HTTP API**: Provides endpoints for health checks and tool listings

## Prerequisites

- Node.js 18 or higher
- Anthropic API key ([get one here](https://console.anthropic.com/settings/keys))

## Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. **Start the development server**:
   ```bash
   bun run dev
   ```

The server will start on `http://localhost:8090` with WebSocket support.

### OAuth Authentication (First Time Setup)

The first time you run the server, you'll need to authenticate with Smithery to access the Polymarket MCP server:

1. **Start the server**:
   ```bash
   bun run dev
   ```

2. **Look for the OAuth URL** in the console output:
   ```
   🔐 OAUTH AUTHENTICATION REQUIRED
   ================================================================

   Please complete authentication by visiting:

     👉 https://smithery.ai/oauth/authorize?...

   After authorizing, you'll be redirected to:
     http://localhost:8090/oauth/callback
   ```

3. **Open the URL in your browser** and authorize the app

4. **Complete authorization** - You'll be redirected to a success page

5. **Server automatically reconnects** - Check your terminal to see the connection complete

6. **Tokens are saved** - Future runs won't require re-authentication

The OAuth tokens are saved to `.oauth-tokens.json` and will be reused automatically.

## API Endpoints

### Health Check
```
GET /health
```

Returns the server status and MCP connection info:
```json
{
  "status": "ok",
  "mcpConnected": true,
  "toolsAvailable": 7
}
```

### List Tools
```
GET /tools
```

Returns available Polymarket tools:
```json
{
  "tools": [
    { "name": "search_markets", "description": "..." },
    { "name": "get_market", "description": "..." },
    ...
  ]
}
```

## WebSocket Interface

Connect to `ws://localhost:8090` to send messages and receive streaming responses.

**Message Format**:
- Send: Plain text message
- Receive: Streamed response words
- End marker: `[END]`

## Architecture

```
┌─────────────┐         ┌────────────────┐         ┌───────────────┐
│   Frontend  │ ◄─────► │  This Backend  │ ◄─────► │  Polymarket   │
│   (React)   │   WS    │  (Node.js)     │   HTTP  │  MCP Server   │
│             │         │  + Claude API  │         │  (Smithery)   │
└─────────────┘         └────────────────┘         └───────────────┘
```

## How It Works

1. **Connection**: Frontend connects via WebSocket
2. **User Message**: User sends a message
3. **Claude Processing**: Backend sends message to Claude with Polymarket tools
4. **Tool Calling**: Claude uses tools to fetch Polymarket data
5. **MCP Integration**: Backend calls Polymarket MCP server
6. **Response**: Claude processes tool results and streams response to frontend

## Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Troubleshooting

### "ANTHROPIC_API_KEY is required"
Make sure you've created a `.env` file with your Anthropic API key.

### "Failed to connect to MCP server"
Check that the Polymarket MCP server URL is correct and accessible:
```
https://server.smithery.ai/@aryankeluskar/polymarket-mcp/mcp
```

### WebSocket connection refused
Ensure the backend is running on the correct port (default: 8090).

## Example Queries

Try these queries in the frontend:
- "Show me the top 10 trending prediction markets"
- "Analyze the market for trump-wins-2024"
- "Find all active sports markets"
- "What are the current probabilities for the presidential election?"
- "Show me recent trading activity for political markets"

## License

ISC
