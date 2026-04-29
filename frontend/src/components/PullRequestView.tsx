import { GitPullRequest, GitBranch, FileCode, Check, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';

interface PRData {
  success: boolean;
  prUrl: string | null;
  prNumber: number | null;
  branch: string;
  title?: string;
  filesChanged: number;
  error?: string;
}

interface PullRequestViewProps {
  data: PRData | null;
}

export function PullRequestView({ data }: PullRequestViewProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary/50" />
          <p className="text-xs">Waiting for PR creation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!data.success && data.error && (
        <div className="p-3 rounded-lg border border-warning/30 bg-warning/5">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-medium text-warning block">PR Creation Skipped</span>
              <span className="text-xs text-foreground/70 mt-1 block">{data.error}</span>
              {data.error.includes('token') && (
                <span className="text-xs text-muted-foreground mt-1 block">
                  Configure your GitHub token in Settings to enable automatic PR creation.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex items-start gap-3">
            <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${data.success ? 'bg-primary/20' : 'bg-secondary'}`}>
              <GitPullRequest className={`h-4 w-4 ${data.success ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{data.title || 'fix: autonomous fix by Sentinel'}</h3>
              {data.prUrl && (
                <a href={data.prUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                  View on GitHub <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Branch</span>
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-mono text-foreground truncate">{data.branch || 'N/A'}</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Base</span>
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-mono text-foreground">main</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Files Changed</span>
            <span className="text-xs font-mono text-foreground">{data.filesChanged}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
            <div className="flex items-center gap-1.5">
              {data.success ? (
                <><Check className="h-3 w-3 text-primary" /><span className="text-xs text-primary font-medium">PR #{data.prNumber} Created</span></>
              ) : (
                <><AlertCircle className="h-3 w-3 text-warning" /><span className="text-xs text-warning font-medium">Fix Ready (No PR)</span></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
