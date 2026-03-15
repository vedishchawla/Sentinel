import { motion } from 'framer-motion';
import { GitBranch, Activity } from 'lucide-react';

interface HeaderProps {
  progress: number;
  isRunning: boolean;
}

export function Header({ progress, isRunning }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border backdrop-blur-md bg-background/80">
      {/* Top progress bar - the "Terminal Heartbeat" */}
      <div className="h-[1px] w-full bg-border relative overflow-hidden">
        {isRunning && (
          <motion.div
            className="absolute top-0 left-0 h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'tween', ease: [0.2, 0, 0, 1], duration: 0.5 }}
          />
        )}
      </div>
      
      <div className="flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground tracking-tight">Sentinel</span>
          </div>
          <span className="text-muted-foreground text-xs">|</span>
          <span className="text-muted-foreground text-xs">Autonomous Incident-to-Fix Agent</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitBranch className="h-3 w-3" />
            <span>main</span>
          </div>
          {isRunning && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-xs text-primary">Agent Active</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
