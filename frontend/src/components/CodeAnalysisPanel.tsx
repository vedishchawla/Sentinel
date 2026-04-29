import { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, AlertCircle, Loader2 } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path?: string;
  children?: FileNode[];
  buggy?: boolean;
}

interface CodeAnalysisData {
  buggyFile: string;
  buggyCode: string;
  buggyLines: number[];
  rootCause: string;
  explanation: string;
  fileContents: Record<string, string>;
}

interface CodeAnalysisPanelProps {
  data: CodeAnalysisData | null;
  fileTree: any[] | null;
  relevantFiles: string[];
}

function markBuggyFiles(tree: FileNode[], relevantFiles: string[]): FileNode[] {
  return tree.map(node => {
    if (node.type === 'folder') {
      return {
        ...node,
        children: node.children ? markBuggyFiles(node.children, relevantFiles) : [],
      };
    }
    return {
      ...node,
      buggy: relevantFiles.includes(node.path || node.name),
    };
  });
}

function FileTreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 w-full py-0.5 hover:bg-secondary/50 rounded px-1 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          {open ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
          {open ? <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <span className="text-xs text-foreground">{node.name}</span>
        </button>
        {open && node.children?.map((child) => (
          <FileTreeNode key={child.name} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer transition-colors ${
        node.buggy ? 'bg-destructive/10' : 'hover:bg-secondary/50'
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      <FileCode className={`h-3.5 w-3.5 shrink-0 ${node.buggy ? 'text-destructive' : 'text-muted-foreground'}`} />
      <span className={`text-xs ${node.buggy ? 'text-destructive font-medium' : 'text-foreground'}`}>{node.name}</span>
      {node.buggy && <AlertCircle className="h-3 w-3 text-destructive ml-auto shrink-0" />}
    </div>
  );
}

export function CodeAnalysisPanel({ data, fileTree, relevantFiles }: CodeAnalysisPanelProps) {
  // Waiting state
  if (!data && !fileTree) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary/50" />
          <p className="text-xs">Waiting for codebase analysis...</p>
        </div>
      </div>
    );
  }

  const tree: FileNode[] = fileTree
    ? markBuggyFiles(fileTree as FileNode[], relevantFiles)
    : [];

  const buggyCode = data?.buggyCode || '';
  const buggyLines = data?.buggyLines || [];
  const buggyFile = data?.buggyFile || '';
  const issueCount = buggyLines.length || (relevantFiles.length > 0 ? relevantFiles.length : 0);

  return (
    <div className="space-y-4">
      {/* Root Cause Banner */}
      {data?.rootCause && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-medium text-destructive block">Root Cause Identified</span>
              <span className="text-xs text-foreground/80 mt-1 block">{data.rootCause}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-border rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
        {/* File Explorer */}
        <div className="border-b lg:border-b-0 lg:border-r border-border p-3 overflow-auto max-h-[500px] terminal-scrollbar">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Explorer</div>
          <div className="space-y-0.5">
            {tree.length > 0 ? (
              tree.map((node) => (
                <FileTreeNode key={node.name} node={node} />
              ))
            ) : (
              <p className="text-xs text-muted-foreground/50">No file tree data yet</p>
            )}
          </div>
        </div>

        {/* Code Viewer */}
        <div className="col-span-1 lg:col-span-2 overflow-auto terminal-scrollbar">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-mono text-foreground">{buggyFile || 'No file selected'}</span>
            </div>
            {issueCount > 0 && (
              <span className="text-[10px] text-destructive font-medium">{issueCount} issue(s) detected</span>
            )}
          </div>
          {buggyCode ? (
            <pre className="p-0 text-[13px] leading-[1.6] font-mono">
              {buggyCode.split('\n').map((line, i) => {
                const lineNum = i + 1;
                const isBuggy = buggyLines.includes(lineNum);
                return (
                  <div
                    key={i}
                    className={`flex ${isBuggy ? 'bg-destructive/10' : ''}`}
                  >
                    <span className="w-10 text-right pr-3 text-muted-foreground/50 select-none shrink-0 text-xs leading-[1.6]">
                      {lineNum}
                    </span>
                    <span className={`flex-1 px-2 ${isBuggy ? 'text-destructive' : 'text-foreground/90'}`}>
                      {line || ' '}
                    </span>
                    {isBuggy && (
                      <span className="pr-3 shrink-0">
                        <AlertCircle className="h-3 w-3 text-destructive inline" />
                      </span>
                    )}
                  </div>
                );
              })}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p className="text-xs">Code analysis will appear here...</p>
            </div>
          )}
        </div>
      </div>

      {/* Explanation */}
      {data?.explanation && (
        <div className="p-4 border border-border rounded-lg bg-secondary/30">
          <h4 className="text-xs font-medium text-foreground mb-2">Analysis Explanation</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{data.explanation}</p>
        </div>
      )}
    </div>
  );
}
