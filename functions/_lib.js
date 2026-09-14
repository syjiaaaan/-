/** Cloudflare Pages Functions — 共享工具 */
const COOKIE = 'zhihu_hackathon_session';

export function getEnv(env) {
  return {
    LLM_BASE: (env.LLM_BASE_URL || 'https://api.openai-next.com/v1').replace(/\/$/, ''),
    LLM_KEY: env.LLM_API_KEY || '',
    LLM_MODEL: env.LLM_MODEL || 'deepseek-v4-pro',
    APP_ID: env.ZHIHU_OAUTH_APP_ID || '645',
    APP_KEY: env.ZHIHU_OAUTH_APP_KEY || '',
    ACCESS_SECRET: env.ZHIHU_ACCESS_SECRET || '',
    REDIRECT: (env.ZHIHU_OAUTH_REDIRECT_URI || '').replace(/\/$/, ''),
    SESSION_SECRET: env.SESSION_SECRET || 'zhiyu-tongluren-dev-secret',
  };
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

function b64url(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(s)));
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64url(String.fromCharCode(...new Uint8Array(sig)));
}

export async function signSession(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const sig = await hmac(secret, body);
  return `${body}.${sig}`;
}

export async function unsignSession(value, secret) {
  if (!value || !value.includes('.')) return null;
  const [body, sig] = value.split('.');
  const expect = await hmac(secret, body);
  if (sig !== expect) return null;
  try {
    return JSON.parse(b64urlDecode(body));
  } catch {
    return null;
  }
}

export async function readSession(request, secret) {
  const cookie = request.headers.get('Cookie') || '';
  const part = cookie.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`));
  if (!part) return null;
  return unsignSession(decodeURIComponent(part.slice(COOKIE.length + 1)), secret);
}

export async function sessionCookie(request, payload, secret, maxAge = 28800) {
  const value = await signSession({ ...payload, id: payload.id || crypto.randomUUID() }, secret);
  // Pages 自带 HTTPS
  return `${COOKIE}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}; Secure`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Secure`;
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function llmChat(envCfg, messages, temperature = 0.4, model) {
  if (!envCfg.LLM_KEY) throw new Error('未配置 LLM_API_KEY');
  const res = await fetch(`${envCfg.LLM_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${envCfg.LLM_KEY}`,
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: model || envCfg.LLM_MODEL,
      temperature,
      messages,
      stream: false,
    }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`LLM 响应无法解析 HTTP ${res.status}`);
  }
  if (!res.ok) throw new Error(data?.error?.message || `LLM HTTP ${res.status}`);
  return String(data?.choices?.[0]?.message?.content || '').trim();
}

export async function getJson(url, headers) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('开放平台响应无法解析');
  }
}

export function userHeaders(accessSecret, oauthToken) {
  const h = {
    Authorization: `Bearer ${accessSecret}`,
    'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0',
    Accept: 'application/json',
  };
  if (oauthToken) h['X-OAuth-Token'] = oauthToken;
  return h;
}

export const ENDPOINTS = {
  contents: '/api/v1/user/contents',
  followees: '/api/v1/user/followees',
  favlists: '/api/v1/user/favlists',
  favlist_contents: '/api/v1/user/favlist_contents',
  collections: '/api/v1/user/collections',
};
