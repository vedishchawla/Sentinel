import { Shield, FileCode, GitBranch, CheckCircle, AlertTriangle, Zap, Loader2, ExternalLink } from 'lucide-react';

interface ResolutionReportProps {
  data: any | null;
}

export function ResolutionReport({ data }: ResolutionReportProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary/50" />
          <p className="text-xs">Waiting for resolution report...</p>
        </div>
      </div>
    );
  }

  const metrics = data.metrics || {};
  const confidence = metrics.confidence || 0;
  const riskLevel = metrics.risk_level || 'unknown';
  const filesChanged = metrics.files_changed || 0;

  const reportItems = [
    { label: 'Root Cause', value: data.root_cause || 'Unknown', icon: Zap },
    { label: 'Files Modified', value: (data.files_modified || []).join(', ') || 'None', icon: FileCode },
    { label: 'Changes Made', value: data.changes_summary || 'N/A', icon: GitBranch },
    { label: 'Test Summary', value: data.test_summary || 'N/A', icon: CheckCircle },
    { label: 'Validation', value: data.validation_result || 'N/A', icon: Shield },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Resolution Report</h3>
          <p className="text-xs text-muted-foreground">{data.incident_id} — {data.fix_description || 'Autonomous fix'}</p>
        </div>
        {data.pr_url && (
          <a href={data.pr_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
            View PR <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-border rounded-lg p-4 text-center">
          <span className="text-2xl font-mono font-bold text-primary">{confidence}%</span>
          <span className="text-[10px] text-muted-foreground block mt-1 uppercase tracking-wider">Confidence</span>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <span className={`text-2xl font-mono font-bold ${riskLevel === 'low' ? 'text-primary' : riskLevel === 'medium' ? 'text-warning' : 'text-destructive'}`}>
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-1 uppercase tracking-wider">Risk Level</span>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <span className="text-2xl font-mono font-bold text-foreground">{filesChanged}</span>
          <span className="text-[10px] text-muted-foreground block mt-1 uppercase tracking-wider">Files Changed</span>
        </div>
      </div>

      {/* Detailed Report */}
      <div className="border border-border rounded-lg overflow-hidden">
        {reportItems.map((item, i) => {
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
      {data.risk_assessment && data.risk_assessment.length > 0 && (
        <div className="border border-border rounded-lg p-4 bg-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-medium text-foreground">Risk Assessment</span>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            {data.risk_assessment.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
