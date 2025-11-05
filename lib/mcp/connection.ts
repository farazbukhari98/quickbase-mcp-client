import { ConnectionStatus, MCPConnectionState } from '@/types/mcp';

export class MCPConnection {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();

  constructor(
    private serverUrl: string,
    private onStateChange: (state: MCPConnectionState) => void
  ) {}

  async connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.onStateChange({ status: 'connecting' });
        
        if (this.ws) {
          this.disconnect();
        }

        const url = new URL(this.serverUrl);
        if (token) {
          url.searchParams.set('token', token);
          this.onStateChange({ status: 'authenticating' });
        }

        // Only create WebSocket in browser environment
        if (typeof window === 'undefined') {
          reject(new Error('WebSocket not available in server environment'));
          return;
        }

        console.log('[MCP] Creating WebSocket connection to:', url.toString());
        this.ws = new WebSocket(url.toString());
        
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            this.onStateChange({
              status: 'failed',
              error: 'Connection timeout - MCP server may not be running'
            });
            reject(new Error('Connection timeout'));
          }
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
          this.onStateChange({ 
            status: 'ready',
            lastConnected: new Date()
          });
          resolve();
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          const wasConnecting = this.ws?.readyState === WebSocket.CONNECTING;
          this.onStateChange({ status: 'disconnected' });
          
          if (!wasConnecting && !event.wasClean) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = () => {
          clearTimeout(connectionTimeout);
          console.warn('WebSocket connection failed - ensure MCP server is running at', this.serverUrl);
          this.onStateChange({
            status: 'failed',
            error: 'Cannot connect to MCP server - is it running?'
          });
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.id && this.pendingRequests.has(message.id)) {
              const { resolve, reject } = this.pendingRequests.get(message.id)!;
              this.pendingRequests.delete(message.id);
              
              if (message.error) {
                reject(new Error(message.error.message));
              } else {
                resolve(message.result);
              }
            }
          } catch (error) {
            console.error('Failed to process message:', error);
          }
        };

      } catch (error) {
        console.error('Connection setup failed:', error);
        this.onStateChange({ 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Connection failed'
        });
        reject(error);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onStateChange({
        status: 'failed',
        error: 'Max reconnection attempts reached'
      });
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.onStateChange({
      status: 'reconnecting',
      reconnectAttempts: this.reconnectAttempts
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.pendingRequests.clear();
    this.onStateChange({ status: 'disconnected' });
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to MCP server');
    }

    const id = ++this.messageId;
    const message = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      try {
        this.ws!.send(JSON.stringify(message));
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (this.pendingRequests.has(id)) {
            this.pendingRequests.delete(id);
            reject(new Error('Request timeout'));
          }
        }, 30000);
      } catch (error) {
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}