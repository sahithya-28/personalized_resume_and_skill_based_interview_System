const API_BASE_URL = 'http://localhost:8000';

async function parseError(response) {
  let detail = `Request failed with status ${response.status}`;
  try {
    const data = await response.json();
    if (data?.detail) {
      detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
  } catch {
    // keep default error detail
  }
  throw new Error(detail);
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    await parseError(response);
  }
  return response.json();
}

export async function registerUser(payload) {
  return requestJson('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  return requestJson('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
