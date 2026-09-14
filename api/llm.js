const { json } = require('./lib.js');

async function llmChat(messages, temperature, model) {
  const base = (process.env.LLM_BASE_URL || 'https://api.openai-next.com/v1').replace(/\/$/, '');
  const key = process.env.LLM_API_KEY || '';
  if (!key) throw new Error('未配置 LLM_API_KEY');
  const res = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + key,
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: model || process.env.LLM_MODEL || 'deepseek-v4-pro',
      temperature: temperature == null ? 0.4 : temperature,
      messages: messages,
      stream: false,
    }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('LLM 返回无法解析: HTTP ' + res.status);
  }
  if (!res.ok) throw new Error(data.error && data.error.message ? data.error.message : 'LLM HTTP ' + res.status);
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return String(content || '').trim();
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: { message: 'POST only' } });
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    const content = await llmChat(body.messages || [], body.temperature, body.model);
    return json(res, 200, {
      choices: [{ message: { role: 'assistant', content: content } }],
    });
  } catch (error) {
    return json(res, 502, { ok: false, error: { message: String(error.message).slice(0, 300) } });
  }
};
