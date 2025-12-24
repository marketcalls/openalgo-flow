import { API_ENDPOINTS } from './constants';

const API_BASE = '';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.detail || error.message || 'Request failed');
  }

  return response.json();
}

// Settings API
export const settingsApi = {
  get: () => request<{
    openalgo_host: string;
    openalgo_ws_url: string;
    is_configured: boolean;
    has_api_key: boolean;
  }>(API_ENDPOINTS.SETTINGS),

  update: (data: {
    openalgo_api_key?: string;
    openalgo_host?: string;
    openalgo_ws_url?: string;
  }) => request<{ status: string; message: string }>(API_ENDPOINTS.SETTINGS, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  test: () => request<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
  }>(API_ENDPOINTS.SETTINGS_TEST, {
    method: 'POST',
  }),
};

// Workflows API
export interface Workflow {
  id: number;
  name: string;
  description: string | null;
  nodes: Node[];
  edges: Edge[];
  is_active: boolean;
  schedule_job_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowListItem {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_execution_status: string | null;
}

export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowExecution {
  id: number;
  workflow_id: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  logs: { time: string; message: string; level: string }[];
  error: string | null;
}

export const workflowsApi = {
  list: () => request<WorkflowListItem[]>(API_ENDPOINTS.WORKFLOWS),

  get: (id: number) => request<Workflow>(`${API_ENDPOINTS.WORKFLOWS}/${id}`),

  create: (data: {
    name: string;
    description?: string;
    nodes?: Node[];
    edges?: Edge[];
  }) => request<Workflow>(API_ENDPOINTS.WORKFLOWS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: number, data: {
    name?: string;
    description?: string;
    nodes?: Node[];
    edges?: Edge[];
  }) => request<Workflow>(`${API_ENDPOINTS.WORKFLOWS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: number) => request<{ status: string; message: string }>(
    `${API_ENDPOINTS.WORKFLOWS}/${id}`,
    { method: 'DELETE' }
  ),

  activate: (id: number) => request<{
    status: string;
    message: string;
    job_id?: string;
    next_run?: string;
  }>(`${API_ENDPOINTS.WORKFLOWS}/${id}/activate`, {
    method: 'POST',
  }),

  deactivate: (id: number) => request<{ status: string; message: string }>(
    `${API_ENDPOINTS.WORKFLOWS}/${id}/deactivate`,
    { method: 'POST' }
  ),

  execute: (id: number) => request<{
    status: string;
    message: string;
    execution_id?: number;
  }>(`${API_ENDPOINTS.WORKFLOWS}/${id}/execute`, {
    method: 'POST',
  }),

  getExecutions: (id: number, limit = 20) => request<WorkflowExecution[]>(
    `${API_ENDPOINTS.WORKFLOWS}/${id}/executions?limit=${limit}`
  ),
};

// Symbols API
export const symbolsApi = {
  search: (query: string, exchange = 'NSE') => request<{
    status: string;
    data: Array<{
      symbol: string;
      name: string;
      exchange: string;
      lotsize: number;
      tick_size: number;
    }>;
    message?: string;
  }>(`${API_ENDPOINTS.SYMBOLS_SEARCH}?query=${encodeURIComponent(query)}&exchange=${exchange}`),

  quotes: (symbol: string, exchange = 'NSE') => request<{
    status: string;
    data: {
      ltp: number;
      open: number;
      high: number;
      low: number;
      prev_close: number;
      volume: number;
      bid: number;
      ask: number;
    };
  }>(`${API_ENDPOINTS.SYMBOLS_QUOTES}?symbol=${encodeURIComponent(symbol)}&exchange=${exchange}`),
};
