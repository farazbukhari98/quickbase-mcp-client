// Simple QuickBase API client
export class QuickBaseClient {
  private sessionId: string;

  constructor() {
    this.sessionId = `session-${Date.now()}`;
  }

  async callTool(method: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const response = await fetch('/api/quickbase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          params,
          sessionId: this.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || data.error);
      }

      return data.result;
    } catch (error) {
      console.error(`Failed to call ${method}:`, error);
      throw error;
    }
  }

  // Convenience methods
  async testConnection(): Promise<any> {
    return this.callTool('test_connection');
  }

  async listTables(): Promise<any> {
    return this.callTool('list_tables');
  }

  async queryRecords(tableId: string, options?: any): Promise<any> {
    return this.callTool('query_records', {
      table_id: tableId,
      ...options
    });
  }

  async createRecord(tableId: string, data: Record<string, any>): Promise<any> {
    return this.callTool('create_record', {
      table_id: tableId,
      data
    });
  }

  async updateRecord(tableId: string, recordId: string, data: Record<string, any>): Promise<any> {
    return this.callTool('update_record', {
      table_id: tableId,
      record_id: recordId,
      data
    });
  }

  async deleteRecord(tableId: string, recordId: string): Promise<any> {
    return this.callTool('delete_record', {
      table_id: tableId,
      record_id: recordId
    });
  }

  async getTableFields(tableId: string): Promise<any> {
    return this.callTool('get_table_fields', {
      table_id: tableId
    });
  }
}