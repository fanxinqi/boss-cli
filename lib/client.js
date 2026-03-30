import { BASE_URL, HEADERS } from './constants.js';
import { getCookieString, saveCookies, loadCookies } from './config.js';

function parseCookiesFromHeaders(headers) {
  const setCookies = headers.getSetCookie?.() || [];
  const cookies = {};
  for (const sc of setCookies) {
    const [pair] = sc.split(';');
    const [name, ...rest] = pair.split('=');
    cookies[name.trim()] = rest.join('=').trim();
  }
  return cookies;
}

export async function request(apiPath, options = {}) {
  const { method = 'GET', params, body, needAuth = true } = options;

  let url = `${BASE_URL}${apiPath}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  const headers = { ...HEADERS };
  if (needAuth) {
    const cookieStr = getCookieString();
    if (cookieStr) headers['Cookie'] = cookieStr;
  }

  const fetchOptions = { method, headers, redirect: 'manual' };
  if (body) {
    if (typeof body === 'string') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      fetchOptions.body = body;
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      fetchOptions.body = new URLSearchParams(body).toString();
    }
  }

  const resp = await fetch(url, fetchOptions);

  // Merge any set-cookie into saved cookies
  const newCookies = parseCookiesFromHeaders(resp.headers);
  if (Object.keys(newCookies).length > 0) {
    const existing = loadCookies() || {};
    saveCookies({ ...existing, ...newCookies });
  }

  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return resp.json();
  }

  // For image/binary responses
  if (contentType.includes('image/')) {
    return { _buffer: await resp.arrayBuffer(), contentType };
  }

  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text, status: resp.status };
  }
}

export async function get(apiPath, params, options = {}) {
  return request(apiPath, { method: 'GET', params, ...options });
}

export async function post(apiPath, body, options = {}) {
  return request(apiPath, { method: 'POST', body, ...options });
}
