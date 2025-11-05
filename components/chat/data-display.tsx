'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  QuickBaseApp, 
  QuickBaseTable, 
  QuickBaseRecord,
  QuickBaseField 
} from '@/types/quickbase';
import { useQuickBase } from '@/hooks/use-quickbase';
import { ChevronRight, Database, Table, FileText } from 'lucide-react';

interface DataDisplayProps {
  data: any;
  dataType?: 'table' | 'record' | 'field' | 'app' | 'query';
}

export function DataDisplay({ data, dataType }: DataDisplayProps) {
  const { setCurrentApp, setCurrentTable } = useQuickBase();

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <Card className="p-4 text-muted-foreground">
        No data found
      </Card>
    );
  }

  const renderApp = (app: QuickBaseApp) => (
    <Card 
      key={app.id} 
      className="p-3 cursor-pointer hover:bg-accent transition-colors"
      onClick={() => setCurrentApp(app)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{app.name}</p>
            {app.description && (
              <p className="text-sm text-muted-foreground">{app.description}</p>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4" />
      </div>
    </Card>
  );

  const renderTable = (table: QuickBaseTable) => (
    <Card 
      key={table.id} 
      className="p-3 cursor-pointer hover:bg-accent transition-colors"
      onClick={() => setCurrentTable(table)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{table.name}</p>
            {table.description && (
              <p className="text-sm text-muted-foreground">{table.description}</p>
            )}
            {table.recordCount !== undefined && (
              <Badge variant="secondary" className="mt-1">
                {table.recordCount} records
              </Badge>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4" />
      </div>
    </Card>
  );

  const renderRecord = (record: QuickBaseRecord, index: number) => (
    <Card key={record.id || index} className="p-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Record {record.id}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(record.data || {}).slice(0, 4).map(([key, value]) => (
            <div key={key}>
              <span className="text-muted-foreground">{key}:</span>
              <span className="ml-1">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const renderField = (field: QuickBaseField) => (
    <Card key={field.id} className="p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{field.label}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">{field.fieldType}</Badge>
            {field.required && <Badge variant="secondary">Required</Badge>}
            {field.unique && <Badge variant="secondary">Unique</Badge>}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderData = () => {
    if (dataType === 'app' && Array.isArray(data)) {
      return data.map(renderApp);
    }
    if (dataType === 'table' && Array.isArray(data)) {
      return data.map(renderTable);
    }
    if (dataType === 'record' && Array.isArray(data)) {
      return data.map((record, index) => renderRecord(record, index));
    }
    if (dataType === 'field' && Array.isArray(data)) {
      return data.map(renderField);
    }
    
    // Fallback for generic data
    return (
      <Card className="p-3">
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </Card>
    );
  };

  return (
    <ScrollArea className="max-h-96 w-full">
      <div className="space-y-2">
        {renderData()}
      </div>
    </ScrollArea>
  );
}