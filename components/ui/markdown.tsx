'use client';

import React from 'react';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  // Simple markdown parser for chat messages
  const parseMarkdown = (text: string) => {
    // Split by lines to handle line breaks properly
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Check if line is a numbered list item
      const numberedListMatch = line.match(/^(\d+)\.\s(.+)$/);
      if (numberedListMatch) {
        const [, number, text] = numberedListMatch;
        return (
          <div key={lineIndex} className="flex gap-2">
            <span className="font-medium">{number}.</span>
            <span>{parseInlineMarkdown(text)}</span>
          </div>
        );
      }
      
      // Check if line is a bullet list item
      const bulletListMatch = line.match(/^[\*\-]\s(.+)$/);
      if (bulletListMatch) {
        const [, text] = bulletListMatch;
        return (
          <div key={lineIndex} className="flex gap-2">
            <span>•</span>
            <span>{parseInlineMarkdown(text)}</span>
          </div>
        );
      }
      
      // Regular line
      return (
        <div key={lineIndex}>
          {parseInlineMarkdown(line)}
        </div>
      );
    });
  };
  
  const parseInlineMarkdown = (text: string) => {
    if (!text) return null;
    
    // Parse bold text
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };
  
  return (
    <div className={`space-y-1 ${className}`}>
      {parseMarkdown(content)}
    </div>
  );
}