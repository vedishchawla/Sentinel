import { motion } from 'framer-motion';
import { Eye, Search, Zap, Code, CheckSquare, Box, Shield, GitPullRequest, Loader2, Check, X } from 'lucide-react';
import type { PipelineStep } from '@/hooks/useAgentWorkflow';

const ICONS: Record<string, React.ElementType> = {
  understanding: Eye,
  analysis: Search,
  root_cause: Zap,
  generation: Code,
  testing: CheckSquare,
  sandbox: Box,
  validation: Shield,
  pr: GitPullRequest,
};

interface PipelineStepperProps {
  steps: PipelineStep[];
  activePanel: string;
  onPanelChange: (panel: string) => void;
}

const PANEL_MAP: Record<string, string> = {
  understanding: 'dashboard',
  analysis: 'code-analysis',
  root_cause: 'code-analysis',
  generation: 'diff',
  testing: 'tests',
  sandbox: 'terminal',
  validation: 'terminal',
  pr: 'pr',
};

export function PipelineStepper({ steps, onPanelChange }: PipelineStepperProps) {
  return (
    <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border p-4 shrink-0">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Pipeline</div>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
        
        <div className="space-y-1">
          {steps.map((step) => {
            const Icon = ICONS[step.id] || Eye;
            const isRunning = step.status === 'running';
            const isCompleted = step.status === 'completed';
            const isFailed = step.status === 'failed';
            
            return (
              <button
                key={step.id}
                onClick={() => onPanelChange(PANEL_MAP[step.id] || 'dashboard')}
                className="flex items-center gap-3 w-full p-2 rounded-md text-left transition-colors duration-150 hover:bg-secondary/50"
              >
                <div className="relative z-10">
                  {isRunning ? (
                    <motion.div
                      className="h-[22px] w-[22px] rounded-full bg-primary/20 flex items-center justify-center"
                      animate={{ boxShadow: ['0 0 8px rgba(34,197,94,0.3)', '0 0 20px rgba(34,197,94,0.6)', '0 0 8px rgba(34,197,94,0.3)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Loader2 className="h-3 w-3 text-primary animate-spin" />
                    </motion.div>
                  ) : isCompleted ? (
                    <div className="h-[22px] w-[22px] rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  ) : isFailed ? (
                    <div className="h-[22px] w-[22px] rounded-full bg-destructive flex items-center justify-center">
                      <X className="h-3 w-3 text-destructive-foreground" />
                    </div>
                  ) : (
                    <div className="h-[22px] w-[22px] rounded-full border border-border bg-background flex items-center justify-center">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium truncate block ${
                    isRunning ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  {step.duration && (
                    <span className="text-[10px] text-muted-foreground">{step.duration}s</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
