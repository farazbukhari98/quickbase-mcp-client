import { useCallback } from 'react';
import { useMCPConnection } from './use-mcp-connection';
import { useQuickBaseStore } from '@/store/quickbase';
import { useAuthStore } from '@/store/auth';
import { 
  QuickBaseApp, 
  QuickBaseTable, 
  QuickBaseQuery,
  QuickBaseRecord,
  QuickBaseField
} from '@/types/quickbase';
import { toast } from 'sonner';

export function useQuickBase() {
  const { callTool, isConnected } = useMCPConnection();
  const { realm, userToken } = useAuthStore();
  const {
    currentApp,
    currentTable,
    apps,
    tables,
    records,
    fields,
    loading,
    setApps,
    setTables,
    setRecords,
    setFields,
    setLoading,
    setError,
    setCurrentApp,
    setCurrentTable,
  } = useQuickBaseStore();

  const handleError = useCallback((operation: string, error: any) => {
    const message = error?.message || `Failed to ${operation}`;
    console.error(`QuickBase operation failed: ${operation}`, error);
    setError(message);
    toast.error(message);
  }, [setError]);

  const getApps = useCallback(async () => {
    if (!isConnected) {
      handleError('get apps', new Error('Not connected to MCP server'));
      return [];
    }

    setLoading('apps', true);
    try {
      const result = await callTool('quickbase_get_apps', {
        realm,
        userToken
      });
      
      const appList = result?.apps || [];
      setApps(appList);
      return appList;
    } catch (error) {
      handleError('get apps', error);
      return [];
    } finally {
      setLoading('apps', false);
    }
  }, [isConnected, realm, userToken, callTool, setApps, setLoading, handleError]);

  const getTables = useCallback(async (appId: string) => {
    if (!isConnected) {
      handleError('get tables', new Error('Not connected to MCP server'));
      return [];
    }

    setLoading('tables', true);
    try {
      const result = await callTool('quickbase_get_tables', {
        realm,
        userToken,
        appId
      });
      
      const tableList = result?.tables || [];
      setTables(tableList);
      return tableList;
    } catch (error) {
      handleError('get tables', error);
      return [];
    } finally {
      setLoading('tables', false);
    }
  }, [isConnected, realm, userToken, callTool, setTables, setLoading, handleError]);

  const getFields = useCallback(async (tableId: string) => {
    if (!isConnected) {
      handleError('get fields', new Error('Not connected to MCP server'));
      return [];
    }

    setLoading('fields', true);
    try {
      const result = await callTool('quickbase_get_fields', {
        realm,
        userToken,
        tableId
      });
      
      const fieldList = result?.fields || [];
      setFields(fieldList);
      return fieldList;
    } catch (error) {
      handleError('get fields', error);
      return [];
    } finally {
      setLoading('fields', false);
    }
  }, [isConnected, realm, userToken, callTool, setFields, setLoading, handleError]);

  const queryRecords = useCallback(async (query: QuickBaseQuery) => {
    if (!isConnected) {
      handleError('query records', new Error('Not connected to MCP server'));
      return [];
    }

    setLoading('records', true);
    try {
      const result = await callTool('quickbase_query_records', {
        realm,
        userToken,
        ...query
      });
      
      const recordList = result?.data || [];
      setRecords(recordList);
      return recordList;
    } catch (error) {
      handleError('query records', error);
      return [];
    } finally {
      setLoading('records', false);
    }
  }, [isConnected, realm, userToken, callTool, setRecords, setLoading, handleError]);

  const createRecord = useCallback(async (
    tableId: string, 
    data: Record<string, any>
  ) => {
    if (!isConnected) {
      handleError('create record', new Error('Not connected to MCP server'));
      return null;
    }

    try {
      const result = await callTool('quickbase_create_record', {
        realm,
        userToken,
        tableId,
        data
      });
      
      toast.success('Record created successfully');
      return result;
    } catch (error) {
      handleError('create record', error);
      return null;
    }
  }, [isConnected, realm, userToken, callTool, handleError]);

  const updateRecord = useCallback(async (
    tableId: string, 
    recordId: string,
    data: Record<string, any>
  ) => {
    if (!isConnected) {
      handleError('update record', new Error('Not connected to MCP server'));
      return null;
    }

    try {
      const result = await callTool('quickbase_update_record', {
        realm,
        userToken,
        tableId,
        recordId,
        data
      });
      
      toast.success('Record updated successfully');
      return result;
    } catch (error) {
      handleError('update record', error);
      return null;
    }
  }, [isConnected, realm, userToken, callTool, handleError]);

  const deleteRecord = useCallback(async (
    tableId: string, 
    recordId: string
  ) => {
    if (!isConnected) {
      handleError('delete record', new Error('Not connected to MCP server'));
      return false;
    }

    try {
      await callTool('quickbase_delete_record', {
        realm,
        userToken,
        tableId,
        recordId
      });
      
      toast.success('Record deleted successfully');
      return true;
    } catch (error) {
      handleError('delete record', error);
      return false;
    }
  }, [isConnected, realm, userToken, callTool, handleError]);

  const createTable = useCallback(async (
    appId: string,
    name: string,
    description?: string
  ) => {
    if (!isConnected) {
      handleError('create table', new Error('Not connected to MCP server'));
      return null;
    }

    try {
      const result = await callTool('quickbase_create_table', {
        realm,
        userToken,
        appId,
        name,
        description
      });
      
      toast.success('Table created successfully');
      return result;
    } catch (error) {
      handleError('create table', error);
      return null;
    }
  }, [isConnected, realm, userToken, callTool, handleError]);

  const createField = useCallback(async (
    tableId: string,
    field: Partial<QuickBaseField>
  ) => {
    if (!isConnected) {
      handleError('create field', new Error('Not connected to MCP server'));
      return null;
    }

    try {
      const result = await callTool('quickbase_create_field', {
        realm,
        userToken,
        tableId,
        ...field
      });
      
      toast.success('Field created successfully');
      return result;
    } catch (error) {
      handleError('create field', error);
      return null;
    }
  }, [isConnected, realm, userToken, callTool, handleError]);

  return {
    currentApp,
    currentTable,
    apps,
    tables,
    records,
    fields,
    loading,
    setCurrentApp,
    setCurrentTable,
    getApps,
    getTables,
    getFields,
    queryRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    createTable,
    createField,
  };
}