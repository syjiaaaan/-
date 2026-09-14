import { getEnv, json, getJson } from '../../_lib.js';

export async function onRequest(context) {
  const cfg = getEnv(context.env);
  if (!cfg.ACCESS_SECRET) {
    return json({ ok: false, error: { message: '未配置 ZHIHU_ACCESS_SECRET' } }, 500);
  }
  const url = new URL(context.request.url);
  const q = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('keyword') || '';
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get('limit') || 10)));
  if (!q) return json({ ok: false, error: { message: '缺少 q 参数' } }, 400);
  try {
    const endpoint = new URL('https://developer.zhihu.com/api/v1/content/zhihu_search');
    endpoint.searchParams.set('Query', q);
    endpoint.searchParams.set('Count', String(limit));
    const data = await getJson(endpoint.toString(), {
      Authorization: `Bearer ${cfg.ACCESS_SECRET}`,
      'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0',
    });
    if (data.Code != null && data.Code !== 0) {
      return json({ ok: false, error: { message: data.Message || '搜索失败' } }, 502);
    }
    return json(data);
  } catch (e) {
    return json({ ok: false, error: { message: String(e.message).slice(0, 200) } }, 502);
  }
}
