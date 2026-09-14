import { getEnv, json, readBody, llmChat } from '../_lib.js';

export async function onRequestPost(context) {
  const cfg = getEnv(context.env);
  try {
    const body = await readBody(context.request);
    const content = await llmChat(cfg, body.messages || [], body.temperature, body.model);
    return json({ choices: [{ message: { role: 'assistant', content } }] });
  } catch (e) {
    return json({ ok: false, error: { message: String(e.message || e).slice(0, 300) } }, 502);
  }
}
