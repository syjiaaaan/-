const { json } = require('../lib.js');

/**
 * GET /api/zhihu/search?q=关键词&limit=10
 * 代理 developer.zhihu.com 知乎站内搜索
 */
module.exports = async function handler(req, res) {
  try {
    const secret = process.env.ZHIHU_ACCESS_SECRET || '';
    if (!secret) {
      return json(res, 500, { ok: false, error: { message: '未配置 ZHIHU_ACCESS_SECRET' } });
    }
    const url = new URL(req.url, 'http://localhost');
    const q = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('keyword') || '';
    const limit = Math.min(10, Math.max(1, Number(url.searchParams.get('limit') || 10)));
    if (!q) {
      return json(res, 400, { ok: false, error: { message: '缺少 q 参数' } });
    }

    const endpoint = new URL('https://developer.zhihu.com/api/v1/content/zhihu_search');
    endpoint.searchParams.set('Query', q);
    endpoint.searchParams.set('Count', String(limit));

    const r = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + secret,
        'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return json(res, 502, { ok: false, error: { message: '搜索响应无法解析 HTTP ' + r.status } });
    }
    if (!r.ok || (data.Code != null && data.Code !== 0)) {
      return json(res, 502, {
        ok: false,
        error: { message: data.Message || data.message || ('搜索 HTTP ' + r.status) },
      });
    }
    return json(res, 200, data);
  } catch (error) {
    return json(res, 502, { ok: false, error: { message: String(error.message).slice(0, 200) } });
  }
};
