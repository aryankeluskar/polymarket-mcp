import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import * as dotenv from "dotenv";
import cors from "cors";
import { SimpleOAuthProvider } from "./oauth-provider.js";

dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 8090;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const POLYMARKET_MCP_URL = process.env.POLYMARKET_MCP_URL ||
  "https://server.smithery.ai/@aryankeluskar/polymarket-mcp/mcp";

if (!ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY is required. Please set it in .env file");
  process.exit(1);
}

// ============================================================================
// MCP CLIENT SETUP
// ============================================================================

let mcpClient: Client | null = null;
let mcpTransport: StreamableHTTPClientTransport | null = null;
let oauthProvider: SimpleOAuthProvider | null = null;
let availableTools: Anthropic.Messages.Tool[] = [];

async function initializeMCPClient() {
  try {
    console.log("🔌 Connecting to Polymarket MCP server...");
    console.log(`   URL: ${POLYMARKET_MCP_URL}`);

    // Create OAuth provider
    oauthProvider = new SimpleOAuthProvider(
      `http://localhost:${PORT}/oauth/callback`,
      {
        client_name: "Polymarket MCP Demo",
        redirect_uris: [`http://localhost:${PORT}/oauth/callback`],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        scope: "mcp:tools mcp:prompts mcp:resources",
      }
    );

    // Try to load saved tokens
    await oauthProvider.loadSavedTokens();

    // Use StreamableHTTP transport for Smithery servers
    mcpTransport = new StreamableHTTPClientTransport(
      new URL(POLYMARKET_MCP_URL),
      { authProvider: oauthProvider }
    );

    mcpClient = new Client(
      {
        name: "polymarket-demo-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await mcpClient.connect(mcpTransport);
    console.log("✅ Connected to Polymarket MCP server");

    // List available tools
    const toolsResponse = await mcpClient.listTools();
    console.log(`📋 Found ${toolsResponse.tools.length} tools:`);

    toolsResponse.tools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.name} - ${tool.description}`);
    });

    // Convert MCP tools to Anthropic tool format
    availableTools = toolsResponse.tools.map((tool) => ({
      name: tool.name,
      description: tool.description || "",
      input_schema: tool.inputSchema as Anthropic.Messages.Tool.InputSchema,
    }));

    console.log("✅ Tools converted to Anthropic format");

    // List available prompts
    try {
      const promptsResponse = await mcpClient.listPrompts();
      console.log(`📝 Found ${promptsResponse.prompts.length} prompts:`);
      promptsResponse.prompts.forEach((prompt, index) => {
        console.log(`   ${index + 1}. ${prompt.name} - ${prompt.description}`);
      });
    } catch (error) {
      console.log("ℹ️  No prompts available");
    }

    // List available resources
    try {
      const resourcesResponse = await mcpClient.listResources();
      console.log(`📚 Found ${resourcesResponse.resources.length} resources:`);
      resourcesResponse.resources.forEach((resource, index) => {
        console.log(`   ${index + 1}. ${resource.uri} - ${resource.name}`);
      });
    } catch (error) {
      console.log("ℹ️  No resources available");
    }

  } catch (error) {
    if (error instanceof UnauthorizedError) {
      // OAuth authentication required
      console.log("\n⏳ Waiting for OAuth authentication to complete...");
      console.log("   Once you authorize, the server will automatically reconnect.\n");
      return; // Don't throw, let the callback handle reconnection
    }
    console.error("❌ Failed to connect to MCP server:", error);
    throw error;
  }
}

async function initializeTools(): Promise<void> {
  if (!mcpClient) {
    throw new Error("MCP client not initialized");
  }

  // List available tools
  const toolsResponse = await mcpClient.listTools();
  console.log(`📋 Found ${toolsResponse.tools.length} tools:`);

  toolsResponse.tools.forEach((tool, index) => {
    console.log(`   ${index + 1}. ${tool.name} - ${tool.description}`);
  });

  // Convert MCP tools to Anthropic tool format
  availableTools = toolsResponse.tools.map((tool) => ({
    name: tool.name,
    description: tool.description || "",
    input_schema: tool.inputSchema as Anthropic.Messages.Tool.InputSchema,
  }));

  console.log("✅ Tools converted to Anthropic format");

  // List prompts
  try {
    const promptsResponse = await mcpClient.listPrompts();
    console.log(`📝 Found ${promptsResponse.prompts.length} prompts:`);
    promptsResponse.prompts.forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.name} - ${prompt.description}`);
    });
  } catch (error) {
    console.log("ℹ️  No prompts available");
  }

  // List resources
  try {
    const resourcesResponse = await mcpClient.listResources();
    console.log(`📚 Found ${resourcesResponse.resources.length} resources:`);
    resourcesResponse.resources.forEach((resource, index) => {
      console.log(`   ${index + 1}. ${resource.uri} - ${resource.name}`);
    });
  } catch (error) {
    console.log("ℹ️  No resources available");
  }
}

async function reconnectAfterAuth(authCode: string): Promise<void> {
  if (!mcpTransport || !oauthProvider) {
    throw new Error("OAuth provider not initialized");
  }

  console.log("\n🔄 Completing OAuth flow...");

  await mcpTransport.finishAuth(authCode);
  oauthProvider.clearPendingAuth();

  console.log("✅ OAuth authentication successful!");
  console.log("🔌 Fetching available tools...\n");

  await initializeTools();

  console.log("\n✅ Backend fully connected and ready!");
  console.log("💡 You can now use the chat interface!\n");
}

async function reconnectMCPSession(): Promise<void> {
  console.log("\n🔄 Session expired, reconnecting to MCP server...");

  // Close existing client
  if (mcpClient) {
    await mcpClient.close();
  }

  // Create new transport and client
  if (!oauthProvider) {
    throw new Error("OAuth provider not initialized");
  }

  mcpTransport = new StreamableHTTPClientTransport(
    new URL(POLYMARKET_MCP_URL),
    {
      authProvider: oauthProvider,
    }
  );

  mcpClient = new Client(
    {
      name: "polymarket-mcp-demo",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await mcpClient.connect(mcpTransport);
  console.log("✅ Reconnected to Polymarket MCP server");

  await initializeTools();
  console.log("✅ Session restored!\n");
}

// ============================================================================
// CLAUDE AI INTEGRATION
// ============================================================================

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

async function processMessageWithClaude(
  userMessage: string,
  conversationHistory: Message[],
  ws: WebSocket
): Promise<void> {
  try {
    const messages: Anthropic.Messages.MessageParam[] = [
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: userMessage,
      },
    ];

    let response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: `You are a helpful assistant with access to Polymarket prediction market data. You can help users:

- Analyze prediction markets and their probabilities
- Find trending markets and events
- Compare markets within events
- Discover markets by category
- View recent trading activity
- Provide insights on market sentiment

When users ask about prediction markets, use the available tools to fetch real-time data from Polymarket.
Present the information in a clear, engaging way with proper formatting.

Always explain what the probabilities mean and provide context for the markets you're analyzing.`,
      messages,
      tools: availableTools,
    });

    // Handle tool use loop
    while (response.stop_reason === "tool_use") {
      // Find ALL tool_use blocks (Claude might call multiple tools at once)
      const toolUseBlocks = response.content.filter(
        (block) => block.type === "tool_use"
      ) as Anthropic.Messages.ToolUseBlock[];

      if (toolUseBlocks.length === 0) break;

      // Add assistant message with tool uses
      messages.push({
        role: "assistant",
        content: response.content,
      });

      // Call all tools and collect results
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          console.log(`🔧 Tool called: ${toolUse.name}`);
          console.log(`   Input:`, JSON.stringify(toolUse.input, null, 2));

          // Retry logic for session expiration
          let retries = 0;
          const maxRetries = 2;

          while (retries < maxRetries) {
            try {
              const result = await mcpClient!.callTool({
                name: toolUse.name,
                arguments: toolUse.input as Record<string, unknown>,
              });

              console.log(`✅ Tool result received for ${toolUse.name}`);

              return {
                type: "tool_result" as const,
                tool_use_id: toolUse.id,
                content: JSON.stringify(result.content),
              };
            } catch (error: any) {
              const errorMessage = error?.message || String(error);

              // Check if it's a session expiration error
              if (errorMessage.includes("Session not found or expired") && retries < maxRetries - 1) {
                console.log(`⚠️  Session expired, reconnecting... (attempt ${retries + 1}/${maxRetries - 1})`);
                await reconnectMCPSession();
                retries++;
                continue;
              }

              // If not session error or out of retries, throw
              throw error;
            }
          }

          // This should never be reached, but TypeScript needs it
          throw new Error(`Failed to call tool ${toolUse.name} after ${maxRetries} attempts`);
        })
      );

      // Add user message with all tool results
      messages.push({
        role: "user",
        content: toolResults,
      });

      response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 4096,
        messages,
        tools: availableTools,
      });
    }

    // Stream the final response
    const textContent = response.content.find(
      (block) => block.type === "text"
    ) as Anthropic.Messages.TextBlock | undefined;

    if (textContent) {
      const fullText = textContent.text;

      // Stream word by word for better UX
      const words = fullText.split(" ");
      for (let i = 0; i < words.length; i++) {
        const word = i === words.length - 1 ? words[i] : words[i] + " ";
        ws.send(word);
        // Small delay for streaming effect
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    ws.send("[END]");
  } catch (error) {
    console.error("❌ Error processing message:", error);
    ws.send(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    ws.send("[END]");
  }
}

// ============================================================================
// EXPRESS & WEBSOCKET SERVER
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());

// OAuth callback endpoint
app.get("/oauth/callback", async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (code) {
    try {
      await reconnectAfterAuth(code);
      res.send(`
        <html>
          <head>
            <title>OAuth Success</title>
            <style>
              body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
              .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 8px; }
              h1 { margin-top: 0; }
            </style>
          </head>
          <body>
            <div class="success">
              <h1>✅ Authentication Successful!</h1>
              <p>You can close this window and return to your terminal.</p>
              <p>The Polymarket MCP server is now connected and ready to use.</p>
            </div>
          </body>
        </html>
      `);
    } catch (err) {
      console.error("Failed to complete OAuth:", err);
      res.status(500).send(`
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 20px; border-radius: 8px; }
              h1 { margin-top: 0; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>❌ Authentication Failed</h1>
              <p>Error: ${err instanceof Error ? err.message : 'Unknown error'}</p>
              <p>Please check the server logs and try again.</p>
            </div>
          </body>
        </html>
      `);
    }
  } else if (error) {
    res.status(400).send(`
      <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 20px; border-radius: 8px; }
            h1 { margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Authorization Failed</h1>
            <p>Error: ${error}</p>
          </div>
        </body>
      </html>
    `);
  } else {
    res.status(400).send("Invalid OAuth callback");
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mcpConnected: mcpClient !== null,
    toolsAvailable: availableTools.length,
  });
});

// Get available tools endpoint
app.get("/tools", (req, res) => {
  res.json({
    tools: availableTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    })),
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`✅ HTTP server running on port ${PORT}`);
});

// WebSocket server for chat
const wss = new WebSocketServer({ server });

// Store conversation history per client
const conversationHistories = new Map<WebSocket, Message[]>();

wss.on("connection", (ws) => {
  console.log("👤 New client connected");
  conversationHistories.set(ws, []);

  ws.on("message", async (data) => {
    const userMessage = data.toString();
    console.log(`📨 Received: ${userMessage}`);

    const history = conversationHistories.get(ws) || [];

    // Add user message to history
    history.push({ role: "user", content: userMessage });

    // Process with Claude
    await processMessageWithClaude(userMessage, history.slice(0, -1), ws);

    // Update history with assistant response
    // Note: We'd need to capture the full response to add it to history
    // For now, we'll keep the conversation context simple
  });

  ws.on("close", () => {
    console.log("👋 Client disconnected");
    conversationHistories.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
  });
});

// ============================================================================
// STARTUP
// ============================================================================

async function startup() {
  console.log("🚀 Starting Polymarket MCP Demo Backend...\n");

  try {
    await initializeMCPClient();

    if (mcpClient && availableTools.length > 0) {
      console.log("\n✅ Backend ready!");
      console.log(`📡 WebSocket server: ws://localhost:${PORT}`);
      console.log(`🌐 HTTP server: http://localhost:${PORT}`);
      console.log("\n💡 Connect your frontend to ws://localhost:${PORT}\n");
    } else {
      // OAuth authentication is in progress
      console.log("\n⏳ Server is running, waiting for OAuth authentication...");
      console.log(`📡 WebSocket server: ws://localhost:${PORT}`);
      console.log(`🌐 HTTP server: http://localhost:${PORT}`);
      console.log(`🔐 OAuth callback: http://localhost:${PORT}/oauth/callback\n`);
    }
  } catch (error) {
    console.error("❌ Startup failed:", error);
    process.exit(1);
  }
}

startup();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");

  if (mcpClient) {
    await mcpClient.close();
  }

  wss.close(() => {
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  });
});
