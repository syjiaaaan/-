import { getEnv, json, readSession, getJson, userHeaders, ENDPOINTS } from '../../_lib.js';

async function fetchPages(urlBase, query, headers) {
  const MAX = 50;
  let offset = 0;
  const all = [];
  for (let page = 0; page < 3; page++) {
    const q = { ...query, Offset: String(offset), Limit: String(MAX) };
    const payload = await getJson(`${urlBase}?${new URLSearchParams(q)}`, headers);
    if (payload.Code !== 0) throw new Error(payload.Message || String(payload.Code));
    const data = payload.Data || {};
    const items = data.Items || [];
    all.push(...items);
    if (data.Paging?.IsEnd || items.length < MAX) break;
    offset = data.Paging?.NextOffset != null ? Number(data.Paging.NextOffset) : offset + MAX;
  }
  return { Items: all, FetchedCount: all.length };
}

export async function onRequest(context) {
  const cfg = getEnv(context.env);
  const session = await readSession(context.request, cfg.SESSION_SECRET);
  if (!session?.token) {
    return json({ ok: false, error: { code: 'LOGIN_REQUIRED', message: '请先完成知乎授权' } }, 401);
  }
  if (!cfg.ACCESS_SECRET) {
    return json({
      ok: true,
      snapshot: { mode: 'oauth', profile: session.profile, errors: ['未配置 ZHIHU_ACCESS_SECRET'] },
    });
  }

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
    const prof = await getJson('https://openapi.zhihu.com/user', { Authorization: `Bearer ${session.token}` });
    const s = prof.data || prof.Data || prof.user || prof || {};
    snapshot.profile = {
      name: s.name || s.Fullname || s.fullname || session.profile?.name || null,
      headline: s.headline || s.Headline || session.profile?.headline || null,
      description: s.description || s.Description || null,
      avatarUrl: s.avatar_url || s.AvatarUrl || s.avatar_path || session.profile?.avatarUrl || null,
      url: s.url || s.Url || null,
      uid: s.uid != null ? String(s.uid) : null,
    };
  } catch (e) {
    snapshot.errors.push('profile: ' + e.message);
  }

  const headers = userHeaders(cfg.ACCESS_SECRET, session.token);
  for (const [key, q, ep] of [
    ['contents', { ContentType: 'all', SortField: 'ts', SortOrder: 'desc' }, ENDPOINTS.contents],
    ['followees', {}, ENDPOINTS.followees],
    ['favlists', {}, ENDPOINTS.favlists],
    ['favorites', {}, ENDPOINTS.collections],
  ]) {
    try {
      snapshot[key] = await fetchPages(`https://developer.zhihu.com${ep}`, q, headers);
    } catch (e) {
      snapshot.errors.push(`${key}: ${String(e.message).slice(0, 120)}`);
    }
  }

  const lists = snapshot.favlists.Items || [];
  const favItems = [];
  for (let i = 0; i < lists.length && i < 10; i++) {
    const token = lists[i]?.UrlToken;
    if (!token) continue;
    try {
      const payload = await getJson(
        `https://developer.zhihu.com${ENDPOINTS.favlist_contents}?${new URLSearchParams({ FavlistUrlToken: String(token), Offset: '0', Limit: '50' })}`,
        headers
      );
      if (payload.Code === 0) {
        (payload.Data?.Items || []).forEach((it) => {
          favItems.push({ FavlistUrlToken: token, FavlistTitle: lists[i].Title || '', ...it });
        });
      }
    } catch (e) {
      snapshot.errors.push(`favlist[${i}]: ${String(e.message).slice(0, 100)}`);
    }
  }
  snapshot.favlist_contents = { Items: favItems, FetchedCount: favItems.length };
  snapshot.summary = {
    contents: snapshot.contents.Items.length,
    followees: snapshot.followees.Items.length,
    favlists: lists.length,
    favorites: snapshot.favorites.Items.length,
    favlist_contents: favItems.length,
  };
  return json({ ok: true, snapshot });
}
