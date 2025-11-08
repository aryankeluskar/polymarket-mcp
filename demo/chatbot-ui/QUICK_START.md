# Quick Start Guide - Polymarket MCP Demo

> Get the demo running in 5 minutes!

## Prerequisites

- [Bun](https://bun.sh/) installed
- [Anthropic API key](https://console.anthropic.com/settings/keys)

## Step 1: Backend Setup

```bash
cd backend

# Install dependencies
bun install

# Create .env file
cp .env.example .env
```

Edit `backend/.env` and add your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

Start the backend:

```bash
bun run dev
```

## Step 2: OAuth Authentication

**On first run only**, you'll see this in the console:

```
================================================================================
🔐 OAUTH AUTHENTICATION REQUIRED
================================================================================

Please complete authentication by visiting:

  👉 https://smithery.ai/oauth/authorize?client_id=...

After authorizing, you'll be redirected to:
  http://localhost:8090/oauth/callback

The server will automatically continue once authenticated.
================================================================================
```

### To Complete OAuth:

1. **Copy the URL** starting with `https://smithery.ai/oauth/authorize...`
2. **Open it in your browser**
3. **Sign in to Smithery** (or create an account)
4. **Authorize the app**
5. **Wait for redirect** - You'll see a success page
6. **Check your terminal** - The server will automatically reconnect

✅ **Done!** Your tokens are saved in `.oauth-tokens.json` and won't expire for a while.

## Step 3: Verify Backend Connection

After OAuth completes, you should see:

```
✅ Connected to Polymarket MCP server
📋 Found 7 tools:
   1. search_markets - Search Polymarket prediction markets...
   2. get_market - Get detailed information about a specific market...
   3. search_events - Search Polymarket events...
   4. get_event - Get detailed information about a specific event...
   5. list_tags - List all available tags/categories...
   6. get_trades - Get recent trade activity...
   7. analyze_market - Get comprehensive market analysis...

✅ Backend ready!
📡 WebSocket server: ws://localhost:8090
🌐 HTTP server: http://localhost:8090
```

## Step 4: Frontend Setup

**Open a new terminal** (keep the backend running!):

```bash
cd ..  # Back to chatbot-ui directory

# Install dependencies (if not already done)
bun install

# Start the frontend
bun run dev
```

The frontend will start on `http://localhost:5173`.

## Step 5: Test the Demo!

1. **Open your browser** to `http://localhost:5173`
2. **Try these example queries**:

### Example Queries

**Market Discovery:**
```
Show me the top 10 trending prediction markets
```

**Market Analysis:**
```
Analyze the market for trump-wins-2024
```

**Category Exploration:**
```
Find all active sports prediction markets
```

**Event Analysis:**
```
What are the current probabilities for the presidential election?
```

**Trading Data:**
```
Show me recent trading activity for political markets
```

**Educational:**
```
What categories of prediction markets are available on Polymarket?
```

## Troubleshooting

### Backend won't start

**Error**: `ANTHROPIC_API_KEY is required`
- **Fix**: Make sure you created `.env` file in the `backend/` directory with your API key

**Error**: `Port 8090 already in use`
- **Fix**: Stop any other servers running on port 8090, or change `PORT` in `.env`

### OAuth issues

**Error**: `OAuth authorization required` but no URL shown
- **Fix**: Check your internet connection and try restarting the backend

**Browser shows "Invalid OAuth callback"**
- **Fix**: Make sure you're using the exact URL from the console output

### Frontend won't connect

**Error**: `WebSocket connection failed`
- **Fix**: Make sure the backend is running on port 8090
- **Check**: Visit `http://localhost:8090/health` - should show `{"status":"ok","mcpConnected":true}`

### No AI responses

**Tokens expired**: If you see authentication errors after a long time
- **Fix**: Delete `.oauth-tokens.json` and restart the backend to re-authenticate

## What's Next?

### Customize the Experience

1. **Add quick action buttons** - Edit `src/components/custom/overview.tsx`
2. **Style the UI** - Modify `src/index.css` and Tailwind config
3. **Add visualizations** - Create new components for market charts

### Deploy to Production

See [DEMO_README.md](./DEMO_README.md) for deployment instructions.

### Learn More

- [Backend README](./backend/README.md) - Technical details about the backend
- [Demo README](./DEMO_README.md) - Complete tutorial and customization guide
- [MCP Server README](../../README.md) - Information about the Polymarket MCP server

## Quick Reference

### Backend Commands

```bash
cd backend
bun run dev    # Start development server
bun run build  # Build for production
bun run start  # Run production build
```

### Frontend Commands

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run preview  # Preview production build
```

### Environment Variables

**Backend** (`.env`):
```bash
ANTHROPIC_API_KEY=sk-ant-...           # Required
POLYMARKET_MCP_URL=https://...         # Optional (has default)
PORT=8090                              # Optional (default: 8090)
```

### Health Check

```bash
curl http://localhost:8090/health
```

Expected response:
```json
{
  "status": "ok",
  "mcpConnected": true,
  "toolsAvailable": 7
}
```

## Support

- **OAuth issues**: See [Smithery Documentation](https://smithery.ai/docs)
- **MCP issues**: See [MCP Protocol Docs](https://modelcontextprotocol.io)
- **Claude API issues**: See [Anthropic Docs](https://docs.anthropic.com)

---

Happy building! 🚀
