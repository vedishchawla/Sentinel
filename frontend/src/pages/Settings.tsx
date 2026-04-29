import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ArrowLeft, Save, Check, AlertCircle, Loader2, Key, Github, Box, Cpu, Zap, Brain, Sparkles, Monitor } from 'lucide-react';
import { fetchSettings, updateSettings, fetchHealth, type AppSettings, type HealthStatus } from '@/lib/api';

const LLM_PROVIDERS = [
  { id: 'groq', label: 'Groq (Free)', desc: 'Llama 3.3 70B via Groq LPU — fast & free', Icon: Zap },
  { id: 'openai', label: 'OpenAI', desc: 'GPT-4o — highest quality, paid', Icon: Brain },
  { id: 'anthropic', label: 'Anthropic', desc: 'Claude Sonnet — great for code, paid', Icon: Sparkles },
  { id: 'ollama', label: 'Ollama (Local)', desc: 'Run locally — free, no API key needed', Icon: Monitor },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [provider, setProvider] = useState('groq');
  const [groqKey, setGroqKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [githubToken, setGithubToken] = useState('');
  const [sandboxEnabled, setSandboxEnabled] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, h] = await Promise.all([fetchSettings(), fetchHealth()]);
        setSettings(s);
        setHealth(h);
        setProvider(s.llm_provider);
        setSandboxEnabled(s.sandbox_enabled);
        if (s.ollama_base_url) setOllamaUrl(s.ollama_base_url);
      } catch (e: any) {
        setError('Could not connect to backend. Is it running on port 8000?');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updates: any = { llm_provider: provider, sandbox_enabled: sandboxEnabled };
      if (groqKey) updates.groq_api_key = groqKey;
      if (openaiKey) updates.openai_api_key = openaiKey;
      if (anthropicKey) updates.anthropic_api_key = anthropicKey;
      if (githubToken) updates.github_token = githubToken;
      if (provider === 'ollama') updates.ollama_base_url = ollamaUrl;
      await updateSettings(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Refresh
      const [s, h] = await Promise.all([fetchSettings(), fetchHealth()]);
      setSettings(s);
      setHealth(h);
    } catch (e: any) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header progress={0} isRunning={false} />
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground mt-1">Configure LLM provider, API keys, and sandbox options.</p>
        </div>

        {/* Health Status */}
        {health && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className={`p-3 rounded-lg border ${health.llm_configured ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <div className="flex items-center gap-2">
                <Cpu className={`h-3.5 w-3.5 ${health.llm_configured ? 'text-primary' : 'text-destructive'}`} />
                <span className="text-xs font-medium text-foreground">LLM</span>
              </div>
              <span className={`text-[10px] mt-1 block ${health.llm_configured ? 'text-primary' : 'text-destructive'}`}>
                {health.llm_configured ? <span className="flex items-center gap-1">{health.llm_provider} <Check className="h-2.5 w-2.5" /></span> : 'Not configured'}
              </span>
            </div>
            <div className={`p-3 rounded-lg border ${health.github_configured ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/30'}`}>
              <div className="flex items-center gap-2">
                <Github className={`h-3.5 w-3.5 ${health.github_configured ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-medium text-foreground">GitHub</span>
              </div>
              <span className={`text-[10px] mt-1 block ${health.github_configured ? 'text-primary' : 'text-muted-foreground'}`}>
                {health.github_configured ? <span className="flex items-center gap-1">Connected <Check className="h-2.5 w-2.5" /></span> : 'Optional'}
              </span>
            </div>
            <div className={`p-3 rounded-lg border ${health.sandbox_enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/30'}`}>
              <div className="flex items-center gap-2">
                <Box className={`h-3.5 w-3.5 ${health.sandbox_enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-medium text-foreground">Sandbox</span>
              </div>
              <span className={`text-[10px] mt-1 block ${health.sandbox_enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                {health.sandbox_enabled ? <span className="flex items-center gap-1">Docker <Check className="h-2.5 w-2.5" /></span> : 'Disabled'}
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : error && !settings ? (
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" /><span className="text-sm text-destructive">{error}</span></div>
            <p className="text-xs text-muted-foreground mt-2">Start the backend with: <code className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[11px]">cd backend && pip install -r requirements.txt && python main.py</code></p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* LLM Provider */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">LLM Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {LLM_PROVIDERS.map(p => (
                  <button key={p.id} onClick={() => setProvider(p.id)} className={`p-3 rounded-lg border text-left transition-all ${provider === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-border/80 bg-secondary/30'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <p.Icon className={`h-3.5 w-3.5 ${provider === p.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-xs font-medium text-foreground">{p.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key for selected provider */}
            {provider === 'groq' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Key className="h-3 w-3" />Groq API Key</label>
                <input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder={settings?.groq_api_key || 'Enter your Groq API key'} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <p className="text-[10px] text-muted-foreground mt-1">Get a free key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.groq.com</a></p>
              </div>
            )}
            {provider === 'openai' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Key className="h-3 w-3" />OpenAI API Key</label>
                <input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder={settings?.openai_api_key || 'sk-...'} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
            )}
            {provider === 'anthropic' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Key className="h-3 w-3" />Anthropic API Key</label>
                <input type="password" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder={settings?.anthropic_api_key || 'sk-ant-...'} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
            )}
            {provider === 'ollama' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Ollama URL</label>
                <input type="text" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
            )}

            {/* GitHub Token */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Github className="h-3 w-3" />GitHub Token <span className="text-muted-foreground/50 normal-case">(optional — for PR creation)</span></label>
              <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)} placeholder={settings?.github_token || 'ghp_...'} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
              <p className="text-[10px] text-muted-foreground mt-1">Needed for automatic PR creation. Get one at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">github.com/settings/tokens</a></p>
            </div>

            {/* Sandbox */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Box className="h-3 w-3" />Docker Sandbox</label>
              <button onClick={() => setSandboxEnabled(!sandboxEnabled)} className={`flex items-center gap-3 p-3 rounded-lg border w-full text-left transition-all ${sandboxEnabled ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'}`}>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${sandboxEnabled ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${sandboxEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <span className="text-xs font-medium text-foreground">{sandboxEnabled ? 'Enabled' : 'Disabled'}</span>
                  <span className="text-[10px] text-muted-foreground block">{sandboxEnabled ? 'Tests run in isolated Docker containers' : 'Tests simulated (Docker not required)'}</span>
                </div>
              </button>
            </div>

            {/* Save */}
            {error && settings && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
              </div>
            )}
            <button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground font-medium text-sm py-3 rounded-lg inner-glow disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
