import { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocket, type WSMessage } from './useWebSocket';

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

export interface ReasoningEntry {
  stepId: string;
  thought: string;
}

// Data payloads received from backend
export interface PipelineData {
  fileTree: any[] | null;
  relevantFiles: string[];
  codeAnalysis: {
    buggyFile: string;
    buggyCode: string;
    buggyLines: number[];
    rootCause: string;
    explanation: string;
    fileContents: Record<string, string>;
  } | null;
  diff: {
    diff: string;
    fixDescription: string;
    filesToModify: Record<string, { original: string; fixed: string }>;
    linesAdded: number;
    linesRemoved: number;
    riskLevel: string;
    riskExplanation: string;
  } | null;
  tests: {
    testFilePath: string;
    testContent: string;
    testCount: number;
    testNames: string[];
    testFramework: string;
  } | null;
  testResults: {
    testsPassed: number;
    testsFailed: number;
    output: string;
    results?: { name: string; status: string; time: string }[];
  } | null;
  prData: {
    success: boolean;
    prUrl: string | null;
    prNumber: number | null;
    branch: string;
    title?: string;
    filesChanged: number;
    error?: string;
  } | null;
  report: any | null;
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

export function useAgentWorkflow() {
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [reasoningEntries, setReasoningEntries] = useState<ReasoningEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activePanel, setActivePanel] = useState<string>('dashboard');
  const [progress, setProgress] = useState(0);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineData>({
    fileTree: null,
    relevantFiles: [],
    codeAnalysis: null,
    diff: null,
    tests: null,
    testResults: null,
    prData: null,
    report: null,
  });
  const [error, setError] = useState<string | null>(null);

  const { status: wsStatus, connect, disconnect, addHandler } = useWebSocket();

  // Panel mapping for auto-switching
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

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((msg: WSMessage) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    switch (msg.type) {
      case 'step_update': {
        const { step_id, status, duration } = msg.data;
        setSteps(prev => prev.map(s =>
          s.id === step_id
            ? { ...s, status: status as StepStatus, duration: duration ?? s.duration }
            : s
        ));
        // Auto-switch panel when a step starts running
        if (status === 'running' && panelMap[step_id]) {
          setActivePanel(panelMap[step_id]);
        }
        break;
      }

      case 'terminal': {
        const { text, type } = msg.data;
        setTerminalLines(prev => [...prev, {
          text,
          type: type as TerminalLine['type'],
          timestamp: msg.timestamp || ts,
        }]);
        break;
      }

      case 'reasoning': {
        const { step_id, thought } = msg.data;
        setReasoningEntries(prev => [...prev, { stepId: step_id, thought }]);
        break;
      }

      case 'progress': {
        const p = msg.data.progress ?? msg.data;
        if (typeof p === 'number') setProgress(p);
        if (msg.data.incident_id) setIncidentId(msg.data.incident_id);
        break;
      }

      case 'file_tree':
        setPipelineData(prev => ({
          ...prev,
          fileTree: msg.data.tree,
          relevantFiles: msg.data.relevant_files || [],
        }));
        break;

      case 'code_analysis':
        setPipelineData(prev => ({
          ...prev,
          codeAnalysis: {
            buggyFile: msg.data.buggy_file,
            buggyCode: msg.data.buggy_code,
            buggyLines: msg.data.buggy_lines || [],
            rootCause: msg.data.root_cause,
            explanation: msg.data.explanation,
            fileContents: msg.data.file_contents || {},
          },
        }));
        break;

      case 'diff':
        setPipelineData(prev => ({
          ...prev,
          diff: {
            diff: msg.data.diff,
            fixDescription: msg.data.fix_description,
            filesToModify: msg.data.files_to_modify || {},
            linesAdded: msg.data.lines_added || 0,
            linesRemoved: msg.data.lines_removed || 0,
            riskLevel: msg.data.risk_level || 'unknown',
            riskExplanation: msg.data.risk_explanation || '',
          },
        }));
        break;

      case 'tests':
        setPipelineData(prev => ({
          ...prev,
          tests: {
            testFilePath: msg.data.test_file_path,
            testContent: msg.data.test_content,
            testCount: msg.data.test_count || 0,
            testNames: msg.data.test_names || [],
            testFramework: msg.data.test_framework || '',
          },
        }));
        break;

      case 'pr_data':
        setPipelineData(prev => ({
          ...prev,
          prData: {
            success: msg.data.success,
            prUrl: msg.data.pr_url,
            prNumber: msg.data.pr_number,
            branch: msg.data.branch || '',
            title: msg.data.title,
            filesChanged: msg.data.files_changed || 0,
            error: msg.data.error,
          },
        }));
        break;

      case 'report':
        setPipelineData(prev => ({ ...prev, report: msg.data }));
        setActivePanel('report');
        break;

      case 'complete':
        setIsRunning(false);
        setActivePanel('report');
        break;

      case 'error':
        setError(msg.data.error || 'Unknown error');
        setIsRunning(false);
        break;
    }
  }, []);

  // Register message handler
  useEffect(() => {
    const unsubscribe = addHandler(handleMessage);
    return unsubscribe;
  }, [addHandler, handleMessage]);

  const runWorkflow = useCallback((description: string, repoUrl: string, environment: string) => {
    // Reset state
    setSteps(INITIAL_STEPS);
    setTerminalLines([]);
    setReasoningEntries([]);
    setProgress(0);
    setIncidentId(null);
    setError(null);
    setPipelineData({
      fileTree: null,
      relevantFiles: [],
      codeAnalysis: null,
      diff: null,
      tests: null,
      testResults: null,
      prData: null,
      report: null,
    });
    setIsRunning(true);
    setActivePanel('dashboard');

    // Connect and start
    connect({
      description,
      repo_url: repoUrl,
      environment,
    });
  }, [connect]);

  const reset = useCallback(() => {
    disconnect();
    setSteps(INITIAL_STEPS);
    setTerminalLines([]);
    setReasoningEntries([]);
    setIsRunning(false);
    setActivePanel('dashboard');
    setProgress(0);
    setIncidentId(null);
    setError(null);
    setPipelineData({
      fileTree: null,
      relevantFiles: [],
      codeAnalysis: null,
      diff: null,
      tests: null,
      testResults: null,
      prData: null,
      report: null,
    });
  }, [disconnect]);

  return {
    steps,
    terminalLines,
    reasoningEntries,
    isRunning,
    activePanel,
    setActivePanel,
    progress,
    incidentId,
    pipelineData,
    error,
    wsStatus,
    runWorkflow,
    reset,
  };
}
