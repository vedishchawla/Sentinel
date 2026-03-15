import { Check, X } from 'lucide-react';

const GENERATED_TESTS = `describe('AuthMiddleware', () => {
  it('should cleanup listeners on unmount', () => {
    const socket = new MockWebSocket();
    const middleware = new AuthMiddleware();
    middleware.handleConnection(socket);
    
    expect(socket.listenerCount('message')).toBe(1);
    socket.emit('close');
    expect(socket.listenerCount('message')).toBe(0);
  });

  it('should not leak memory on rapid reconnect', async () => {
    const middleware = new AuthMiddleware();
    const sockets: MockWebSocket[] = [];
    
    for (let i = 0; i < 100; i++) {
      const socket = new MockWebSocket();
      sockets.push(socket);
      middleware.handleConnection(socket);
      socket.emit('close');
    }
    
    expect(middleware.emitter.listenerCount('auth:refresh')).toBe(0);
  });

  it('should handle concurrent sessions', async () => {
    const middleware = new AuthMiddleware();
    const s1 = new MockWebSocket();
    const s2 = new MockWebSocket();
    
    middleware.handleConnection(s1);
    middleware.handleConnection(s2);
    s1.emit('close');
    
    expect(s2.listenerCount('message')).toBe(1);
    expect(s1.listenerCount('message')).toBe(0);
  });

  it('should abort pending requests on cleanup', () => {
    const socket = new MockWebSocket();
    const middleware = new AuthMiddleware();
    middleware.handleConnection(socket);
    socket.emit('error', new Error('connection reset'));
    
    expect(socket.listenerCount('message')).toBe(0);
  });
});`;

const TEST_RESULTS = [
  { name: 'should cleanup listeners on unmount', status: 'pass', time: '12ms' },
  { name: 'should not leak memory on rapid reconnect', status: 'pass', time: '45ms' },
  { name: 'should handle concurrent sessions', status: 'pass', time: '23ms' },
  { name: 'should abort pending requests on cleanup', status: 'pass', time: '8ms' },
  { name: 'integration: full auth flow with cleanup', status: 'pass', time: '156ms' },
  { name: 'integration: reconnect stress test', status: 'pass', time: '203ms' },
];

export function TestPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Generated Tests */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-secondary/30">
          <span className="text-xs font-medium text-foreground">Generated Tests</span>
          <span className="text-[10px] text-muted-foreground ml-2">middleware.test.ts</span>
        </div>
        <pre className="p-3 text-[12px] leading-[1.6] font-mono text-foreground/80 overflow-auto terminal-scrollbar max-h-[400px]">
          {GENERATED_TESTS}
        </pre>
      </div>

      {/* Test Results */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-secondary/30 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Test Results</span>
          <span className="text-[10px] text-primary font-medium">6/6 passed</span>
        </div>
        <div className="p-3 space-y-2">
          {TEST_RESULTS.map((test, i) => (
            <div key={i} className="flex items-start gap-2">
              {test.status === 'pass' ? (
                <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs text-foreground block truncate">{test.name}</span>
                <span className="text-[10px] text-muted-foreground">{test.time}</span>
              </div>
            </div>
          ))}

          <div className="mt-4 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-muted-foreground block">Coverage</span>
                <span className="text-sm font-mono text-foreground">94.7%</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Branches</span>
                <span className="text-sm font-mono text-foreground">91.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
