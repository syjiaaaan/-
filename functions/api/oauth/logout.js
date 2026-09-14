import { json, clearSessionCookie } from '../../_lib.js';

export async function onRequest() {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
