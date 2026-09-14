/**
 * 知遇.同路人 — Hostinger / VPS 一体化服务
 * 静态站 + OAuth + 用户快照 + LLM 代理 + 知乎搜索
 *
 * 启动：
 *   PORT=3000 NODE_ENV=production node server-hostinger.mjs
 * 环境变量见 README.md
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const LLM_BASE = (process.env.LLM_BASE_URL || 'https://api.openai-next.com/v1').replace(/\/$/, '');
const LLM_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'deepseek-v4-pro';
const APP_ID = process.env.ZHIHU_OAUTH_APP_ID || '645';
const APP_KEY = process.env.ZHIHU_OAUTH_APP_KEY || '';
const ACCESS_SECRET = process.env.ZHIHU_ACCESS_SECRET || '';
const REDIRECT = (process.env.ZHIHU_OAUTH_REDIRECT_URI || '').replace(/\/$/, '');
const SESSION_SECRET = process.env.SESSION_SECRET || 'zhihu-tongluren-dev-secret';
const COOKIE = 'zhihu_hackathon_session';
const UA = 'Mozilla/5.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function json(res, status, obj, extraHeaders = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  res.end(body);
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function unsign(value) {
  if (!value || !value.includes('.')) return null;
  const [body, sig] = value.split('.');
  const expect = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  if (sig !== expect) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function readSession(req) {
  const cookie = req.headers.cookie || '';
  const part = cookie.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`));
  if (!part) return null;
  return unsign(decodeURIComponent(part.slice(COOKIE.length + 1)));
}

function isHttps(req) {
  return (
    req.headers['x-forwarded-proto'] === 'https' ||
    req.socket.encrypted === true ||
    process.env.FORCE_SECURE === '1'
  );
}

function writeSession(res, req, payload, maxAge = 28800) {
  const value = sign({ ...payload, id: payload.id || crypto.randomBytes(16).toString('base64url') });
  const secure = isHttps(req) ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

function clearSessionCookie(req) {
  const secure = isHttps(req) ? '; Secure' : '';
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return raw.split(';').map((s) => s.trim());
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function llmChat(messages, temperature = 0.4, model) {
  if (!LLM_KEY) throw new Error('未配置 LLM_API_KEY');
  const res = await fetch(`${LLM_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LLM_KEY}`,
      'User-Agent': UA,
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: model || LLM_MODEL,
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

async function getJson(url, headers) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('开放平台响应无法解析');
  }
}

function userHeaders(oauthToken) {
  const h = {
    Authorization: `Bearer ${ACCESS_SECRET}`,
    'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
    'Content-Type': 'application/json',
    'User-Agent': UA,
    Accept: 'application/json',
  };
  if (oauthToken) h['X-OAuth-Token'] = oauthToken;
  return h;
}

async function fetchAllPages(baseUrl, baseQuery) {
  const MAX_LIMIT = 50;
  const MAX_PAGES = 3;
  let offset = 0;
  const all = [];
  let paging = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const query = { ...baseQuery, Offset: String(offset), Limit: String(MAX_LIMIT) };
    const payload = await getJson(`${baseUrl}?${new URLSearchParams(query)}`, userHeaders());
    if (payload.Code !== 0) throw new Error(payload.Message || `Code=${payload.Code}`);
    const data = payload.Data || payload.data || {};
    const items = data.Items || [];
    all.push(...items);
    paging = data.Paging || null;
    const isEnd = paging ? paging.IsEnd === true : items.length < MAX_LIMIT;
    if (isEnd || !items.length) break;
    const next = paging && paging.NextOffset != null ? Number(paging.NextOffset) : offset + MAX_LIMIT;
    if (!Number.isFinite(next) || next <= offset) break;
    offset = next;
  }
  return { Items: all, Total: all.length, Paging: paging, FetchedCount: all.length };
}

const DEF = {
  contents: '/api/v1/user/contents',
  followees: '/api/v1/user/followees',
  favlists: '/api/v1/user/favlists',
  favlist_contents: '/api/v1/user/favlist_contents',
  collections: '/api/v1/user/collections',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const data = fs.readFileSync(filePath);
  const cache = ext === '.html' ? 'no-store' : 'public, max-age=3600';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache });
  res.end(data);
}

function safePublicPath(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  if (p === '/auth/callback') return null; // API
  const full = path.normalize(path.join(PUBLIC, p));
  if (!full.startsWith(PUBLIC)) return null;
  if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) return null;
  return full;
}

async function handleApi(req, res, url) {
  const p = url.pathname;

  if (p === '/api/health') {
    return json(res, 200, {
      ok: true,
      project: 'zhiyu-tongluren',
      oauthEnabled: true,
      platform: 'hostinger-node',
      llm_configured: Boolean(LLM_KEY),
      zhihu_configured: Boolean(ACCESS_SECRET),
      oauth_app_id: APP_ID,
      access_secret_configured: Boolean(ACCESS_SECRET),
      redirect: REDIRECT || null,
      model: LLM_MODEL,
    });
  }

  if (p === '/api/session') {
    const session = readSession(req) || {};
    if (!session.token) return json(res, 200, { authenticated: false });
    return json(res, 200, {
      authenticated: true,
      mode: 'oauth',
      profile: session.profile || null,
      expiresAt: session.expiresAt || null,
    });
  }

  if (p === '/api/oauth/url') {
    if (!APP_ID || !APP_KEY || !REDIRECT) {
      return json(res, 400, { ok: false, error: '未配置 OAuth 环境变量' });
    }
    const u = new URL('https://openapi.zhihu.com/authorize');
    u.searchParams.set('redirect_uri', REDIRECT);
    u.searchParams.set('app_id', APP_ID);
    u.searchParams.set('response_type', 'code');
    return json(res, 200, { url: u.toString() });
  }

  if (p === '/api/oauth/start') {
    if (!REDIRECT || !APP_KEY) {
      res.writeHead(302, { Location: '/?oauth=error&msg=' + encodeURIComponent('缺少 OAuth 配置') });
      return res.end();
    }
    const session = readSession(req) || { id: crypto.randomBytes(16).toString('base64url') };
    session.state = null;
    session.error = null;
    const u = new URL('https://openapi.zhihu.com/authorize');
    u.searchParams.set('redirect_uri', REDIRECT);
    u.searchParams.set('app_id', APP_ID);
    u.searchParams.set('response_type', 'code');
    res.writeHead(302, {
      Location: u.toString(),
      'Set-Cookie': writeSession(res, req, session),
      'Cache-Control': 'no-store',
    });
    return res.end();
  }

  if (p === '/api/oauth/callback' || p === '/auth/callback') {
    try {
      const code = url.searchParams.get('authorization_code') || url.searchParams.get('code');
      if (!code) throw new Error('回调缺少 authorization_code');
      const form = new URLSearchParams({
        app_id: APP_ID,
        app_key: APP_KEY,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT,
        code,
      });
      const tokRes = await fetch('https://openapi.zhihu.com/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA, Accept: 'application/json' },
        body: form.toString(),
      });
      const tok = await tokRes.json().catch(() => ({}));
      const access = tok.access_token || tok?.data?.access_token || tok?.Data?.access_token;
      if (!access) throw new Error(tok.message || tok.Message || '未获得 access_token');
      const expiresIn = Number(tok.expires_in ?? tok?.data?.expires_in ?? 0);
      let profile = null;
      try {
        const prof = await getJson('https://openapi.zhihu.com/user', { Authorization: `Bearer ${access}`, 'User-Agent': UA });
        const s = prof.data || prof.Data || prof.user || prof || {};
        profile = {
          name: s.name || s.Fullname || s.fullname || null,
          headline: s.headline || s.Headline || null,
          avatarUrl: s.avatar_url || s.AvatarUrl || s.avatar_path || null,
          url: s.url || s.Url || null,
          uid: s.uid != null ? String(s.uid) : null,
        };
      } catch {
        profile = null;
      }
      const next = {
        token: access,
        expiresAt: Number.isFinite(expiresIn) && expiresIn > 0 ? Date.now() + expiresIn * 1000 : null,
        profile,
        error: null,
      };
      res.writeHead(302, {
        Location: '/?oauth=ok',
        'Set-Cookie': writeSession(res, req, next),
        'Cache-Control': 'no-store',
      });
      return res.end();
    } catch (e) {
      res.writeHead(302, {
        Location: '/?oauth=error&msg=' + encodeURIComponent(String(e.message || e).slice(0, 120)),
        'Set-Cookie': writeSession(res, req, { error: { message: String(e.message || e).slice(0, 200) } }),
        'Cache-Control': 'no-store',
      });
      return res.end();
    }
  }

  if (p === '/api/oauth/logout' || p === '/api/logout') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(req),
    });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (p === '/api/user/snapshot') {
    const session = readSession(req) || {};
    if (!session.token) return json(res, 401, { ok: false, error: { code: 'LOGIN_REQUIRED', message: '请先完成知乎授权' } });
    if (!ACCESS_SECRET) return json(res, 200, { ok: true, snapshot: { mode: 'oauth', profile: session.profile, errors: ['未配置 ZHIHU_ACCESS_SECRET'] } });

    const snapshot = {
      mode: 'oauth',
      provider: 'zhihu',
      fetchedAt: new Date().toISOString(),
      profile: session.profile || null,
      contents: { Items: [] },
      followees: { Items: [] },
      favlists: { Items: [] },
      favorites: { Items: [] },
      favlist_contents: { Items: [] },
      errors: [],
    };

    try {
      const prof = await getJson('https://openapi.zhihu.com/user', { Authorization: `Bearer ${session.token}` });
      const s = prof.data || prof.Data || prof.user || prof || {};
      snapshot.profile = {
        name: s.name || s.Fullname || s.fullname || session.profile?.name || null,
        headline: s.headline || s.Headline || session.profile?.headline || null,
        description: s.description || s.Description || null,
        avatarUrl: s.avatar_url || s.AvatarUrl || s.avatar_path || session.profile?.avatarUrl || null,
        url: s.url || s.Url || null,
        uid: s.uid != null ? String(s.uid) : null,
      };
    } catch (e) {
      snapshot.errors.push('profile: ' + e.message);
    }

    for (const [key, q] of [
      ['contents', { ContentType: 'all', SortField: 'ts', SortOrder: 'desc' }],
      ['followees', {}],
      ['favlists', {}],
      ['favorites', {}],
    ]) {
      const endpoint = key === 'favorites' ? DEF.collections : DEF[key];
      try {
        // pass oauth token
        const headers = userHeaders(session.token);
        const MAX_LIMIT = 50;
        let offset = 0;
        const all = [];
        for (let page = 0; page < 3; page++) {
          const query = { ...q, Offset: String(offset), Limit: String(MAX_LIMIT) };
          const payload = await getJson(`https://developer.zhihu.com${endpoint}?${new URLSearchParams(query)}`, headers);
          if (payload.Code !== 0) throw new Error(payload.Message || String(payload.Code));
          const data = payload.Data || {};
          const items = data.Items || [];
          all.push(...items);
          if (data.Paging?.IsEnd || items.length < MAX_LIMIT) break;
          offset = data.Paging?.NextOffset != null ? Number(data.Paging.NextOffset) : offset + MAX_LIMIT;
        }
        snapshot[key] = { Items: all, FetchedCount: all.length };
      } catch (e) {
        snapshot.errors.push(`${key}: ${String(e.message).slice(0, 120)}`);
      }
    }

    const lists = snapshot.favlists.Items || [];
    const favItems = [];
    for (let i = 0; i < lists.length && i < 10; i++) {
      const token = lists[i]?.UrlToken;
      if (!token) continue;
      try {
        const payload = await getJson(
          `https://developer.zhihu.com${DEF.favlist_contents}?${new URLSearchParams({ FavlistUrlToken: String(token), Offset: '0', Limit: '50' })}`,
          userHeaders(session.token)
        );
        if (payload.Code === 0) {
          (payload.Data?.Items || []).forEach((it) => {
            favItems.push({ FavlistUrlToken: token, FavlistTitle: lists[i].Title || '', ...it });
          });
        }
      } catch (e) {
        snapshot.errors.push(`favlist[${i}]: ${String(e.message).slice(0, 100)}`);
      }
    }
    snapshot.favlist_contents = { Items: favItems, FetchedCount: favItems.length };
    snapshot.summary = {
      contents: snapshot.contents.Items.length,
      followees: snapshot.followees.Items.length,
      favlists: lists.length,
      favorites: snapshot.favorites.Items.length,
      favlist_contents: favItems.length,
    };
    return json(res, 200, { ok: true, snapshot });
  }

  if (p === '/api/zhihu/search') {
    if (!ACCESS_SECRET) return json(res, 500, { ok: false, error: { message: '未配置 ZHIHU_ACCESS_SECRET' } });
    const q = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('keyword') || '';
    const limit = Math.min(10, Math.max(1, Number(url.searchParams.get('limit') || 10)));
    if (!q) return json(res, 400, { ok: false, error: { message: '缺少 q 参数' } });
    try {
      const endpoint = new URL('https://developer.zhihu.com/api/v1/content/zhihu_search');
      endpoint.searchParams.set('Query', q);
      endpoint.searchParams.set('Count', String(limit));
      const data = await getJson(endpoint.toString(), {
        Authorization: `Bearer ${ACCESS_SECRET}`,
        'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': UA,
      });
      if (data.Code != null && data.Code !== 0) {
        return json(res, 502, { ok: false, error: { message: data.Message || '搜索失败' } });
      }
      return json(res, 200, data);
    } catch (e) {
      return json(res, 502, { ok: false, error: { message: String(e.message).slice(0, 200) } });
    }
  }

  if (p === '/api/llm' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const content = await llmChat(body.messages || [], body.temperature, body.model);
      return json(res, 200, { choices: [{ message: { role: 'assistant', content } }] });
    } catch (e) {
      return json(res, 502, { ok: false, error: { message: String(e.message).slice(0, 300) } });
    }
  }

  return json(res, 404, { ok: false, error: { message: 'Not Found' } });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/') || url.pathname === '/auth/callback') {
      return await handleApi(req, res, url);
    }
    const file = safePublicPath(url.pathname);
    if (!file) {
      // SPA hash 路由无需 rewrite；未知静态 404
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not Found');
    }
    return sendFile(res, file);
  } catch (e) {
    return json(res, 500, { ok: false, error: { message: String(e.message || e) } });
  }
});

server.listen(PORT, HOST, () => {
  console.log('知遇.同路人 Hostinger/Node 服务已启动');
  console.log(`  URL        : http://${HOST}:${PORT}`);
  console.log(`  LLM        : ${LLM_MODEL} @ ${LLM_BASE}  key=${LLM_KEY ? 'ok' : 'MISSING'}`);
  console.log(`  OAuth      : app_id=${APP_ID} key=${APP_KEY ? 'ok' : 'MISSING'} redirect=${REDIRECT || 'MISSING'}`);
  console.log(`  Zhihu Secret: ${ACCESS_SECRET ? 'ok' : 'MISSING'}`);
});
