import {
  OAuthClientProvider,
  UnauthorizedError,
} from "@modelcontextprotocol/sdk/client/auth.js";
import {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import fs from "fs/promises";
import path from "path";

/**
 * Simple file-based OAuth provider for server-side authentication
 * Stores tokens in a JSON file so they persist across restarts
 */
export class SimpleOAuthProvider implements OAuthClientProvider {
  private _clientInformation?: OAuthClientInformationFull;
  private _tokens?: OAuthTokens;
  private _codeVerifier?: string;
  private _pendingAuthUrl?: string;
  private readonly _tokensFile: string;

  constructor(
    private readonly _redirectUrl: string,
    private readonly _clientMetadata: OAuthClientMetadata
  ) {
    this._tokensFile = path.join(process.cwd(), ".oauth-tokens.json");
  }

  async loadSavedTokens(): Promise<void> {
    try {
      const data = await fs.readFile(this._tokensFile, "utf-8");
      const saved = JSON.parse(data);
      this._tokens = saved.tokens;
      this._clientInformation = saved.clientInformation;
      console.log("✅ Loaded saved OAuth tokens");
    } catch (error) {
      // No saved tokens, will need to authenticate
      console.log("ℹ️  No saved tokens found, will need to authenticate");
    }
  }

  async saveTokensToFile(): Promise<void> {
    if (this._tokens && this._clientInformation) {
      await fs.writeFile(
        this._tokensFile,
        JSON.stringify(
          {
            tokens: this._tokens,
            clientInformation: this._clientInformation,
          },
          null,
          2
        )
      );
      console.log("✅ Saved OAuth tokens to file");
    }
  }

  get redirectUrl(): string {
    return this._redirectUrl;
  }

  get clientMetadata(): OAuthClientMetadata {
    return this._clientMetadata;
  }

  clientInformation(): OAuthClientInformation | undefined {
    return this._clientInformation;
  }

  async saveClientInformation(
    clientInformation: OAuthClientInformationFull
  ): Promise<void> {
    this._clientInformation = clientInformation;
    await this.saveTokensToFile();
  }

  tokens(): OAuthTokens | undefined {
    return this._tokens;
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    this._tokens = tokens;
    await this.saveTokensToFile();
  }

  redirectToAuthorization(authorizationUrl: URL): void {
    this._pendingAuthUrl = authorizationUrl.toString();
    console.log("\n" + "=".repeat(80));
    console.log("🔐 OAUTH AUTHENTICATION REQUIRED");
    console.log("=".repeat(80));
    console.log("\nPlease complete authentication by visiting:");
    console.log("\n  👉 " + this._pendingAuthUrl);
    console.log("\nAfter authorizing, you'll be redirected to:");
    console.log("  " + this._redirectUrl);
    console.log("\nThe server will automatically continue once authenticated.");
    console.log("=".repeat(80) + "\n");
  }

  getPendingAuthUrl(): string | undefined {
    return this._pendingAuthUrl;
  }

  clearPendingAuth(): void {
    this._pendingAuthUrl = undefined;
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    this._codeVerifier = codeVerifier;
  }

  async codeVerifier(): Promise<string> {
    if (!this._codeVerifier) {
      throw new Error("No code verifier saved");
    }
    return this._codeVerifier;
  }
}
