'use client';

import { Button } from '@/components/ui/button';
import { useQuickBase } from '@/hooks/use-quickbase';
import { 
  Database, 
  Table, 
  FileSearch, 
  Plus, 
  HelpCircle,
  BarChart3 
} from 'lucide-react';

interface ChatSuggestionsProps {
  onSelect: (suggestion: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  const { currentApp, currentTable } = useQuickBase();

  const suggestions = [
    {
      text: 'Show apps',
      icon: Database,
      enabled: true,
    },
    {
      text: 'Show tables',
      icon: Table,
      enabled: !!currentApp,
    },
    {
      text: 'Show records',
      icon: FileSearch,
      enabled: !!currentTable,
    },
    {
      text: 'Create record',
      icon: Plus,
      enabled: !!currentTable,
    },
    {
      text: 'Analyze data',
      icon: BarChart3,
      enabled: !!currentTable,
    },
    {
      text: 'Help',
      icon: HelpCircle,
      enabled: true,
    },
  ];

  return (
    <div className="px-4 py-2 border-t">
      <div className="flex gap-2 flex-wrap">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <Button
              key={suggestion.text}
              variant="outline"
              size="sm"
              onClick={() => onSelect(suggestion.text)}
              disabled={!suggestion.enabled}
              className="flex items-center gap-1"
            >
              <Icon className="h-3 w-3" />
              <span>{suggestion.text}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}