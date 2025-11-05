import { useEffect, useRef } from 'react';
import { useMCPConnection } from './use-mcp-connection';
import { useAuthStore } from '@/store/auth';

export function useAutoConnect() {
  const { connect, isConnected, status } = useMCPConnection();
  const { setCredentials, isAuthenticated } = useAuthStore();
  const hasAttempted = useRef(false);
  const isConnecting = useRef(false);

  useEffect(() => {
    const autoConnect = async () => {
      // Skip if already connected, connecting, or attempted
      if (isConnected || isConnecting.current || hasAttempted.current) {
        return;
      }

      // Only auto-connect if enabled
      if (process.env.NEXT_PUBLIC_AUTO_CONNECT !== 'true') {
        return;
      }

      const realm = process.env.NEXT_PUBLIC_QUICKBASE_REALM;
      const token = process.env.NEXT_PUBLIC_QUICKBASE_USER_TOKEN;
      const serverUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL;

      if (realm && token && serverUrl) {
        console.log('Auto-connecting to QuickBase MCP server at', serverUrl);
        
        isConnecting.current = true;
        hasAttempted.current = true;
        
        // Set credentials in store first
        setCredentials(realm, token);
        
        // Connect to MCP server
        try {
          await connect(serverUrl, token);
          console.log('Successfully auto-connected to QuickBase MCP server');
        } catch (error) {
          console.error('Auto-connection failed:', error);
          // Allow retry after a delay
          setTimeout(() => {
            hasAttempted.current = false;
            isConnecting.current = false;
          }, 3000);
        } finally {
          isConnecting.current = false;
        }
      }
    };

    // Run auto-connect when component mounts
    if (typeof window !== 'undefined') {
      autoConnect();
    }
  }, [connect, isConnected, setCredentials, status]);

  return { 
    isAutoConnecting: isConnecting.current || (hasAttempted.current && !isConnected)
  };
}