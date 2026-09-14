const { readSession, writeSession, config, postForm, getJson } = require('../lib.js');

function safe(value) {
  if (!value || /[\r\n"\\]/.test(value)) throw new Error('凭证格式无效');
  return value;
}

module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const code = url.searchParams.get('authorization_code') || url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const session = readSession(req) || {};
    if (!code) throw new Error('回调缺少 authorization_code');
    if (returnedState && session.state && returnedState !== session.state) {
      throw new Error('state 校验失败');
    }
    const cfg = config();
    if (!cfg.appKey) throw new Error('未配置 ZHIHU_OAUTH_APP_KEY');
    const form = new URLSearchParams({
      app_id: cfg.appId,
      app_key: safe(cfg.appKey),
      grant_type: 'authorization_code',
      redirect_uri: cfg.redirectUri,
      code: safe(code),
    });
    const payload = await postForm('https://openapi.zhihu.com/access_token', form);
    const token = payload.access_token || (payload.data && payload.data.access_token) || (payload.Data && payload.Data.access_token);
    if (!token) throw new Error(payload.message || payload.Message || '未获得 OAuth access token');
    const expiresIn = Number(payload.expires_in != null ? payload.expires_in : (payload.data && payload.data.expires_in));
    const next = {
      token: token,
      expiresAt: Number.isFinite(expiresIn) ? Date.now() + expiresIn * 1000 : null,
      stateVerified: Boolean(returnedState),
      state: null,
      error: null,
      profile: null,
      id: session.id,
    };
    try {
      const profilePayload = await getJson('https://openapi.zhihu.com/user', {
        Authorization: 'Bearer ' + token,
      });
      const source = profilePayload.data || profilePayload.Data || profilePayload.user || profilePayload;
      if (source && typeof source === 'object') {
        next.profile = {
          name: source.name || source.Fullname || source.fullname || null,
          avatarUrl: source.avatar_url || source.AvatarUrl || source.avatar_path || null,
          headline: source.headline || source.Headline || null,
          url: source.url || source.Url || null,
        };
      }
    } catch (e) {
      next.profile = null;
    }
    writeSession(res, next);
    res.writeHead(302, { Location: '/?oauth=ok', 'Cache-Control': 'no-store' });
    res.end();
  } catch (error) {
    writeSession(res, { error: { code: 'OAUTH_FAILED', message: String(error.message).slice(0, 200) } });
    res.writeHead(302, {
      Location: '/?oauth=error&msg=' + encodeURIComponent(String(error.message).slice(0, 120)),
      'Cache-Control': 'no-store',
    });
    res.end();
  }
};
