'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/types/chat';
import { ChatMessageComponent } from './chat-message';
import { ChatSuggestions } from './chat-suggestions';
import { useMCPConnection } from '@/hooks/use-mcp-connection';
import { useQuickBase } from '@/hooks/use-quickbase';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you explore and manage your QuickBase data. You can ask me to:\n\n• Show your QuickBase applications\n• List tables in an app\n• Query records from a table\n• Create or update records\n• Analyze your data\n\nWhat would you like to know about your QuickBase data?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { isConnected, callTool } = useMCPConnection();
  const quickbase = useQuickBase();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const processCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Parse different types of commands
    if (lowerCommand.includes('show apps') || lowerCommand.includes('list apps')) {
      const apps = await quickbase.getApps();
      return {
        content: `Found ${apps.length} QuickBase applications:`,
        metadata: {
          dataType: 'app' as const,
          quickbaseData: apps
        }
      };
    }
    
    if (lowerCommand.includes('show tables') || lowerCommand.includes('list tables')) {
      if (!quickbase.currentApp) {
        return {
          content: 'Please select an app first. You can say "show apps" to see available applications.',
        };
      }
      const tables = await quickbase.getTables(quickbase.currentApp.id);
      return {
        content: `Found ${tables.length} tables in ${quickbase.currentApp.name}:`,
        metadata: {
          dataType: 'table' as const,
          quickbaseData: tables
        }
      };
    }
    
    if (lowerCommand.includes('query') || lowerCommand.includes('show records') || lowerCommand.includes('get records')) {
      if (!quickbase.currentTable) {
        return {
          content: 'Please select a table first. You can say "show tables" to see available tables.',
        };
      }
      
      const records = await quickbase.queryRecords({
        from: quickbase.currentTable.id,
        options: { top: 10 }
      });
      
      return {
        content: `Showing ${records.length} records from ${quickbase.currentTable.name}:`,
        metadata: {
          dataType: 'record' as const,
          quickbaseData: records
        }
      };
    }
    
    if (lowerCommand.includes('select app')) {
      const appName = command.match(/select app[:\s]+(.+)/i)?.[1];
      if (appName) {
        const app = quickbase.apps.find(a => 
          a.name.toLowerCase().includes(appName.toLowerCase())
        );
        if (app) {
          quickbase.setCurrentApp(app);
          return {
            content: `Selected app: ${app.name}. You can now list tables or perform other operations.`,
          };
        }
      }
      return {
        content: 'App not found. Please check the app name and try again.',
      };
    }
    
    if (lowerCommand.includes('select table')) {
      const tableName = command.match(/select table[:\s]+(.+)/i)?.[1];
      if (tableName) {
        const table = quickbase.tables.find(t => 
          t.name.toLowerCase().includes(tableName.toLowerCase())
        );
        if (table) {
          quickbase.setCurrentTable(table);
          return {
            content: `Selected table: ${table.name}. You can now query records or perform other operations.`,
          };
        }
      }
      return {
        content: 'Table not found. Please check the table name and try again.',
      };
    }
    
    if (lowerCommand.includes('help')) {
      return {
        content: `Here are some commands you can use:
        
• **show apps** - List all QuickBase applications
• **select app [name]** - Select an application to work with
• **show tables** - List tables in the selected app
• **select table [name]** - Select a table to work with
• **show records** - Query records from the selected table
• **create record** - Create a new record (I'll ask for details)
• **analyze [query]** - Analyze data with specific criteria
• **help** - Show this help message

You can also ask questions in natural language about your data!`,
      };
    }
    
    // For other natural language queries, we could integrate with an AI service
    // or use more sophisticated parsing
    return {
      content: `I understand you want to: "${command}". This feature is being developed. Try using commands like "show apps", "show tables", or "help" for available operations.`,
    };
  };

  const handleSend = async () => {
    if (!input.trim() || !isConnected) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const result = await processCommand(input);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        metadata: result.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing command:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process command');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <Card className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
          {isProcessing && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <ChatSuggestions onSelect={handleSuggestion} />
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isConnected ? "Ask about your QuickBase data..." : "Connect to MCP server first..."}
            disabled={!isConnected || isProcessing}
          />
          <Button 
            onClick={handleSend}
            disabled={!isConnected || isProcessing || !input.trim()}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}