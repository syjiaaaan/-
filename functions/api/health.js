import { getEnv, json } from '../_lib.js';

export async function onRequest(context) {
  const cfg = getEnv(context.env);
  return json({
    ok: true,
    project: 'zhiyu-tongluren',
    oauthEnabled: true,
    platform: 'cloudflare-pages',
    llm_configured: Boolean(cfg.LLM_KEY),
    zhihu_configured: Boolean(cfg.ACCESS_SECRET),
    oauth_app_id: cfg.APP_ID,
    access_secret_configured: Boolean(cfg.ACCESS_SECRET),
    redirect: cfg.REDIRECT || null,
    model: cfg.LLM_MODEL,
  });
}
