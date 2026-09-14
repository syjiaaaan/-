const crypto = require('node:crypto');
const { readSession, writeSession, config } = require('../lib.js');

module.exports = function handler(req, res) {
  const cfg = config();
  if (!cfg.redirectUri) {
    res.writeHead(302, { Location: '/?oauth=error&msg=' + encodeURIComponent('请先配置 ZHIHU_OAUTH_REDIRECT_URI') });
    return res.end();
  }
  if (!cfg.appKey) {
    res.writeHead(302, { Location: '/?oauth=error&msg=' + encodeURIComponent('请先配置 ZHIHU_OAUTH_APP_KEY') });
    return res.end();
  }
  // 知乎授权协议未正式定义 state；官方实测回调也不返回 state。
  // 发送未知参数可能导致授权页「出错了」，因此只发官方文档参数。
  const session = readSession(req) || { id: crypto.randomBytes(16).toString('base64url') };
  session.state = null;
  session.error = null;
  writeSession(res, session);
  const url = new URL('https://openapi.zhihu.com/authorize');
  url.searchParams.set('redirect_uri', cfg.redirectUri);
  url.searchParams.set('app_id', cfg.appId);
  url.searchParams.set('response_type', 'code');
  res.writeHead(302, { Location: url.toString(), 'Cache-Control': 'no-store' });
  res.end();
};
