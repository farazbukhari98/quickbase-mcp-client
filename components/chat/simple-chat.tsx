'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuickBaseSimple } from '@/hooks/use-quickbase-simple';
import { Send, Loader2, Database, Table, FileSearch } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  timestamp: Date;
}

export function SimpleChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you explore your QuickBase data. Try commands like "test connection", "list tables", or "help".',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { loading, callTool, testConnection, listTables, queryRecords } = useQuickBaseSimple();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, data?: any) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      data,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const processCommand = async (command: string) => {
    const lower = command.toLowerCase();
    
    try {
      if (lower.includes('test') && lower.includes('connection')) {
        const result = await testConnection();
        return {
          content: 'Connection test successful! QuickBase is ready.',
          data: result
        };
      }
      
      if (lower.includes('list') && lower.includes('table')) {
        const result = await listTables();
        const tables = result?.tables || [];
        return {
          content: `Found ${tables.length} tables:`,
          data: tables
        };
      }
      
      if (lower.includes('query') || lower.includes('records')) {
        // Extract table ID if provided
        const match = command.match(/table[:\s]+(\w+)/i);
        if (match) {
          const tableId = match[1];
          const result = await queryRecords(tableId);
          return {
            content: `Query results from table ${tableId}:`,
            data: result
          };
        } else {
          return {
            content: 'Please specify a table ID. Example: "query records from table bxyz123"'
          };
        }
      }
      
      if (lower.includes('help')) {
        return {
          content: `Available commands:
• **test connection** - Test QuickBase connection
• **list tables** - Show all tables
• **query records from table [ID]** - Get records from a table
• **help** - Show this help message

You can also ask questions in natural language!`
        };
      }
      
      // Try as a direct tool call
      const parts = command.split(' ');
      if (parts.length > 0) {
        const toolName = parts[0];
        const params = parts.length > 1 ? { query: parts.slice(1).join(' ') } : {};
        
        try {
          const result = await callTool(toolName, params);
          return {
            content: `Tool "${toolName}" executed successfully`,
            data: result
          };
        } catch (err) {
          // Not a valid tool, return generic response
        }
      }
      
      return {
        content: `I understand you want to: "${command}". Try "help" to see available commands.`
      };
    } catch (error) {
      console.error('Command error:', error);
      return {
        content: `Error: ${error instanceof Error ? error.message : 'Command failed'}`,
      };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userInput = input;
    setInput('');
    addMessage('user', userInput);

    const result = await processCommand(userInput);
    addMessage('assistant', result.content, result.data);
  };

  return (
    <Card className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {message.role === 'user' ? 'U' : 'A'}
              </div>
              
              <div className="flex flex-col gap-2 max-w-[80%]">
                <Card className={`px-4 py-2 ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : ''
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </Card>
                
                {message.data && (
                  <Card className="p-3 text-sm">
                    <pre className="overflow-x-auto">
                      {JSON.stringify(message.data, null, 2)}
                    </pre>
                  </Card>
                )}
                
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a command or question..."
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('test connection')}
            disabled={loading}
          >
            <Database className="h-3 w-3 mr-1" />
            Test Connection
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('list tables')}
            disabled={loading}
          >
            <Table className="h-3 w-3 mr-1" />
            List Tables
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput('help')}
            disabled={loading}
          >
            Help
          </Button>
        </div>
      </div>
    </Card>
  );
}