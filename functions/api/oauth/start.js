import { getEnv, readSession, sessionCookie } from '../../_lib.js';

export async function onRequest(context) {
  const cfg = getEnv(context.env);
  if (!cfg.REDIRECT || !cfg.APP_KEY) {
    return Response.redirect(new URL('/?oauth=error&msg=' + encodeURIComponent('缺少 OAuth 配置'), context.request.url), 302);
  }
  let session = (await readSession(context.request, cfg.SESSION_SECRET)) || { id: crypto.randomUUID() };
  session.state = null;
  session.error = null;
  const u = new URL('https://openapi.zhihu.com/authorize');
  u.searchParams.set('redirect_uri', cfg.REDIRECT);
  u.searchParams.set('app_id', cfg.APP_ID);
  u.searchParams.set('response_type', 'code');
  return new Response(null, {
    status: 302,
    headers: {
      Location: u.toString(),
      'Set-Cookie': await sessionCookie(context.request, session, cfg.SESSION_SECRET),
      'Cache-Control': 'no-store',
    },
  });
}
