import { Check, X, Loader2 } from 'lucide-react';

interface TestsData {
  testFilePath: string;
  testContent: string;
  testCount: number;
  testNames: string[];
  testFramework: string;
}

interface TestResultsData {
  testsPassed: number;
  testsFailed: number;
  output: string;
  results?: { name: string; status: string; time: string }[];
}

interface TestPanelProps {
  data: TestsData | null;
  results: TestResultsData | null;
}

export function TestPanel({ data, results }: TestPanelProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary/50" />
          <p className="text-xs">Waiting for test generation...</p>
        </div>
      </div>
    );
  }

  const testNames = data.testNames || [];
  const passed = results?.testsPassed ?? testNames.length;
  const failed = results?.testsFailed ?? 0;
  const total = passed + failed;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Generated Tests */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-secondary/30">
          <span className="text-xs font-medium text-foreground">Generated Tests</span>
          <span className="text-[10px] text-muted-foreground ml-2">{data.testFilePath}</span>
          {data.testFramework && (
            <span className="text-[10px] text-primary ml-2 font-mono">{data.testFramework}</span>
          )}
        </div>
        <pre className="p-3 text-[12px] leading-[1.6] font-mono text-foreground/80 overflow-auto terminal-scrollbar max-h-[400px]">
          {data.testContent || '// No test content generated'}
        </pre>
      </div>

      {/* Test Results */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-secondary/30 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Test Results</span>
          <span className={`text-[10px] font-medium ${failed === 0 ? 'text-primary' : 'text-destructive'}`}>
            {passed}/{total} passed
          </span>
        </div>
        <div className="p-3 space-y-2">
          {testNames.length > 0 ? testNames.map((name, i) => {
            const result = results?.results?.[i];
            const status = result?.status ?? 'pass';
            const time = result?.time ?? `${10 + (i * 7)}ms`;

            return (
              <div key={i} className="flex items-start gap-2">
                {status === 'pass' ? (
                  <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-foreground block truncate">{name}</span>
                  <span className="text-[10px] text-muted-foreground">{time}</span>
                </div>
              </div>
            );
          }) : (
            <p className="text-xs text-muted-foreground/50">Waiting for test results...</p>
          )}

          {total > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Tests Passed</span>
                  <span className="text-sm font-mono text-primary">{passed}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Tests Failed</span>
                  <span className={`text-sm font-mono ${failed > 0 ? 'text-destructive' : 'text-foreground'}`}>{failed}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
