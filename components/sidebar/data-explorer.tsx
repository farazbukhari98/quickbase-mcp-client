'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuickBase } from '@/hooks/use-quickbase';
import { useMCPConnection } from '@/hooks/use-mcp-connection';
import { 
  Database, 
  Table, 
  ChevronRight, 
  RefreshCw,
  Loader2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DataExplorer() {
  const { isConnected } = useMCPConnection();
  const {
    currentApp,
    currentTable,
    apps,
    tables,
    loading,
    getApps,
    getTables,
    setCurrentApp,
    setCurrentTable,
  } = useQuickBase();

  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && apps.length === 0) {
      getApps();
    }
  }, [isConnected]);

  const handleAppClick = async (app: any) => {
    setCurrentApp(app);
    setExpandedApp(app.id === expandedApp ? null : app.id);
    
    if (app.id !== expandedApp) {
      await getTables(app.id);
    }
  };

  const handleRefresh = () => {
    getApps();
    if (currentApp) {
      getTables(currentApp.id);
    }
  };

  if (!isConnected) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Data Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p>Connect to MCP server to explore data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Data Explorer</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading.apps || loading.tables}
          >
            {(loading.apps || loading.tables) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 px-3 pb-3">
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {loading.apps && apps.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading applications...</p>
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No applications found</p>
              </div>
            ) : (
              apps.map((app) => (
                <div key={app.id} className="space-y-1">
                  <Button
                    variant={currentApp?.id === app.id ? "secondary" : "ghost"}
                    className="w-full justify-start px-2"
                    onClick={() => handleAppClick(app)}
                  >
                    <Database className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate flex-1 text-left">{app.name}</span>
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedApp === app.id && "rotate-90"
                      )}
                    />
                  </Button>
                  
                  {expandedApp === app.id && (
                    <div className="ml-4 space-y-1">
                      {loading.tables ? (
                        <div className="px-2 py-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                        </div>
                      ) : tables.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-2 py-1">
                          No tables found
                        </p>
                      ) : (
                        tables.map((table) => (
                          <Button
                            key={table.id}
                            variant={currentTable?.id === table.id ? "secondary" : "ghost"}
                            size="sm"
                            className="w-full justify-start px-2 h-8"
                            onClick={() => setCurrentTable(table)}
                          >
                            <Table className="h-3 w-3 mr-2 shrink-0" />
                            <span className="truncate flex-1 text-left text-xs">
                              {table.name}
                            </span>
                            {table.recordCount !== undefined && (
                              <Badge variant="outline" className="ml-1 h-5 px-1 text-xs">
                                {table.recordCount}
                              </Badge>
                            )}
                          </Button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      {(currentApp || currentTable) && (
        <>
          <Separator />
          <div className="p-3 space-y-2">
            {currentApp && (
              <div className="text-xs">
                <span className="text-muted-foreground">App:</span>
                <span className="ml-1 font-medium">{currentApp.name}</span>
              </div>
            )}
            {currentTable && (
              <div className="text-xs">
                <span className="text-muted-foreground">Table:</span>
                <span className="ml-1 font-medium">{currentTable.name}</span>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}