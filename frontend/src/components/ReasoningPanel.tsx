import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, Loader2 } from 'lucide-react';
import type { PipelineStep } from '@/hooks/useAgentWorkflow';

interface ReasoningEntry {
  stepId: string;
  thoughts: string[];
}

const REASONING_DATA: ReasoningEntry[] = [
  {
    stepId: 'understanding',
    thoughts: [
      'Parsing ticket ISSUE-402 metadata...',
      'Detected error type: Memory Leak',
      'Component identified: auth middleware',
      'Priority: P1 | Severity: High',
      'Extracted stack trace from description',
    ],
  },
  {
    stepId: 'analysis',
    thoughts: [
      'Scanning acme/backend repository...',
      'Building dependency graph for auth module',
      'Analyzing src/lib/auth/middleware.ts',
      'Found event listener patterns in handleConnection()',
      'Call graph: middleware.ts → session.ts → cache.ts',
    ],
  },
  {
    stepId: 'root_cause',
    thoughts: [
      'Analyzing control flow in handleConnection()',
      'Detected: WebSocket "message" listener registered on connect',
      'Detected: EventEmitter "auth:refresh" listener registered',
      'Neither cleaned up on socket close/error',
      'Root cause: Missing cleanup in event handlers at line 47',
      'Confidence: 94.2%',
    ],
  },
  {
    stepId: 'generation',
    thoughts: [
      'Strategy: minimal-patch (lowest risk)',
      'Candidate 1: Add cleanup function to disconnect handler',
      'Candidate 2: Refactor to AbortController pattern',
      'Selected: Candidate 1 — minimal change, zero structural risk',
      'Patch: +8 lines, -2 lines across 2 files',
    ],
  },
  {
    stepId: 'testing',
    thoughts: [
      'Generating unit tests for middleware.ts',
      'Test: should cleanup listeners on unmount',
      'Test: should not leak memory on rapid reconnect',
      'Test: should handle concurrent sessions',
      'Test: should abort pending requests on cleanup',
      'Generated 4 unit + 2 integration tests',
    ],
  },
  {
    stepId: 'sandbox',
    thoughts: [
      'Spinning up isolated Docker container...',
      'Installing dependencies (4.2s)',
      'Running test suite with fix applied',
      'All 6 new tests passing',
      'Coverage: 94.7% statements, 91.2% branches',
    ],
  },
  {
    stepId: 'validation',
    thoughts: [
      'Type checker: No errors',
      'Linter: No warnings',
      'Full test suite: 847/847 passed',
      'Memory profile: No leaks in 10min soak test',
      'Validation complete — fix is safe',
    ],
  },
  {
    stepId: 'pr',
    thoughts: [
      'Creating branch: fix/ISSUE-402-memory-leak-auth',
      'Committing changes: 2 files, +8 -2',
      'Opening PR #1847 against main',
      'PR created successfully',
    ],
  },
];

interface ReasoningPanelProps {
  steps: PipelineStep[];
  isRunning: boolean;
}

export function ReasoningPanel({ steps, isRunning }: ReasoningPanelProps) {
  const [visibleThoughts, setVisibleThoughts] = useState<Record<string, string[]>>({});
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  useEffect(() => {
    const completedOrRunning = steps.filter(s => s.status === 'completed' || s.status === 'running');
    const newThoughts: Record<string, string[]> = {};
    
    for (const step of completedOrRunning) {
      const data = REASONING_DATA.find(r => r.stepId === step.id);
      if (data) {
        newThoughts[step.id] = step.status === 'completed' ? data.thoughts : data.thoughts.slice(0, -1);
      }
    }
    setVisibleThoughts(newThoughts);

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
          const thoughts = visibleThoughts[step.id] || [];
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
