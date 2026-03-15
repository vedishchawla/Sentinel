import { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import type { TerminalLine } from '@/hooks/useAgentWorkflow';

interface TerminalPanelProps {
  lines: TerminalLine[];
  isRunning: boolean;
}

export function TerminalPanel({ lines, isRunning }: TerminalPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const colorMap: Record<string, string> = {
    info: 'text-foreground/70',
    success: 'text-primary',
    error: 'text-destructive',
    warning: 'text-warning',
    command: 'text-foreground font-medium',
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
        <TerminalIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">Terminal</span>
        <span className="text-[10px] text-muted-foreground ml-auto font-mono">bash</span>
      </div>
      <div
        ref={scrollRef}
        className="p-3 font-mono text-xs leading-relaxed overflow-auto terminal-scrollbar bg-background min-h-[200px] max-h-[400px]"
      >
        {lines.length === 0 ? (
          <span className="text-muted-foreground/50">Waiting for agent to start...</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground/30 select-none shrink-0 w-14">{line.timestamp}</span>
              <span className={colorMap[line.type] || 'text-foreground/70'}>{line.text}</span>
            </div>
          ))
        )}
        {isRunning && (
          <span className="inline-block w-2 h-4 bg-primary animate-cursor ml-1" />
        )}
      </div>
    </div>
  );
}
