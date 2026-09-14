import { getEnv, sessionCookie, getJson } from '../../_lib.js';

export async function onRequest(context) {
  const cfg = getEnv(context.env);
  const url = new URL(context.request.url);
  try {
    const code = url.searchParams.get('authorization_code') || url.searchParams.get('code');
    if (!code) throw new Error('回调缺少 authorization_code');
    const form = new URLSearchParams({
      app_id: cfg.APP_ID,
      app_key: cfg.APP_KEY,
      grant_type: 'authorization_code',
      redirect_uri: cfg.REDIRECT,
      code,
    });
    const tokRes = await fetch('https://openapi.zhihu.com/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      body: form.toString(),
    });
    const tok = await tokRes.json().catch(() => ({}));
    const access = tok.access_token || tok?.data?.access_token || tok?.Data?.access_token;
    if (!access) throw new Error(tok.message || tok.Message || '未获得 access_token');
    const expiresIn = Number(tok.expires_in ?? tok?.data?.expires_in ?? 0);
    let profile = null;
    try {
      const prof = await getJson('https://openapi.zhihu.com/user', { Authorization: `Bearer ${access}`, 'User-Agent': 'Mozilla/5.0' });
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
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/?oauth=ok',
        'Set-Cookie': await sessionCookie(context.request, next, cfg.SESSION_SECRET),
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    const cookie = await sessionCookie(context.request, { error: { message: String(e.message || e).slice(0, 200) } }, cfg.SESSION_SECRET);
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/?oauth=error&msg=' + encodeURIComponent(String(e.message || e).slice(0, 120)),
        'Set-Cookie': cookie,
        'Cache-Control': 'no-store',
      },
    });
  }
}
