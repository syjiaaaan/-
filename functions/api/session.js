import { getEnv, json, readSession } from '../_lib.js';

export async function onRequest(context) {
  const cfg = getEnv(context.env);
  const session = await readSession(context.request, cfg.SESSION_SECRET);
  if (!session?.token) return json({ authenticated: false });
  return json({
    authenticated: true,
    mode: 'oauth',
    profile: session.profile || null,
    expiresAt: session.expiresAt || null,
  });
}
