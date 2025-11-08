import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import * as dotenv from "dotenv";
import cors from "cors";

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
let availableTools: Anthropic.Messages.Tool[] = [];

async function initializeMCPClient() {
  try {
    console.log("🔌 Connecting to Polymarket MCP server...");
    console.log(`   URL: ${POLYMARKET_MCP_URL}`);

    const transport = new WebSocketClientTransport(
      new URL(POLYMARKET_MCP_URL)
    );

    mcpClient = new Client({
      name: "polymarket-demo-client",
      version: "1.0.0",
    }, {
      capabilities: {},
    });

    await mcpClient.connect(transport);
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
    console.error("❌ Failed to connect to MCP server:", error);
    throw error;
  }
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
      model: "claude-3-5-sonnet-20241022",
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
      const toolUse = response.content.find(
        (block) => block.type === "tool_use"
      ) as Anthropic.Messages.ToolUseBlock | undefined;

      if (!toolUse) break;

      console.log(`🔧 Tool called: ${toolUse.name}`);
      console.log(`   Input:`, JSON.stringify(toolUse.input, null, 2));

      // Call the MCP tool
      const toolResult = await mcpClient!.callTool({
        name: toolUse.name,
        arguments: toolUse.input as Record<string, unknown>,
      });

      console.log(`✅ Tool result received`);

      // Continue conversation with tool result
      messages.push({
        role: "assistant",
        content: response.content,
      });

      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResult.content),
          },
        ],
      });

      response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
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
    console.log("\n✅ Backend ready!");
    console.log(`📡 WebSocket server: ws://localhost:${PORT}`);
    console.log(`🌐 HTTP server: http://localhost:${PORT}`);
    console.log("\n💡 Connect your frontend to ws://localhost:${PORT}\n");
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
