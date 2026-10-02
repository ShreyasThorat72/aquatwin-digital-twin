const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

export const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  
  const apiBase = getApiBaseUrl();
  const wsProto = apiBase.startsWith('https') ? 'wss' : 'ws';
  const hostPath = apiBase.replace(/^https?:\/\//, '');
  return `${wsProto}://${hostPath}/ws/telemetry`;
};

export const WS_BASE_URL = getWsUrl();

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('aquatwin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'API Error' }));
      throw new Error(errorData.detail || `HTTP Error ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}
