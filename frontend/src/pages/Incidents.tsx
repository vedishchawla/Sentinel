import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ArrowLeft, CheckCircle, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { fetchIncidents, type IncidentSummary } from '@/lib/api';

const STATUS_CONFIG = {
  resolved: { icon: CheckCircle, label: 'Resolved', cls: 'text-primary bg-primary/10' },
  in_progress: { icon: Loader2, label: 'In Progress', cls: 'text-blue-400 bg-blue-400/10' },
  failed: { icon: XCircle, label: 'Failed', cls: 'text-destructive bg-destructive/10' },
  pending: { icon: Clock, label: 'Pending', cls: 'text-muted-foreground bg-muted/10' },
};

export default function Incidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchIncidents(50, 0);
        setIncidents(data.incidents);
        setTotal(data.total);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch incidents');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
          <p className="text-xs text-muted-foreground mt-1">
            {total > 0 ? `${total} incident(s) resolved by Sentinel.` : 'No incidents yet. Run your first fix from the dashboard.'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-xs text-destructive">{error}</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No incidents yet</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 text-xs text-primary hover:underline">
              Go to Dashboard →
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[90px_1fr_1fr_130px_100px] gap-4 px-4 py-2.5 border-b border-border bg-secondary/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <span>ID</span>
              <span>Error Type</span>
              <span>Repository</span>
              <span>Status</span>
              <span className="text-right">Confidence</span>
            </div>
            {incidents.map((inc) => {
              const status = inc.status as keyof typeof STATUS_CONFIG;
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={inc.id} className="grid grid-cols-[90px_1fr_1fr_130px_100px] gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors items-center">
                  <span className="text-xs font-mono text-foreground">{inc.id}</span>
                  <span className="text-xs text-foreground truncate">{inc.error_type || 'Unknown'}</span>
                  <span className="text-xs font-mono text-muted-foreground truncate">{inc.repo_url?.split('github.com/')[1] || inc.repo_url}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
                      <Icon className={`h-3 w-3 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
                      {cfg.label}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground text-right">
                    {inc.confidence ? `${inc.confidence}%` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
