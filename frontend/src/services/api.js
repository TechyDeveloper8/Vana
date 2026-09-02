let rawEnv = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

let API_BASE = '/api';
if (rawEnv) {
  if (rawEnv.endsWith('/api')) {
    API_BASE = rawEnv;
  } else {
    API_BASE = `${rawEnv}/api`;
  }
}

export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('vana_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE}${cleanEndpoint}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';

  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const textResponse = await response.text();
    if (!response.ok) {
      throw new Error(`Server Error (${response.status}): ${textResponse.slice(0, 100)}`);
    }
    data = { message: textResponse };
  }

  if (!response.ok) {
    throw new Error(data.message || `API Request Failed with status ${response.status}`);
  }

  return data;
};
