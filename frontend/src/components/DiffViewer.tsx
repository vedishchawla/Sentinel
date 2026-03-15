import { FileCode } from 'lucide-react';

const DIFF_LINES = [
  { type: 'context', num: [18, 18], text: '  async handleConnection(socket: WebSocket) {' },
  { type: 'context', num: [19, 19], text: '    const listener = (data: any) => {' },
  { type: 'context', num: [20, 20], text: '      this.processAuth(data);' },
  { type: 'context', num: [21, 21], text: '    };' },
  { type: 'context', num: [22, 22], text: '' },
  { type: 'remove', num: [23, null], text: '    // BUG: Listener is never removed on disconnect' },
  { type: 'remove', num: [24, null], text: '    socket.addEventListener(\'message\', listener);' },
  { type: 'remove', num: [25, null], text: '    this.emitter.on(\'auth:refresh\', listener);' },
  { type: 'add', num: [null, 23], text: '    socket.addEventListener(\'message\', listener);' },
  { type: 'add', num: [null, 24], text: '    this.emitter.on(\'auth:refresh\', listener);' },
  { type: 'add', num: [null, 25], text: '' },
  { type: 'add', num: [null, 26], text: '    // Cleanup listeners on disconnect' },
  { type: 'add', num: [null, 27], text: '    const cleanup = () => {' },
  { type: 'add', num: [null, 28], text: '      socket.removeEventListener(\'message\', listener);' },
  { type: 'add', num: [null, 29], text: '      this.emitter.off(\'auth:refresh\', listener);' },
  { type: 'add', num: [null, 30], text: '    };' },
  { type: 'add', num: [null, 31], text: '    socket.addEventListener(\'close\', cleanup);' },
  { type: 'add', num: [null, 32], text: '    socket.addEventListener(\'error\', cleanup);' },
  { type: 'context', num: [26, 33], text: '  }' },
  { type: 'context', num: [27, 34], text: '' },
];

export function DiffViewer() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Generated Patch</h3>
        <p className="text-xs text-muted-foreground">Minimal fix: Add cleanup handlers for event listeners on socket disconnect and error events.</p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
          <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-foreground">src/lib/auth/middleware.ts</span>
          <span className="ml-auto text-[10px] text-muted-foreground">+8 -3</span>
        </div>

        <pre className="text-[13px] leading-[1.6] font-mono overflow-x-auto terminal-scrollbar">
          {DIFF_LINES.map((line, i) => {
            const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
            const bgClass = line.type === 'add'
              ? 'bg-emerald-500/10'
              : line.type === 'remove'
              ? 'bg-red-500/10'
              : '';
            const textClass = line.type === 'add'
              ? 'text-emerald-400'
              : line.type === 'remove'
              ? 'text-red-400'
              : 'text-foreground/70';

            return (
              <div key={i} className={`flex ${bgClass}`}>
                <span className="w-10 text-right pr-2 text-muted-foreground/40 select-none shrink-0 text-xs">
                  {line.num[0] ?? ''}
                </span>
                <span className="w-10 text-right pr-2 text-muted-foreground/40 select-none shrink-0 text-xs">
                  {line.num[1] ?? ''}
                </span>
                <span className={`flex-1 px-2 ${textClass}`}>
                  {prefix}{line.text}
                </span>
              </div>
            );
          })}
        </pre>
      </div>

      <div className="p-4 border border-border rounded-lg bg-secondary/30">
        <h4 className="text-xs font-medium text-foreground mb-2">Fix Explanation</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The root cause was missing cleanup handlers for WebSocket event listeners. When a connection is closed or errors out,
          the <code className="text-foreground bg-secondary px-1 py-0.5 rounded text-[11px] font-mono">message</code> and <code className="text-foreground bg-secondary px-1 py-0.5 rounded text-[11px] font-mono">auth:refresh</code> listeners
          were never removed, causing them to accumulate with each new connection. The fix adds a <code className="text-foreground bg-secondary px-1 py-0.5 rounded text-[11px] font-mono">cleanup</code> function
          that is triggered on both <code className="text-foreground bg-secondary px-1 py-0.5 rounded text-[11px] font-mono">close</code> and <code className="text-foreground bg-secondary px-1 py-0.5 rounded text-[11px] font-mono">error</code> events.
        </p>
      </div>
    </div>
  );
}
