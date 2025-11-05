'use client';

import { ChatMessage } from '@/types/chat';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { User, Bot, AlertCircle } from 'lucide-react';
import { DataDisplay } from './data-display';

interface ChatMessageComponentProps {
  message: ChatMessage;
}

export function ChatMessageComponent({ message }: ChatMessageComponentProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser && "items-end")}>
        <Card className={cn(
          "px-4 py-2",
          isUser && "bg-primary text-primary-foreground"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {message.metadata?.error && (
            <div className="mt-2 flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{message.metadata.error}</span>
            </div>
          )}
        </Card>
        
        {message.metadata?.quickbaseData && (
          <DataDisplay 
            data={message.metadata.quickbaseData}
            dataType={message.metadata.dataType}
          />
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground" suppressHydrationWarning>
            {typeof window !== 'undefined' ? message.timestamp.toLocaleTimeString() : ''}
          </span>
          {message.metadata?.tool && (
            <Badge variant="outline" className="text-xs">
              {message.metadata.tool}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}