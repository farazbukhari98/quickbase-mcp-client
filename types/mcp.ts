export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'ready'
  | 'failed'
  | 'reconnecting';

export interface MCPConnectionState {
  status: ConnectionStatus;
  error?: string;
  lastConnected?: Date;
  reconnectAttempts?: number;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
}

export interface MCPRequest {
  id: string;
  tool: string;
  arguments: Record<string, any>;
  timestamp: Date;
}

export interface MCPResponse {
  id: string;
  requestId: string;
  result?: any;
  error?: MCPError;
  timestamp: Date;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}