import { useState } from 'react';
import { AlertTriangle, Play, ChevronDown, Github, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface SampleIncident {
  id: string;
  title: string;
  repo: string;
  severity: string;
  description: string;
}

const SAMPLE_INCIDENTS: SampleIncident[] = [
  {
    id: 'DEMO-001',
    title: 'Memory leak in authentication middleware',
    repo: 'https://github.com/Rezinix-AI/shopstack-platform',
    severity: 'P1',
    description: 'Event listeners are not cleaned up when WebSocket connections disconnect in the auth middleware, causing memory to grow unbounded in production. Server OOM kills after ~6 hours under load. Stack trace points to handleConnection() in src/lib/auth/middleware.ts.',
  },
  {
    id: 'DEMO-002',
    title: 'Race condition in payment processing',
    repo: 'https://github.com/Rezinix-AI/shopstack-platform',
    severity: 'P0',
    description: 'Concurrent requests to /api/charge can result in double-charging customers. The mutex lock is not properly acquired in handlePayment() before accessing the shared transaction state.',
  },
  {
    id: 'DEMO-003',
    title: 'Unhandled null reference in cart checkout',
    repo: 'https://github.com/Rezinix-AI/shopstack-platform',
    severity: 'P1',
    description: 'NullPointerException in ShopService.getCart() when user has no active cart. The checkout endpoint does not validate cart existence before processing, causing 500 errors for new users.',
  },
];

interface IncidentInputProps {
  onRun: (description: string, repoUrl: string, environment: string) => void;
  isRunning: boolean;
}

export function IncidentInput({ onRun, isRunning }: IncidentInputProps) {
  const [ticket, setTicket] = useState('');
  const [repo, setRepo] = useState('');
  const [env, setEnv] = useState('production');
  const [showSamples, setShowSamples] = useState(false);

  const loadSample = (sample: SampleIncident) => {
    setTicket(`[${sample.id}] ${sample.title}\n\n${sample.description}`);
    setRepo(sample.repo);
    setShowSamples(false);
  };

  const handleRun = () => {
    if (!ticket.trim() || !repo.trim()) return;
    onRun(ticket, repo, env);
  };

  const isRepoValid = repo.trim().length > 0 && (
    repo.includes('github.com') || repo.includes('/')
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">New Incident</h2>
        <p className="text-sm text-muted-foreground">Paste a ticket URL, issue key, or describe the incident in natural language</p>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Incident Description
          </label>
          <textarea
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            placeholder="Describe the bug, paste error logs, stack traces, or a GitHub issue URL..."
            className="w-full h-32 bg-secondary border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none font-mono text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              <span className="flex items-center gap-1.5">
                <Github className="h-3 w-3" />
                Repository URL
              </span>
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className={`w-full bg-secondary border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono ${
                repo && !isRepoValid ? 'border-destructive' : 'border-border'
              }`}
            />
            {repo && !isRepoValid && (
              <span className="text-[10px] text-destructive mt-1 block">Enter a valid GitHub URL (https://github.com/owner/repo)</span>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Environment
            </label>
            <div className="relative">
              <select
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleRun}
          disabled={isRunning || !ticket.trim() || !isRepoValid}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-primary text-primary-foreground font-medium text-sm py-3 rounded-lg inner-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity duration-150"
        >
          <Play className="h-4 w-4" />
          {isRunning ? 'Agent Running...' : 'Run Autonomous Fix'}
        </motion.button>
      </div>

      {/* Sample Incidents */}
      <div>
        <button
          onClick={() => setShowSamples(!showSamples)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <AlertTriangle className="h-3 w-3" />
          <span>Load Sample Incident</span>
          <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${showSamples ? 'rotate-180' : ''}`} />
        </button>
        
        {showSamples && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ type: 'tween', ease: [0.2, 0, 0, 1], duration: 0.2 }}
            className="mt-3 space-y-2"
          >
            {SAMPLE_INCIDENTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => loadSample(sample)}
                className="w-full text-left p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors duration-150"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    sample.severity === 'P0' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'
                  }`}>
                    {sample.severity}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{sample.id}</span>
                  <a
                    href={sample.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-sm text-foreground font-medium">{sample.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sample.description}</p>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
