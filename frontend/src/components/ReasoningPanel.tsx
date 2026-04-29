import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, Loader2 } from 'lucide-react';
import type { PipelineStep } from '@/hooks/useAgentWorkflow';
import type { ReasoningEntry } from '@/hooks/useAgentWorkflow';

interface ReasoningPanelProps {
  steps: PipelineStep[];
  isRunning: boolean;
  entries: ReasoningEntry[];
}

export function ReasoningPanel({ steps, isRunning, entries }: ReasoningPanelProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Group entries by step
  const groupedEntries = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const entry of entries) {
      if (!groups[entry.stepId]) groups[entry.stepId] = [];
      groups[entry.stepId].push(entry.thought);
    }
    return groups;
  }, [entries]);

  // Auto-expand the currently running step
  useEffect(() => {
    const running = steps.find(s => s.status === 'running');
    if (running) setExpandedStep(running.id);
  }, [steps]);

  const activeSteps = steps.filter(s => s.status !== 'pending');

  if (activeSteps.length === 0 && !isRunning) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Brain className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">AI Agent Reasoning</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground/50 text-center">
            Agent reasoning will appear here during execution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Brain className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">AI Agent Reasoning</span>
        {isRunning && <Loader2 className="h-3 w-3 text-primary animate-spin ml-auto" />}
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-1 terminal-scrollbar">
        {activeSteps.map((step) => {
          const thoughts = groupedEntries[step.id] || [];
          const isExpanded = expandedStep === step.id;
          const isActive = step.status === 'running';

          return (
            <div key={step.id}>
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50 text-foreground'
                }`}
              >
                <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                <span className="font-medium truncate">{step.label}</span>
                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse ml-auto shrink-0" />}
                {thoughts.length > 0 && !isActive && (
                  <span className="text-[10px] text-muted-foreground ml-auto">{thoughts.length}</span>
                )}
              </button>
              
              <AnimatePresence>
                {isExpanded && thoughts.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-7 pr-2 py-1 space-y-0.5">
                      {thoughts.map((t, i) => (
                        <div key={i} className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                          <span className="text-muted-foreground/30 shrink-0">→</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
