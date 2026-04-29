import { FileCode, Loader2 } from 'lucide-react';

interface DiffData {
  diff: string;
  fixDescription: string;
  filesToModify: Record<string, { original: string; fixed: string }>;
  linesAdded: number;
  linesRemoved: number;
  riskLevel: string;
  riskExplanation: string;
}

interface DiffViewerProps {
  data: DiffData | null;
}

function parseDiffLines(diff: string) {
  return diff.split('\n').map((line, i) => {
    let type: 'add' | 'remove' | 'context' | 'header' = 'context';
    if (line.startsWith('+') && !line.startsWith('+++')) type = 'add';
    else if (line.startsWith('-') && !line.startsWith('---')) type = 'remove';
    else if (line.startsWith('@@') || line.startsWith('diff') || line.startsWith('---') || line.startsWith('+++')) type = 'header';
    return { type, text: line, index: i };
  });
}

export function DiffViewer({ data }: DiffViewerProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary/50" />
          <p className="text-xs">Waiting for fix generation...</p>
        </div>
      </div>
    );
  }

  const diffLines = data.diff ? parseDiffLines(data.diff) : [];
  const files = Object.keys(data.filesToModify || {});

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Generated Patch</h3>
        <p className="text-xs text-muted-foreground">{data.fixDescription}</p>
      </div>

      {/* Diff View */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
          <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-foreground">
            {files.length > 0 ? files[0] : 'unified diff'}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            <span className="text-primary">+{data.linesAdded}</span>
            {' '}
            <span className="text-destructive">-{data.linesRemoved}</span>
          </span>
        </div>

        <pre className="text-[13px] leading-[1.6] font-mono overflow-x-auto terminal-scrollbar max-h-[500px]">
          {diffLines.length > 0 ? diffLines.map((line, i) => {
            const bgClass = line.type === 'add'
              ? 'bg-emerald-500/10'
              : line.type === 'remove'
              ? 'bg-red-500/10'
              : line.type === 'header'
              ? 'bg-blue-500/5'
              : '';
            const textClass = line.type === 'add'
              ? 'text-emerald-400'
              : line.type === 'remove'
              ? 'text-red-400'
              : line.type === 'header'
              ? 'text-blue-400'
              : 'text-foreground/70';

            return (
              <div key={i} className={`flex ${bgClass}`}>
                <span className={`flex-1 px-3 ${textClass}`}>
                  {line.text || ' '}
                </span>
              </div>
            );
          }) : (
            <div className="p-4 text-center text-muted-foreground text-xs">No diff available</div>
          )}
        </pre>
      </div>

      {/* Risk & Explanation */}
      <div className="p-4 border border-border rounded-lg bg-secondary/30">
        <div className="flex items-center gap-2 mb-2">
          <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            data.riskLevel === 'low' ? 'bg-primary/10 text-primary' :
            data.riskLevel === 'medium' ? 'bg-warning/10 text-warning' :
            'bg-destructive/10 text-destructive'
          }`}>
            {data.riskLevel?.toUpperCase()} RISK
          </div>
          <span className="text-xs font-medium text-foreground">Fix Explanation</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {data.riskExplanation || 'No risk assessment available.'}
        </p>
      </div>
    </div>
  );
}
