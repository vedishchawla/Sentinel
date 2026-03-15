import { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, AlertCircle } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  buggy?: boolean;
}

const FILE_TREE: FileNode[] = [
  {
    name: 'src', type: 'folder', children: [
      {
        name: 'lib', type: 'folder', children: [
          {
            name: 'auth', type: 'folder', children: [
              { name: 'middleware.ts', type: 'file', buggy: true },
              { name: 'session.ts', type: 'file' },
              { name: 'cache.ts', type: 'file', buggy: true },
              { name: 'index.ts', type: 'file' },
            ]
          },
          { name: 'utils', type: 'folder', children: [
            { name: 'logger.ts', type: 'file' },
            { name: 'retry.ts', type: 'file' },
          ]},
        ]
      },
      { name: 'routes', type: 'folder', children: [
        { name: 'api.ts', type: 'file' },
        { name: 'health.ts', type: 'file' },
      ]},
      { name: 'index.ts', type: 'file' },
    ]
  },
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
];

const BUGGY_CODE = `import { EventEmitter } from 'events';
import { SessionStore } from './session';
import { CacheManager } from './cache';

export class AuthMiddleware {
  private emitter: EventEmitter;
  private sessions: SessionStore;
  private cache: CacheManager;

  constructor() {
    this.emitter = new EventEmitter();
    this.sessions = new SessionStore();
    this.cache = new CacheManager();
  }

  async handleConnection(socket: WebSocket) {
    const listener = (data: any) => {
      this.processAuth(data);
    };

    // ⚠ BUG: Listener is never removed on disconnect
    socket.addEventListener('message', listener);
    this.emitter.on('auth:refresh', listener);

    // Missing: socket.addEventListener('close', () => {
    //   socket.removeEventListener('message', listener);
    //   this.emitter.off('auth:refresh', listener);
    // });
  }

  private async processAuth(data: any) {
    const token = await this.sessions.validate(data.token);
    if (token) {
      this.cache.set(data.userId, token);
    }
  }
}`;

const BUGGY_LINES = [21, 22, 23];

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

export function CodeAnalysisPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full border border-border rounded-lg overflow-hidden">
      {/* File Explorer */}
      <div className="border-b lg:border-b-0 lg:border-r border-border p-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Explorer</div>
        <div className="space-y-0.5">
          {FILE_TREE.map((node) => (
            <FileTreeNode key={node.name} node={node} />
          ))}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="col-span-1 lg:col-span-2 overflow-auto terminal-scrollbar">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <FileCode className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs font-mono text-foreground">src/lib/auth/middleware.ts</span>
          </div>
          <span className="text-[10px] text-destructive font-medium">3 issues detected</span>
        </div>
        <pre className="p-0 text-[13px] leading-[1.6] font-mono">
          {BUGGY_CODE.split('\n').map((line, i) => {
            const lineNum = i + 1;
            const isBuggy = BUGGY_LINES.includes(lineNum);
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
      </div>
    </div>
  );
}
