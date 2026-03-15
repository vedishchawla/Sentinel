import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ArrowLeft, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

interface Incident {
  id: string;
  errorType: string;
  module: string;
  status: 'resolved' | 'in_progress' | 'failed';
  resolutionTime: string;
}

const INCIDENTS: Incident[] = [
  { id: 'ISSUE-402', errorType: 'Memory Leak', module: 'auth/middleware', status: 'resolved', resolutionTime: '3m 42s' },
  { id: 'ISSUE-389', errorType: 'Race Condition', module: 'billing/payment', status: 'resolved', resolutionTime: '5m 18s' },
  { id: 'ISSUE-415', errorType: 'SQL Injection', module: 'api/search', status: 'resolved', resolutionTime: '2m 55s' },
  { id: 'ISSUE-423', errorType: 'Null Reference', module: 'orders/checkout', status: 'in_progress', resolutionTime: '—' },
  { id: 'ISSUE-430', errorType: 'Deadlock', module: 'inventory/sync', status: 'failed', resolutionTime: '—' },
];

const STATUS_CONFIG = {
  resolved: { icon: CheckCircle, label: 'Resolved', cls: 'text-primary bg-primary/10' },
  in_progress: { icon: Loader2, label: 'In Progress', cls: 'text-blue-400 bg-blue-400/10' },
  failed: { icon: XCircle, label: 'Failed', cls: 'text-destructive bg-destructive/10' },
};

export default function Incidents() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header progress={0} isRunning={false} />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-3 w-3" />
          Back to Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Incident History</h1>
          <p className="text-xs text-muted-foreground mt-1">Previous incidents resolved by Sentinel.</p>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[100px_1fr_1fr_140px_100px] gap-4 px-4 py-2.5 border-b border-border bg-secondary/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>ID</span>
            <span>Error Type</span>
            <span>Module</span>
            <span>Status</span>
            <span className="text-right">Resolution</span>
          </div>
          {INCIDENTS.map((inc) => {
            const cfg = STATUS_CONFIG[inc.status];
            const Icon = cfg.icon;
            return (
              <div key={inc.id} className="grid grid-cols-[100px_1fr_1fr_140px_100px] gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors items-center">
                <span className="text-xs font-mono text-foreground">{inc.id}</span>
                <span className="text-xs text-foreground">{inc.errorType}</span>
                <span className="text-xs font-mono text-muted-foreground">{inc.module}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
                    <Icon className={`h-3 w-3 ${inc.status === 'in_progress' ? 'animate-spin' : ''}`} />
                    {cfg.label}
                  </div>
                </div>
                <span className="text-xs font-mono text-muted-foreground text-right flex items-center justify-end gap-1">
                  {inc.resolutionTime !== '—' && <Clock className="h-3 w-3" />}
                  {inc.resolutionTime}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
