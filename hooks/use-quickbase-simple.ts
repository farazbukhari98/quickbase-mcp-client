import { useState, useCallback, useRef } from 'react';
import { QuickBaseClient } from '@/lib/quickbase-client';
import { toast } from 'sonner';

export function useQuickBaseSimple() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<QuickBaseClient | null>(null);

  // Get or create client
  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new QuickBaseClient();
    }
    return clientRef.current;
  }, []);

  const callTool = useCallback(async (method: string, params?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    
    try {
      const client = getClient();
      const result = await client.callTool(method, params);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  const testConnection = useCallback(async () => {
    try {
      const result = await callTool('test_connection');
      toast.success('Connection successful!');
      return result;
    } catch (err) {
      toast.error('Connection failed');
      throw err;
    }
  }, [callTool]);

  const listTables = useCallback(async () => {
    return callTool('list_tables');
  }, [callTool]);

  const queryRecords = useCallback(async (tableId: string, options?: any) => {
    return callTool('query_records', { tableId, ...options });
  }, [callTool]);

  const getTableFields = useCallback(async (tableId: string) => {
    return callTool('get_table_fields', { tableId });
  }, [callTool]);

  return {
    loading,
    error,
    callTool,
    testConnection,
    listTables,
    queryRecords,
    getTableFields,
  };
}