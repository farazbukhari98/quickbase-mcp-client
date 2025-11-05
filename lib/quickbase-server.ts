import { spawn, ChildProcess } from 'child_process';

/**
 * Server-side QuickBase client for API routes
 * Uses child process to communicate with MCP server
 */
export class QuickBaseServerClient {
  private mcp: ChildProcess | null = null;
  private responses: Map<number, { resolve: Function, reject: Function }> = new Map();
  private requestId = 1;
  private buffer = '';

  async initialize() {
    if (this.mcp) return;

    this.mcp = spawn('npx', ['-y', 'mcp-quickbase'], {
      env: {
        ...process.env,
        QUICKBASE_REALM_HOST: 'cmscontrols.quickbase.com',
        QUICKBASE_USER_TOKEN: 'cay9u4_qkp6_0_cq3jiqi2mngcdc239fct7d9avy',
        QUICKBASE_APP_ID: 'btfi6y34y'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle stdout
    this.mcp.stdout!.on('data', (data) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            const pending = this.responses.get(response.id);
            if (pending) {
              if (response.error) {
                pending.reject(new Error(response.error.message || 'MCP error'));
              } else {
                pending.resolve(response.result);
              }
              this.responses.delete(response.id);
            }
          } catch (e) {
            // Ignore parse errors (likely log lines)
          }
        }
      }
    });

    // Initialize MCP
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'quickbase-mcp-client',
        version: '1.0.0'
      }
    });
  }

  private sendRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.responses.set(id, { resolve, reject });

      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.mcp!.stdin!.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.responses.has(id)) {
          this.responses.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    await this.initialize();

    const result = await this.sendRequest('tools/call', {
      name: toolName,
      arguments: args
    });

    if (result.content && result.content[0]?.text) {
      try {
        return JSON.parse(result.content[0].text);
      } catch (e) {
        return result.content[0].text;
      }
    }

    return result;
  }

  async queryRecords(tableId: string, options?: any): Promise<any> {
    return this.callTool('query_records', {
      table_id: tableId,
      ...options
    });
  }

  cleanup() {
    if (this.mcp) {
      this.mcp.kill();
      this.mcp = null;
    }
  }
}

// Singleton instance for server-side use
let serverClient: QuickBaseServerClient | null = null;

export function getServerClient(): QuickBaseServerClient {
  if (!serverClient) {
    serverClient = new QuickBaseServerClient();
  }
  return serverClient;
}
