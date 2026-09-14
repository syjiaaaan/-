const { json, readSession, config, getJson, userInterfaces } = require('../lib.js');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: { message: 'POST only' } });
    const session = readSession(req) || {};
    if (!session.token) {
      return json(res, 401, { ok: false, error: { code: 'LOGIN_REQUIRED', message: '请先完成知乎账号授权' } });
    }
    const cfg = config();
    if (!cfg.accessSecret) {
      return json(res, 500, { ok: false, error: { message: '未配置 ZHIHU_ACCESS_SECRET' } });
    }
    const context = {};
    const results = [];
    for (let i = 0; i < userInterfaces.length; i++) {
      const definition = userInterfaces[i];
      let query = { Limit: '1' };
      if (definition.id === 'contents') {
        query = { Limit: '1', ContentType: 'all', Offset: '0', SortField: 'ts', SortOrder: 'desc' };
      }
      if (definition.id === 'followees') query.Offset = '0';
      if (definition.id === 'favlist_contents') {
        if (!context.favlistToken) {
          results.push(Object.assign({}, definition, { status: 'empty', item: null, message: '账号没有可用于测试的收藏夹。' }));
          continue;
        }
        query = { Limit: '1', FavlistUrlToken: String(context.favlistToken), Offset: '0' };
      }
      try {
        const payload = await getJson(
          'https://developer.zhihu.com' + definition.endpoint + '?' + new URLSearchParams(query),
          {
            Authorization: 'Bearer ' + cfg.accessSecret,
            'X-OAuth-Token': session.token,
            'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
            'Content-Type': 'application/json',
          }
        );
        if (payload.Code !== 0) throw new Error(payload.Message || '用户数据接口失败');
        const item = payload.Data && Array.isArray(payload.Data.Items) ? payload.Data.Items[0] || null : null;
        if (definition.id === 'favlists' && item && item.UrlToken) context.favlistToken = item.UrlToken;
        results.push(Object.assign({}, definition, {
          status: item ? 'success' : 'empty',
          item: item,
          message: item ? null : '接口成功但没有数据。',
        }));
      } catch (error) {
        results.push(Object.assign({}, definition, {
          status: 'error',
          item: null,
          message: String(error.message).slice(0, 200),
        }));
      }
    }
    return json(res, 200, { ok: true, results: results });
  } catch (error) {
    return json(res, 500, { ok: false, error: { message: error.message } });
  }
};
