import { GitPullRequest, GitBranch, FileCode, Check } from 'lucide-react';

export function PullRequestView() {
  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg overflow-hidden">
        {/* PR Header */}
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <GitPullRequest className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                fix: cleanup event listeners in auth middleware
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Resolves memory leak caused by orphaned WebSocket listeners. Adds cleanup on close/error events.
              </p>
            </div>
          </div>
        </div>

        {/* PR Metadata */}
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Branch</span>
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-mono text-foreground">fix/ISSUE-402-memory-leak-auth</span>
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
            <span className="text-xs font-mono text-foreground">2</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
            <div className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary font-medium">Ready to merge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Changed Files */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-secondary/30">
          <span className="text-xs font-medium text-foreground">Changed Files</span>
        </div>
        <div>
          {[
            { file: 'src/lib/auth/middleware.ts', additions: 8, deletions: 2 },
            { file: 'src/lib/auth/__tests__/middleware.test.ts', additions: 45, deletions: 0 },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
              <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-foreground flex-1">{f.file}</span>
              <span className="text-[10px] font-mono text-primary">+{f.additions}</span>
              {f.deletions > 0 && <span className="text-[10px] font-mono text-destructive">-{f.deletions}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Commit */}
      <div className="border border-border rounded-lg p-4 bg-secondary/30">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-2">Commit Message</span>
        <p className="text-xs font-mono text-foreground">fix: cleanup event listeners in auth middleware</p>
        <p className="text-xs font-mono text-muted-foreground mt-1">
          Add cleanup handlers for WebSocket 'message' and EventEmitter 'auth:refresh' listeners.
          Listeners are now removed on socket 'close' and 'error' events to prevent memory leaks.
        </p>
        <p className="text-xs font-mono text-muted-foreground mt-2">Resolves #402</p>
      </div>
    </div>
  );
}
