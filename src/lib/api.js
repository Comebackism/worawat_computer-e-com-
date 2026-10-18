// One place that knows where the backend lives.
//
// Dev:  Vite proxies /api -> http://localhost:4000 (see vite.config.js)
// Prod: the Express server serves dist/ too, so /api stays same-origin.
// Point VITE_API_URL at a remote host when you deploy them separately.

export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

function parse(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the API running on port 4000?');
  }

  const data = parse(await response.text());

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`);
  }
  return data;
}

export function withQuery(path, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}
