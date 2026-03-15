import { useState, useCallback, useRef } from 'react';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  duration?: number;
}

export interface TerminalLine {
  text: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'command';
  timestamp: string;
}

const INITIAL_STEPS: PipelineStep[] = [
  { id: 'understanding', label: 'Ticket Understanding' },
  { id: 'analysis', label: 'Codebase Analysis' },
  { id: 'root_cause', label: 'Root Cause Detection' },
  { id: 'generation', label: 'Fix Generation' },
  { id: 'testing', label: 'Test Generation' },
  { id: 'sandbox', label: 'Sandbox Execution' },
  { id: 'validation', label: 'Validation' },
  { id: 'pr', label: 'Pull Request Creation' },
].map(s => ({ ...s, status: 'pending' as StepStatus }));

const TERMINAL_LOGS: Record<string, TerminalLine[]> = {
  understanding: [
    { text: '$ sentinel analyze --ticket ISSUE-402', type: 'command', timestamp: '' },
    { text: 'Parsing ticket metadata...', type: 'info', timestamp: '' },
    { text: 'Extracting error signatures from stack trace', type: 'info', timestamp: '' },
    { text: 'Identified: Memory leak in authentication middleware', type: 'success', timestamp: '' },
    { text: 'Priority: P1 | Severity: High | Component: auth', type: 'info', timestamp: '' },
  ],
  analysis: [
    { text: '$ sentinel scan --repo acme/backend --depth 3', type: 'command', timestamp: '' },
    { text: 'Scanning repository structure... 847 files indexed', type: 'info', timestamp: '' },
    { text: 'Building dependency graph...', type: 'info', timestamp: '' },
    { text: 'Identified 3 relevant files in src/lib/auth/', type: 'success', timestamp: '' },
    { text: 'Call graph: middleware.ts → session.ts → cache.ts', type: 'info', timestamp: '' },
  ],
  root_cause: [
    { text: '$ sentinel diagnose --target src/lib/auth/middleware.ts', type: 'command', timestamp: '' },
    { text: 'Analyzing control flow paths...', type: 'info', timestamp: '' },
    { text: 'Detecting memory allocation patterns...', type: 'info', timestamp: '' },
    { text: '⚠ Found: Event listener not cleaned up on disconnect', type: 'warning', timestamp: '' },
    { text: 'Root cause: Missing cleanup in useEffect at line 47', type: 'success', timestamp: '' },
    { text: 'Confidence: 94.2%', type: 'success', timestamp: '' },
  ],
  generation: [
    { text: '$ sentinel fix --strategy minimal-patch', type: 'command', timestamp: '' },
    { text: 'Generating fix candidates...', type: 'info', timestamp: '' },
    { text: 'Candidate 1: Add cleanup function to useEffect', type: 'info', timestamp: '' },
    { text: 'Candidate 2: Refactor to AbortController pattern', type: 'info', timestamp: '' },
    { text: 'Selected: Candidate 1 (minimal change, lowest risk)', type: 'success', timestamp: '' },
    { text: 'Patch generated: +8 lines, -2 lines across 2 files', type: 'success', timestamp: '' },
  ],
  testing: [
    { text: '$ sentinel test-gen --coverage target', type: 'command', timestamp: '' },
    { text: 'Generating unit tests for middleware.ts...', type: 'info', timestamp: '' },
    { text: 'Generated 4 test cases covering fix paths', type: 'success', timestamp: '' },
    { text: 'Generating integration test for auth flow...', type: 'info', timestamp: '' },
    { text: 'Generated 2 integration tests', type: 'success', timestamp: '' },
  ],
  sandbox: [
    { text: '$ npm install', type: 'command', timestamp: '' },
    { text: 'Installing dependencies... done (4.2s)', type: 'info', timestamp: '' },
    { text: '$ npm run test -- --filter auth', type: 'command', timestamp: '' },
    { text: '  ✓ should cleanup listeners on unmount (12ms)', type: 'success', timestamp: '' },
    { text: '  ✓ should not leak memory on rapid reconnect (45ms)', type: 'success', timestamp: '' },
    { text: '  ✓ should handle concurrent sessions (23ms)', type: 'success', timestamp: '' },
    { text: '  ✓ should abort pending requests on cleanup (8ms)', type: 'success', timestamp: '' },
    { text: '  ✓ integration: full auth flow with cleanup (156ms)', type: 'success', timestamp: '' },
    { text: '  ✓ integration: reconnect stress test (203ms)', type: 'success', timestamp: '' },
    { text: '', type: 'info', timestamp: '' },
    { text: 'Tests: 6 passed, 0 failed', type: 'success', timestamp: '' },
    { text: 'Coverage: 94.7% statements, 91.2% branches', type: 'success', timestamp: '' },
  ],
  validation: [
    { text: '$ sentinel validate --all', type: 'command', timestamp: '' },
    { text: 'Running type checker... ✓ No errors', type: 'success', timestamp: '' },
    { text: 'Running linter... ✓ No warnings', type: 'success', timestamp: '' },
    { text: 'Running full test suite... ✓ 847/847 passed', type: 'success', timestamp: '' },
    { text: 'Memory profile: No leaks detected in 10min soak test', type: 'success', timestamp: '' },
    { text: 'Validation passed. Fix is ready for review.', type: 'success', timestamp: '' },
  ],
  pr: [
    { text: '$ git checkout -b fix/ISSUE-402-memory-leak-auth', type: 'command', timestamp: '' },
    { text: 'Switched to new branch \'fix/ISSUE-402-memory-leak-auth\'', type: 'info', timestamp: '' },
    { text: '$ git add -A && git commit -m "fix: cleanup event listeners in auth middleware"', type: 'command', timestamp: '' },
    { text: '[fix/ISSUE-402] 1 commit, 2 files changed, +8 -2', type: 'info', timestamp: '' },
    { text: '$ gh pr create --title "fix: memory leak in auth middleware" --body "..."', type: 'command', timestamp: '' },
    { text: 'Pull Request #1847 created successfully', type: 'success', timestamp: '' },
    { text: 'https://github.com/acme/backend/pull/1847', type: 'success', timestamp: '' },
  ],
};

export function useAgentWorkflow() {
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activePanel, setActivePanel] = useState<string>('dashboard');
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(false);

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
  };

  const runWorkflow = useCallback(async () => {
    setIsRunning(true);
    abortRef.current = false;
    setTerminalLines([]);
    setSteps(INITIAL_STEPS);
    setProgress(0);

    const stepIds = INITIAL_STEPS.map(s => s.id);
    
    for (let i = 0; i < stepIds.length; i++) {
      if (abortRef.current) break;
      
      const stepId = stepIds[i];
      
      // Set current step to running
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, status: 'running' } : s
      ));
      setProgress(((i) / stepIds.length) * 100);

      // Map step to panel
      const panelMap: Record<string, string> = {
        understanding: 'dashboard',
        analysis: 'code-analysis',
        root_cause: 'code-analysis',
        generation: 'diff',
        testing: 'tests',
        sandbox: 'terminal',
        validation: 'terminal',
        pr: 'pr',
      };
      setActivePanel(panelMap[stepId] || 'dashboard');

      // Stream terminal lines
      const logs = TERMINAL_LOGS[stepId] || [];
      for (const log of logs) {
        if (abortRef.current) break;
        await new Promise(r => setTimeout(r, 150 + Math.random() * 250));
        setTerminalLines(prev => [...prev, { ...log, timestamp: now() }]);
      }

      // Complete step
      await new Promise(r => setTimeout(r, 300));
      const duration = 1 + Math.random() * 3;
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, status: 'completed', duration: parseFloat(duration.toFixed(1)) } : s
      ));
      setProgress(((i + 1) / stepIds.length) * 100);
    }

    if (!abortRef.current) {
      setActivePanel('report');
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setSteps(INITIAL_STEPS);
    setTerminalLines([]);
    setIsRunning(false);
    setActivePanel('dashboard');
    setProgress(0);
  }, []);

  return { steps, terminalLines, isRunning, activePanel, setActivePanel, progress, runWorkflow, reset };
}
