'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMCPConnection } from '@/hooks/use-mcp-connection';
import { useAuthStore } from '@/store/auth';
import { Loader2, Wifi, WifiOff, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function ConnectionStatus() {
  const { status, error, lastConnected, connect, isConnected } = useMCPConnection();
  const { realm, userToken } = useAuthStore();
  
  const handleReconnect = async () => {
    const serverUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL;
    if (serverUrl && realm && userToken) {
      try {
        await connect(serverUrl, userToken);
      } catch (error) {
        console.error('Manual reconnection failed:', error);
      }
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
      case 'authenticating':
      case 'reconnecting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'ready':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case 'ready':
        return 'default';
      case 'connecting':
      case 'authenticating':
      case 'reconnecting':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'disconnected':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'authenticating':
        return 'Authenticating...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'ready':
        return 'Connected';
      case 'failed':
        return error || 'Connection Failed';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusVariant()} className="flex items-center gap-1">
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Badge>
      {!isConnected && status !== 'connecting' && status !== 'authenticating' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReconnect}
          className="h-6 w-6"
          title="Reconnect to MCP server"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
      {lastConnected && status === 'disconnected' && (
        <span className="text-xs text-muted-foreground">
          Last: {typeof window !== 'undefined' ? new Date(lastConnected).toLocaleTimeString() : ''}
        </span>
      )}
    </div>
  );
}