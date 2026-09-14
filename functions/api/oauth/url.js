import { getEnv, json } from '../../_lib.js';

export async function onRequest(context) {
  const cfg = getEnv(context.env);
  if (!cfg.APP_ID || !cfg.APP_KEY || !cfg.REDIRECT) {
    return json({ ok: false, error: '未配置 OAuth 环境变量' }, 400);
  }
  const u = new URL('https://openapi.zhihu.com/authorize');
  u.searchParams.set('redirect_uri', cfg.REDIRECT);
  u.searchParams.set('app_id', cfg.APP_ID);
  u.searchParams.set('response_type', 'code');
  return json({ url: u.toString() });
}
