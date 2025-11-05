import { useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import { MCPConnection } from '@/lib/mcp/connection';
import { ConnectionStatus, MCPConnectionState } from '@/types/mcp';

interface MCPStore extends MCPConnectionState {
  connection: MCPConnection | null;
  setConnection: (connection: MCPConnection | null) => void;
  updateState: (state: Partial<MCPConnectionState>) => void;
}

const useMCPStore = create<MCPStore>((set) => ({
  status: 'disconnected',
  connection: null,
  setConnection: (connection) => set({ connection }),
  updateState: (state) => set(state),
}));

export function useMCPConnection() {
  const { 
    status, 
    error, 
    lastConnected, 
    reconnectAttempts,
    connection, 
    setConnection, 
    updateState 
  } = useMCPStore();
  
  const connectionRef = useRef<MCPConnection | null>(null);

  const connect = useCallback(async (serverUrl?: string, token?: string) => {
    const url = serverUrl || process.env.NEXT_PUBLIC_MCP_SERVER_URL;
    if (!url) {
      updateState({ 
        status: 'failed', 
        error: 'MCP server URL not configured' 
      });
      return;
    }

    if (!connectionRef.current) {
      connectionRef.current = new MCPConnection(url, updateState);
      setConnection(connectionRef.current);
    }

    await connectionRef.current.connect(token);
  }, [setConnection, updateState]);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.disconnect();
      connectionRef.current = null;
      setConnection(null);
    }
  }, [setConnection]);

  const callTool = useCallback(async (name: string, args: Record<string, any>) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to MCP server');
    }
    return connectionRef.current.callTool(name, args);
  }, []);

  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.disconnect();
      }
    };
  }, []);

  return {
    status,
    error,
    lastConnected,
    reconnectAttempts,
    isConnected: status === 'ready',
    isConnecting: status === 'connecting' || status === 'authenticating',
    connect,
    disconnect,
    callTool,
  };
}