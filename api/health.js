const { json } = require('./lib.js');

module.exports = function handler(req, res) {
  return json(res, 200, {
    ok: true,
    project: 'zhihu-tongluren',
    oauthEnabled: true,
    platform: 'vercel',
    node: process.version,
    llm_configured: Boolean(process.env.LLM_API_KEY),
    model: process.env.LLM_MODEL || 'deepseek-v4-pro',
    oauth_app_id: process.env.ZHIHU_OAUTH_APP_ID || '645',
    access_secret_configured: Boolean(process.env.ZHIHU_ACCESS_SECRET),
  });
};
