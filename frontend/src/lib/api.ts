/**
 * REST API client for non-streaming backend operations.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// ─── Incidents ───

export interface IncidentSummary {
  id: string;
  description: string;
  repo_url: string;
  environment: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'failed';
  error_type: string | null;
  module: string | null;
  root_cause: string | null;
  fix_description: string | null;
  diff: string | null;
  tests_generated: string | null;
  test_results: string | null;
  pr_url: string | null;
  pr_number: number | null;
  confidence: number | null;
  resolution_time: string | null;
  created_at: string;
  completed_at: string | null;
  file_tree: string | null;
  relevant_files: string | null;
  reasoning_log: string | null;
}

export async function fetchIncidents(limit = 50, offset = 0): Promise<{
  incidents: IncidentSummary[];
  total: number;
}> {
  return request(`/api/incidents?limit=${limit}&offset=${offset}`);
}

export async function fetchIncident(id: string): Promise<IncidentSummary> {
  return request(`/api/incidents/${id}`);
}

// ─── Settings ───

export interface AppSettings {
  llm_provider: string;
  groq_api_key: string | null;
  groq_model: string;
  openai_api_key: string | null;
  openai_model: string;
  anthropic_api_key: string | null;
  anthropic_model: string;
  ollama_base_url: string;
  ollama_model: string;
  github_token: string | null;
  sandbox_enabled: boolean;
}

export async function fetchSettings(): Promise<AppSettings> {
  return request('/api/settings');
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<{ status: string }> {
  return request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// ─── Health ───

export interface HealthStatus {
  status: string;
  llm_provider: string;
  llm_configured: boolean;
  github_configured: boolean;
  sandbox_enabled: boolean;
}

export async function fetchHealth(): Promise<HealthStatus> {
  return request('/api/health');
}
