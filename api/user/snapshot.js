const { readSession, config, getJson, userInterfaces } = require('../lib.js');

const MAX_LIMIT = 50;
const MAX_PAGES = 3; // AI 生成用：尽快返回；需要更全可调大

function headers(token) {
  return {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
  };
}

function userHeaders(secret, oauthToken) {
  return {
    Authorization: 'Bearer ' + secret,
    'X-OAuth-Token': oauthToken,
    'X-Request-Timestamp': String(Math.floor(Date.now() / 1000)),
    'Content-Type': 'application/json',
  };
}

async function fetchAllPages(baseUrl, baseQuery, headerFn, onItems) {
  let offset = 0;
  let total = 0;
  const all = [];
  let paging = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const query = Object.assign({}, baseQuery, { Offset: String(offset), Limit: String(MAX_LIMIT) });
    const payload = await getJson(baseUrl + '?' + new URLSearchParams(query), headerFn());
    if (payload.Code !== 0) throw new Error(payload.Message || 'Code=' + payload.Code);
    const data = payload.Data || payload.data || {};
    const items = data.Items || [];
    all.push.apply(all, items);
    total += items.length;
    paging = data.Paging || null;
    if (onItems) onItems(items, page);
    const isEnd = paging ? paging.IsEnd === true : items.length < MAX_LIMIT;
    if (isEnd || !items.length) break;
    const next = paging && paging.NextOffset != null ? Number(paging.NextOffset) : offset + MAX_LIMIT;
    if (!Number.isFinite(next) || next <= offset) break;
    offset = next;
  }
  return { Items: all, Total: total, Paging: paging, FetchedCount: all.length };
}

/**
 * 已授权会话 → 完整用户公开数据快照（尽量拉全量）
 * GET /api/user/snapshot
 */
module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return jsonSafe(res, 405, { ok: false, error: { message: 'GET only' } });
    }
    const session = readSession(req) || {};
    if (!session.token) {
      return jsonSafe(res, 401, { ok: false, error: { code: 'LOGIN_REQUIRED', message: '请先完成知乎授权' } });
    }
    const cfg = config();
    const snapshot = {
      mode: 'oauth',
      provider: 'zhihu',
      fetchedAt: new Date().toISOString(),
      profile: session.profile || null,
      contents: { Items: [] },
      followees: { Items: [] },
      favlists: { Items: [] },
      favorites: { Items: [] },
      favlist_contents: { Items: [] },
      errors: [],
    };

    try {
      const profilePayload = await getJson('https://openapi.zhihu.com/user', {
        Authorization: 'Bearer ' + session.token,
      });
      const source = profilePayload.data || profilePayload.Data || profilePayload.user || profilePayload;
      if (source && typeof source === 'object') {
        snapshot.profile = {
          name: source.name || source.Fullname || source.fullname || (session.profile && session.profile.name) || null,
          headline: source.headline || source.Headline || (session.profile && session.profile.headline) || null,
          description: source.description || source.Description || null,
          avatarUrl: source.avatar_url || source.AvatarUrl || source.avatar_path || (session.profile && session.profile.avatarUrl) || null,
          url: source.url || source.Url || null,
          uid: source.uid != null ? String(source.uid) : null,
          gender: source.gender || null,
        };
      }
    } catch (e) {
      snapshot.errors.push('profile: ' + e.message);
    }

    if (!cfg.accessSecret) {
      snapshot.errors.push('未配置 ZHIHU_ACCESS_SECRET');
      return jsonSafe(res, 200, { ok: true, snapshot });
    }

    const defBy = (id) => userInterfaces.find((x) => x.id === id);

    // 创作
    try {
      snapshot.contents = await fetchAllPages(
        'https://developer.zhihu.com' + defBy('contents').endpoint,
        { ContentType: 'all', SortField: 'ts', SortOrder: 'desc' },
        () => userHeaders(cfg.accessSecret, session.token)
      );
    } catch (e) {
      snapshot.errors.push('contents: ' + String(e.message).slice(0, 160));
    }

    // 关注
    try {
      snapshot.followees = await fetchAllPages(
        'https://developer.zhihu.com' + defBy('followees').endpoint,
        {},
        () => userHeaders(cfg.accessSecret, session.token)
      );
    } catch (e) {
      snapshot.errors.push('followees: ' + String(e.message).slice(0, 160));
    }

    // 收藏夹列表
    try {
      snapshot.favlists = await fetchAllPages(
        'https://developer.zhihu.com' + defBy('favlists').endpoint,
        {},
        () => userHeaders(cfg.accessSecret, session.token)
      );
    } catch (e) {
      snapshot.errors.push('favlists: ' + String(e.message).slice(0, 160));
    }

    // 近期收藏
    try {
      snapshot.favorites = await fetchAllPages(
        'https://developer.zhihu.com' + defBy('collections').endpoint,
        {},
        () => userHeaders(cfg.accessSecret, session.token)
      );
    } catch (e) {
      snapshot.errors.push('favorites: ' + String(e.message).slice(0, 160));
    }

    // 每个收藏夹的内容
    const lists = (snapshot.favlists && snapshot.favlists.Items) || [];
    const favItems = [];
    for (let i = 0; i < lists.length && i < 20; i++) {
      const token = lists[i] && lists[i].UrlToken;
      if (!token) continue;
      try {
        const page = await fetchAllPages(
          'https://developer.zhihu.com' + defBy('favlist_contents').endpoint,
          { FavlistUrlToken: String(token) },
          () => userHeaders(cfg.accessSecret, session.token)
        );
        (page.Items || []).forEach((it) => {
          favItems.push(Object.assign({ FavlistUrlToken: token, FavlistTitle: lists[i].Title || '' }, it));
        });
      } catch (e) {
        snapshot.errors.push('favlist_contents[' + i + ']: ' + String(e.message).slice(0, 120));
      }
    }
    snapshot.favlist_contents = { Items: favItems, FetchedCount: favItems.length };

    snapshot.summary = {
      contents: (snapshot.contents.Items || []).length,
      followees: (snapshot.followees.Items || []).length,
      favlists: lists.length,
      favorites: (snapshot.favorites.Items || []).length,
      favlist_contents: favItems.length,
    };

    return jsonSafe(res, 200, { ok: true, snapshot });
  } catch (error) {
    return jsonSafe(res, 500, { ok: false, error: { message: error.message } });
  }
};

function jsonSafe(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}
