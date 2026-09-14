const crypto = require('node:crypto');

const NAME = 'zhihu_hackathon_session';
const SECRET = process.env.SESSION_SECRET || 'zhihu-hackathon-dev-secret';

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return body + '.' + sig;
}

function unsign(value) {
  if (!value || !value.includes('.')) return null;
  const parts = value.split('.');
  const body = parts[0];
  const sig = parts[1];
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (sig !== expect) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch (e) {
    return null;
  }
}

function readSession(req) {
  const cookie = req.headers.cookie || '';
  const part = cookie.split(';').map(function (s) { return s.trim(); }).find(function (s) {
    return s.indexOf(NAME + '=') === 0;
  });
  if (!part) return null;
  return unsign(decodeURIComponent(part.slice(NAME.length + 1)));
}

function writeSession(res, payload, maxAge) {
  maxAge = maxAge || 28800;
  const value = sign(Object.assign({}, payload, { id: payload.id || crypto.randomBytes(16).toString('base64url') }));
  const secure = process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', NAME + '=' + encodeURIComponent(value) + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=' + maxAge + secure);
  return payload;
}

function clearSession(res) {
  const secure = process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', NAME + '=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' + secure);
}

function config() {
  return {
    appId: process.env.ZHIHU_OAUTH_APP_ID || '645',
    appKey: process.env.ZHIHU_OAUTH_APP_KEY || '',
    accessSecret: process.env.ZHIHU_ACCESS_SECRET || '',
    redirectUri: process.env.ZHIHU_OAUTH_REDIRECT_URI || '',
  };
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

async function postForm(url, form) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('知乎开放平台返回了无法解析的响应');
  }
}

async function getJson(url, headers) {
  const r = await fetch(url, { headers: headers });
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('知乎开放平台返回了无法解析的响应');
  }
}

const userInterfaces = [
  ['contents', '我的创作', '/api/v1/user/contents'],
  ['followees', '我的关注', '/api/v1/user/followees'],
  ['favlists', '收藏夹', '/api/v1/user/favlists'],
  ['favlist_contents', '收藏内容', '/api/v1/user/favlist_contents'],
  ['collections', '近期收藏', '/api/v1/user/collections'],
].map(function (row) {
  return { id: row[0], name: row[1], endpoint: row[2] };
});

module.exports = {
  readSession: readSession,
  writeSession: writeSession,
  clearSession: clearSession,
  config: config,
  json: json,
  postForm: postForm,
  getJson: getJson,
  userInterfaces: userInterfaces,
};
