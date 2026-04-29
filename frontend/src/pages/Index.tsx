import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { PipelineStepper } from '@/components/PipelineStepper';
import { IncidentInput } from '@/components/IncidentInput';
import { CodeAnalysisPanel } from '@/components/CodeAnalysisPanel';
import { DiffViewer } from '@/components/DiffViewer';
import { TestPanel } from '@/components/TestPanel';
import { TerminalPanel } from '@/components/TerminalPanel';
import { PullRequestView } from '@/components/PullRequestView';
import { ResolutionReport } from '@/components/ResolutionReport';
import { ReasoningPanel } from '@/components/ReasoningPanel';
import { useAgentWorkflow } from '@/hooks/useAgentWorkflow';
import { fetchHealth } from '@/lib/api';
import { RotateCcw, History, Settings, AlertCircle, WifiOff } from 'lucide-react';

const PANEL_TITLES: Record<string, string> = {
  dashboard: 'Incident Dashboard',
  'code-analysis': 'Code Analysis',
  diff: 'Fix Generation',
  tests: 'Test Generation',
  terminal: 'Sandbox Execution',
  pr: 'Pull Request',
  report: 'Resolution Report',
};

const PANEL_TABS = [
  { id: 'dashboard', label: 'Input' },
  { id: 'code-analysis', label: 'Analysis' },
  { id: 'diff', label: 'Diff' },
  { id: 'tests', label: 'Tests' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'pr', label: 'PR' },
  { id: 'report', label: 'Report' },
];

const transition = { type: 'tween' as const, ease: [0.2, 0, 0, 1] as [number, number, number, number], duration: 0.2 };

const Index = () => {
  const {
    steps, terminalLines, reasoningEntries, isRunning,
    activePanel, setActivePanel, progress, pipelineData,
    error, wsStatus, runWorkflow, reset,
  } = useAgentWorkflow();
  const navigate = useNavigate();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header progress={progress} isRunning={isRunning} />

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 py-3 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-xs text-destructive">{error}</span>
          <button onClick={reset} className="ml-auto text-xs text-destructive underline">Reset</button>
        </motion.div>
      )}

      {/* Backend Offline Banner */}
      {backendOnline === false && !isRunning && (
        <div className="px-4 py-3 bg-warning/5 border-b border-warning/20 flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-warning shrink-0" />
          <span className="text-xs text-warning">Backend not connected. Start it with: <code className="font-mono bg-warning/10 px-1.5 py-0.5 rounded">cd backend && python main.py</code></span>
          <button onClick={() => navigate('/settings')} className="ml-auto text-xs text-warning underline shrink-0">Settings</button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Pipeline Sidebar */}
        <PipelineStepper steps={steps} activePanel={activePanel} onPanelChange={setActivePanel} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto">
            {PANEL_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 shrink-0 ${
                  activePanel === tab.id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
            
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* Connection indicator */}
              {isRunning && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    wsStatus === 'connected' ? 'bg-primary animate-pulse' :
                    wsStatus === 'connecting' ? 'bg-warning animate-pulse' :
                    'bg-destructive'
                  }`} />
                  <span className="hidden sm:inline">{wsStatus}</span>
                </div>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <Settings className="h-3 w-3" />
                Settings
              </button>
              <button
                onClick={() => navigate('/incidents')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <History className="h-3 w-3" />
                History
              </button>
              {(isRunning || steps.some(s => s.status === 'completed')) && (
                <button
                  onClick={reset}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Panel + Reasoning split */}
          <div className="flex-1 flex overflow-hidden">
            {/* Panel Content */}
            <div className="flex-1 overflow-auto p-4 lg:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={transition}
                >
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-foreground">{PANEL_TITLES[activePanel]}</h2>
                  </div>

                  {activePanel === 'dashboard' && (
                    <IncidentInput onRun={runWorkflow} isRunning={isRunning} />
                  )}
                  {activePanel === 'code-analysis' && (
                    <CodeAnalysisPanel data={pipelineData.codeAnalysis} fileTree={pipelineData.fileTree} relevantFiles={pipelineData.relevantFiles} />
                  )}
                  {activePanel === 'diff' && (
                    <DiffViewer data={pipelineData.diff} />
                  )}
                  {activePanel === 'tests' && (
                    <TestPanel data={pipelineData.tests} results={pipelineData.testResults} />
                  )}
                  {activePanel === 'terminal' && (
                    <TerminalPanel lines={terminalLines} isRunning={isRunning} />
                  )}
                  {activePanel === 'pr' && (
                    <PullRequestView data={pipelineData.prData} />
                  )}
                  {activePanel === 'report' && (
                    <ResolutionReport data={pipelineData.report} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Reasoning Panel (right side) */}
            <div className="hidden xl:block w-72 border-l border-border shrink-0">
              <ReasoningPanel steps={steps} isRunning={isRunning} entries={reasoningEntries} />
            </div>
          </div>

          {/* Bottom Terminal (always visible when running) */}
          {isRunning && activePanel !== 'terminal' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={transition}
              className="border-t border-border"
            >
              <div className="h-[160px]">
                <TerminalPanel lines={terminalLines.slice(-8)} isRunning={isRunning} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
