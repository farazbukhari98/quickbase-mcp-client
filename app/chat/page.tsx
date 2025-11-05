'use client';

import { AIChatInterface } from '@/components/chat/ai-chat';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col max-w-6xl mx-auto p-2 sm:p-4">
        <div className="mb-3 sm:mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-2 h-10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">QuickBase Chat</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Chat with your QuickBase data using natural language - Powered by Claude Sonnet 4
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <AIChatInterface />
        </div>
      </div>
    </div>
  );
}
