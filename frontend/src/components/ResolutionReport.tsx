import { Shield, FileCode, GitBranch, CheckCircle, AlertTriangle, Zap } from 'lucide-react';

interface ReportItem {
  label: string;
  value: string;
  icon: React.ElementType;
  color?: string;
}

const REPORT_DATA: ReportItem[] = [
  { label: 'Root Cause', value: 'Missing cleanup for WebSocket event listeners in AuthMiddleware.handleConnection()', icon: Zap },
  { label: 'Files Modified', value: 'src/lib/auth/middleware.ts, src/lib/auth/__tests__/middleware.test.ts', icon: FileCode },
  { label: 'Changes Made', value: '+8 lines, -2 lines (added cleanup handlers for close/error events)', icon: GitBranch },
  { label: 'Tests Generated', value: '4 unit tests, 2 integration tests (100% pass rate)', icon: CheckCircle },
  { label: 'Validation Result', value: 'All 847 existing tests pass, no regressions detected', icon: Shield },
];

export function ResolutionReport() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Resolution Report</h3>
        <p className="text-xs text-muted-foreground">ISSUE-402 — Memory leak in auth middleware</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-border rounded-lg p-4 text-center">
          <span className="text-2xl font-mono font-bold text-primary">94.2%</span>
          <span className="text-[10px] text-muted-foreground block mt-1 uppercase tracking-wider">Confidence</span>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <span className="text-2xl font-mono font-bold text-primary">Low</span>
          <span className="text-[10px] text-muted-foreground block mt-1 uppercase tracking-wider">Risk Level</span>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <span className="text-2xl font-mono font-bold text-foreground">2</span>
          <span className="text-[10px] text-muted-foreground block mt-1 uppercase tracking-wider">Files Changed</span>
        </div>
      </div>

      {/* Detailed Report */}
      <div className="border border-border rounded-lg overflow-hidden">
        {REPORT_DATA.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-start gap-3 p-4 border-b border-border last:border-0">
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-foreground block">{item.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5 block">{item.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk Assessment */}
      <div className="border border-border rounded-lg p-4 bg-secondary/30">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-medium text-foreground">Risk Assessment</span>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>Fix is minimal and localized — only adds cleanup logic, no structural changes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>All existing tests continue to pass with zero regressions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>Memory profile shows no leaks in 10-minute soak test under load</span>
          </div>
        </div>
      </div>
    </div>
  );
}
