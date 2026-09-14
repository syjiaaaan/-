/**
 * AI 内容生成编排
 * 经 POST /api/llm（后端代理）生成各页面数据并写入 TONG
 */
window.TL_GEN = window.TL_GEN || {};

(function () {
  const API = '/api/llm';

  function extractJson(text) {
    if (!text) return null;
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = fence ? fence[1] : text;
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  async function chat(cfg) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cfg.model,
        temperature: cfg.temperature,
        messages: cfg.messages,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `LLM HTTP ${res.status}`);
    const text = data?.choices?.[0]?.message?.content || '';
    const json = extractJson(text);
    if (!json) throw new Error('模型未返回合法 JSON');
    return json;
  }

  async function health() {
    try {
      const r = await fetch('/api/health');
      const j = await r.json();
      return {
        ok: !!j.ok,
        llm_configured: j.llm_configured !== false,
        zhihu_configured: !!j.zhihu_configured || !!j.oauthEnabled,
        oauth_ready: !!j.oauthEnabled || !!j.oauth_ready,
        model: j.model || 'deepseek-v4-pro',
      };
    } catch {
      return { ok: false, llm_configured: false, zhihu_configured: false };
    }
  }

  async function zhihuSearch(keyword, limit = 10) {
    const url = `/api/zhihu/search?q=${encodeURIComponent(keyword)}&limit=${limit}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = data.error;
      const msg = typeof err === 'string' ? err : (err && err.message) || `搜索 HTTP ${res.status}`;
      throw new Error(String(msg));
    }
    return data;
  }

  function flattenSearch(raw) {
    const out = [];
    const push = (item) => {
      if (!item || typeof item !== 'object') return;
      out.push({
        title: item.title || item.Title || item.question_title || '',
        excerpt: item.excerpt || item.ContentText || item.summary || item.content || '',
        author: item.author || item.AuthorName || item.author_name || item.user?.name || '',
        url: item.url || item.Url || item.link || '',
        type: item.type || item.ContentType || '',
        voteup: item.voteup_count || item.VoteUpCount || item.voteup || 0,
        avatar: item.AuthorAvatar || item.avatar || item.AvatarUrl || '',
      });
    };
    const items = raw?.Data?.Items || raw?.data?.items || raw?.items || raw?.Items;
    if (Array.isArray(items)) {
      items.forEach(push);
      return out.filter((x) => x.title || x.excerpt).slice(0, 30);
    }
    const walk = (node, depth = 0) => {
      if (depth > 6 || out.length >= 40) return;
      if (Array.isArray(node)) node.forEach((x) => walk(x, depth + 1));
      else if (node && typeof node === 'object') {
        if (node.title || node.Title || node.excerpt || node.ContentText) push(node);
        Object.values(node).forEach((v) => {
          if (v && typeof v === 'object') walk(v, depth + 1);
        });
      }
    };
    walk(raw);
    return out;
  }

  function seedFromStore() {
    return TL.store.load().seed || {};
  }

  function formatTrajectoryItem(t) {
    if (t == null) return '';
    if (typeof t === 'string') return t;
    if (typeof t === 'object') {
      const year = t.year != null && t.year !== '' ? String(t.year) : '';
      const event = t.event || t.title || t.text || t.Summary || t.Title || '';
      if (year && event) return year + ' · ' + event;
      return event || year || '';
    }
    return String(t);
  }

  function asArray(v) {
    if (v == null) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return [v];
    if (typeof v === 'object') return [v];
    return [v];
  }

  function normalizeTrajectory(list) {
    return asArray(list)
      .map(formatTrajectoryItem)
      .map((s) => s.replace(/^undefined\s*·?\s*/i, '').trim())
      .filter((s) => s && s.toLowerCase() !== 'undefined');
  }

  function applyMe(raw) {
    const me = {
      id: 'me',
      name: raw.name || '我',
      avatarSeed: raw.name || 'me',
      avatarUrl: raw.avatarUrl || raw.avatar || '',
      color: '#0084FF',
      headline: raw.headline || '',
      currentStage: raw.currentStage || '',
      shortStage: raw.shortStage || '',
      skills: raw.skills || {},
      recentQuestions: raw.recentQuestions || [],
      topics: raw.topics || [],
      trajectory: raw.trajectory || [],
      socialIntent: 'open',
      willingToTalk: raw.willingToTalk || [],
      notWillingToTalk: raw.notWillingToTalk || [],
      privacyScopes: ['public_answers', 'collection_topics', 'followed_topics', 'skill_tags'],
      thinkingStyle: raw.thinkingStyle || [],
      pathNodes: (raw.pathNodes || []).map((n, i) => ({
        id: n.id || `p${i + 1}`,
        label: n.label || `节点${i + 1}`,
        status: n.status || (i === 0 ? 'current' : 'next'),
      })),
    };
    TONG.ME = me;
    TONG.store.save({ me });
    return { me, soul: raw.soul || null };
  }

  function applyPeople(rawPeople) {
    const src = Array.isArray(rawPeople) ? rawPeople : asArray(rawPeople?.people || rawPeople);
    const list = src.filter((p) => p && typeof p === 'object').map((p, i) => ({
      id: p.id || `p${i + 1}`,
      name: p.name || `作者${i + 1}`,
      color: p.color || TONG.AVATAR_COLORS[i % TONG.AVATAR_COLORS.length],
      avatarUrl: p.avatarUrl || p.avatar || p.AuthorAvatar || '',
      headline: p.headline || '',
      currentStage: p.currentStage || p.headline || '',
      shortStage: p.shortStage || '',
      skills: p.skills || {},
      recentQuestions: p.recentQuestions || [],
      topics: p.topics || [],
      trajectory: normalizeTrajectory(p.trajectory),
      socialIntent: p.socialIntent === 'high-match-only' ? 'high-match-only' : 'open',
      willingToTalk: p.willingToTalk || [],
      notWillingToTalk: p.notWillingToTalk || [],
      publicBadge: p.publicBadge || '',
      sourceTitle: p.sourceTitle || '',
      sourceUrl: p.sourceUrl || p.Url || p.url || '',
      excerpt: p.excerpt || p.ContentText || p.summary || '',
    }));
    TONG.USERS = list;
    TONG.store.save({ users: list });
    return list;
  }

  function applyEncounters(items) {
    const src = Array.isArray(items) ? items : asArray(items?.items || items);
    const list = src.map((e, i) => ({
      id: e.id || `e${i + 1}`,
      type: e.type || 'agree',
      typeName: e.typeName || '知识交集',
      desc: e.desc || '',
      detail: e.detail || '',
      userId: e.userId,
    })).filter((e) => e.userId && TONG.USERS.some((u) => u.id === e.userId));
    TONG.ENCOUNTERS = list;
    TONG.store.save({ encounters: list });
    return list;
  }

  function applyMatches(rawMatches) {
    const src = Array.isArray(rawMatches)
      ? rawMatches
      : (rawMatches && Array.isArray(rawMatches.matches) ? rawMatches.matches : asArray(rawMatches).filter((m) => m && m.personId));
    const list = src.map((m) => {
      if (!m || !m.personId) return null;
      const user = TONG.USERS.find((u) => u.id === m.personId);
      if (!user) return null;
      const type = TONG.RELATIONS[m.type] ? m.type : 'same';
      let theirTrajectory = normalizeTrajectory(m.reason?.theirTrajectory);
      if (!theirTrajectory.length) theirTrajectory = normalizeTrajectory(user.trajectory);
      if (!theirTrajectory.length && user.sourceTitle) theirTrajectory = [user.sourceTitle];
      if (!theirTrajectory.length && user.headline) theirTrajectory = [user.headline];
      return {
        userId: user.id,
        type,
        score: Number(m.score) || 0.5,
        scores: {},
        user,
        reason: {
          title: m.reason?.title || `找到一位「${TONG.RELATIONS[type].name}」`,
          yourStage: asArray(m.reason?.yourStage),
          theirTrajectory,
          commonGoals: asArray(m.reason?.commonGoals),
          potentialExchange: asArray(m.reason?.potentialExchange),
          talk: m.reason?.talk || '',
          icebreaker: m.reason?.icebreaker || '',
        },
      };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    TONG.ME.lastMatches = list;
    TONG.store.save({ matches: list });
    return list;
  }

  function fallbackTrajectory(user) {
    if (!user) return ['公开内容持续输出'];
    const items = [];
    if (user.sourceTitle) items.push(user.sourceTitle);
    if (user.headline && user.headline !== user.sourceTitle) items.push(user.headline);
    if (user.excerpt) {
      const s = String(user.excerpt).replace(/\s+/g, ' ').trim().slice(0, 80);
      if (s) items.push(s.length >= 80 ? s + '…' : s);
    }
    if (user.publicBadge) items.push(user.publicBadge);
    (user.topics || []).slice(0, 2).forEach((t) => items.push(`持续关注「${t}」相关内容`));
    if (!items.length) items.push(`${user.name || '该作者'} 在知乎公开分享专业内容`);
    return normalizeTrajectory(items);
  }

  async function enrichPeopleTrajectories(people, onStep) {
    const need = people.filter((p) => normalizeTrajectory(p.trajectory).length < 2);
    if (!need.length) return people;
    onStep?.(`批量生成 ${need.length} 人轨迹`, 'run');
    try {
      const tj = await chat(TONG.prompts.trajectoryBatchFromPublic(need));
      const map = {};
      (tj.results || []).forEach((r) => {
        if (r && r.id) map[r.id] = normalizeTrajectory(r.trajectory);
      });
      people.forEach((p) => {
        if (map[p.id]?.length) p.trajectory = map[p.id];
        else if (normalizeTrajectory(p.trajectory).length < 2) p.trajectory = fallbackTrajectory(p);
      });
    } catch (e) {
      onStep?.('批量轨迹失败，改用公开摘要', 'warn');
      people.forEach((p) => {
        if (normalizeTrajectory(p.trajectory).length < 2) p.trajectory = fallbackTrajectory(p);
      });
    }
    TONG.USERS = people;
    TONG.store.save({ users: people });
    return people;
  }

  /** 匹配结果本地回填轨迹（不额外调模型） */
  function attachTrajectoryToMatches(matches) {
    const out = matches.map((m) => {
      let theirTrajectory = normalizeTrajectory(m.reason?.theirTrajectory);
      if (theirTrajectory.length < 2) theirTrajectory = normalizeTrajectory(m.user?.trajectory);
      if (!theirTrajectory.length) theirTrajectory = fallbackTrajectory(m.user);
      m.reason.theirTrajectory = theirTrajectory;
      return m;
    });
    TONG.store.save({ matches: out });
    return out;
  }

  async function fetchSession() {
    try {
      const r = await fetch('/api/session');
      return await r.json();
    } catch {
      return { authenticated: false };
    }
  }

  async function fetchUserSnapshot() {
    const r = await fetch('/api/user/snapshot');
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = (data.error && (data.error.message || data.error)) || data.error || `快照 HTTP ${r.status}`;
      throw new Error(typeof msg === 'string' ? msg : '拉取用户数据失败');
    }
    return data.snapshot || data;
  }

  async function generateAll(seed, onStep) {
    const step = async (msg, fn) => {
      onStep?.(msg, 'run');
      try {
        const out = await fn();
        onStep?.(msg, 'ok');
        return out;
      } catch (e) {
        onStep?.(msg + ' 失败：' + e.message, 'err');
        throw e;
      }
    };

    if (seed) TONG.store.save({ seed });

    let snapshot = null;
    const mePack = await step('拉取本人知乎数据并生成画像', async () => {
      snapshot = await fetchUserSnapshot();
      TONG.store.save({ userSnapshot: snapshot, sessionMode: snapshot.mode });
      onStep?.(
        snapshot.mode === 'oauth'
          ? '已用 OAuth 用户数据（创作/关注/收藏）'
          : `未 OAuth，使用开放平台账号公开数据${snapshot.note ? '：' + snapshot.note : ''}`,
        'ok'
      );
      const j = await chat(TONG.prompts.meFromRealData(snapshot));
      if (snapshot.profile?.name) j.name = snapshot.profile.name;
      if (snapshot.profile?.headline) j.headline = j.headline || snapshot.profile.headline;
      const avatarUrl = snapshot.profile?.avatarUrl || snapshot.profile?.avatar || snapshot.profile?.avatar_path || '';
      if (avatarUrl) j.avatarUrl = avatarUrl;
      const pack = applyMe(j);
      if (avatarUrl) {
        TONG.ME.avatarUrl = avatarUrl;
        TONG.ME.avatar = avatarUrl;
        const saved = TONG.store.load().me || {};
        TONG.store.save({ me: { ...saved, avatarUrl, avatar: avatarUrl } });
      }
      TONG.store.save({ dataSource: 'real-user' });
      return pack;
    });

    const people = await step('生成候选同路人池', async () => {
      const h = await health().catch(() => ({}));
      if (h.zhihu_configured) {
        try {
          const topics = (mePack.me.topics || []).filter(Boolean);
          const q0 = topics[0] || seed?.stage || seed?.name || '科研入门';
          onStep?.(`知乎搜索：${q0}`, 'run');
          const raw = await zhihuSearch(q0, 8);
          const hits = flattenSearch(raw);
          onStep?.(`搜索命中 ${hits.length} 条，提炼公开作者`, 'run');
          if (hits.length) {
            const j = await chat(TONG.prompts.peopleFromSearch(mePack.me, hits, 6));
            const list = applyPeople(j.people);
            if (list.length) {
              onStep?.(`从搜索结果提炼 ${list.length} 位候选`, 'ok');
              return list;
            }
          }
        } catch (e) {
          const msg = e && e.message ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
          onStep?.(`知乎搜索失败，回退模型生成：${String(msg).slice(0, 120)}`, 'err');
        }
      } else {
        onStep?.('未配置知乎搜索，用模型生成候选', 'run');
      }
      const j = await chat(TONG.prompts.peoplePool(mePack.me, 6));
      return applyPeople(j.people);
    });

    // 候选一出来就按公开回答/标题生成轨迹，避免详情页空白
    let peopleWithTraj = await step('根据公开回答生成候选轨迹', async () => {
      return enrichPeopleTrajectories(people, onStep);
    });

    let matches = await step('AI 匹配排序与理由', async () => {
      const j = await chat(TONG.prompts.matchPeople(mePack.me, peopleWithTraj));
      let list = applyMatches(j.matches);
      if (!list.length) {
        const four = TONG.matching.getFourTypes();
        list = [four.ahead, four.same, four.complement, four.different].filter(Boolean);
      }
      return list;
    });

    matches = await step('补全 TA 的轨迹到匹配结果', async () => {
      return attachTrajectoryToMatches(matches);
    });

    const encounters = await step('生成今日擦肩', async () => {
      try {
        const j = await chat(TONG.prompts.encounters(mePack.me, people));
        const list = applyEncounters(j.items);
        if (list.length) return list;
        throw new Error('空结果');
      } catch (e) {
        const fallback = matches.slice(0, 5).map((m, i) => ({
          id: `e${i + 1}`,
          type: ['agree', 'collect', 'question', 'timeline', 'opinion'][i % 5],
          typeName: ['知识交集', '共同关注', '相似问题', '时间轨迹', '观点交集'][i % 5],
          desc: `你们都在关注「${(m.user.topics || [])[0] || m.user.name}」相关路径。`,
          detail: m.reason.talk || m.reason.title || '',
          userId: m.userId,
        }));
        return applyEncounters(fallback);
      }
    });

    const mapPeople = {};
    const current = mePack.me.pathNodes.find((n) => n.status === 'current') || mePack.me.pathNodes[0];
    if (current) {
      mapPeople[current.id] = matches.slice(0, 3).map((m) => ({
        userId: m.userId,
        why: m.reason.commonGoals?.[0] || TONG.RELATIONS[m.type].name,
      }));
    }
    const nextNode = mePack.me.pathNodes.find((n) => n.status === 'next');
    if (nextNode) {
      mapPeople[nextNode.id] = matches.slice(3, 5).map((m) => ({
        userId: m.userId,
        why: TONG.RELATIONS[m.type].name,
      }));
    }
    TONG.MAP_PEOPLE = mapPeople;
    TONG.store.save({ mapPeople });

    if (mePack.soul) {
      TONG.store.save({ soul: mePack.soul });
    } else {
      TONG.store.save({
        soul: {
          path: mePack.me.currentStage || '',
          confusion: (mePack.me.recentQuestions || [])[0] || '',
          topics: mePack.me.topics || [],
          thinkingStyle: mePack.me.thinkingStyle || [],
          canHelp: Object.entries(mePack.me.skills || {}).filter(([, v]) => v >= 4).map(([k]) => k),
          summary: mePack.me.headline || '',
        },
      });
    }

    onStep?.('全部生成完成', 'done');
    return { me: mePack.me, people, matches, encounters, soul: mePack.soul };
  }

  async function generatePrechat(match, onStep) {
    onStep?.('生成 Agent 预交流…', 'run');
    const j = await chat(TONG.prompts.agentPrechat(TONG.ME, match));
    const now = Date.now();
    const chatLog = (j.chatLog || []).map((m, i) => ({
      who: ['A', 'B', 'SYS'].includes(m.who) ? m.who : 'SYS',
      from: m.from || (m.who === 'A' ? `Agent·${TONG.ME.name}` : m.who === 'B' ? `Agent·${match.user?.name}` : '系统'),
      text: m.text || '',
      time: new Date(now + i * 900).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }));
    const result = {
      title: `Agent 预交流 · ${TONG.ME.name} ↔ ${match.user?.name}`,
      chatLog,
      summary: Array.isArray(j.summary) ? j.summary : [j.summary || '预交流完成'],
      icebreaker: j.icebreaker || match.reason.icebreaker,
      relationType: match.type,
    };
    try { TONG.store.saveAgentLog?.(match.userId, result); } catch (_) {}
    onStep?.('Agent 预交流完成', 'ok');
    return result;
  }

  async function regenerateSoul(seed, onStep) {
    onStep?.('刷新 Soul Profile…', 'run');
    try {
      const snap = await fetchUserSnapshot();
      const j = await chat(TONG.prompts.meFromRealData(snap));
      if (snap.profile?.name) j.name = snap.profile.name;
      const avatarUrl = snap.profile?.avatarUrl || snap.profile?.avatar || TONG.ME.avatarUrl || '';
      if (avatarUrl) j.avatarUrl = avatarUrl;
      const pack = applyMe(j);
      if (pack.soul) TONG.store.save({ soul: pack.soul });
      TONG.store.save({ dataSource: 'real-user' });
      onStep?.('Soul Profile 已根据真实数据更新', 'ok');
      return pack;
    } catch (e) {
      onStep?.('真实数据不可用，改用简介生成：' + e.message, 'err');
      const j = await chat(TONG.prompts.meProfile(seed || seedFromStore()));
      if (TONG.ME.avatarUrl) j.avatarUrl = TONG.ME.avatarUrl;
      const pack = applyMe(j);
      if (pack.soul) TONG.store.save({ soul: pack.soul });
      onStep?.('Soul Profile 已更新', 'ok');
      return pack;
    }
  }

  function hydrate() {
    const s = TONG.store.load();
    if (s.me) TONG.ME = { ...TONG.ME, ...s.me };
    if (!TONG.ME.avatarUrl && s.me?.avatar) TONG.ME.avatarUrl = s.me.avatar;
    if (s.users?.length) TONG.USERS = s.users;
    if (s.encounters?.length) TONG.ENCOUNTERS = s.encounters;
    if (s.mapPeople) TONG.MAP_PEOPLE = s.mapPeople;
    if (s.matches?.length) TONG.ME.lastMatches = s.matches;
    return {
      hasMe: !!(s.me?.name && s.me?.name !== '我') || !!(TONG.ME.currentStage),
      hasUsers: (TONG.USERS || []).length > 0,
      hasMatches: (s.matches || []).length > 0,
    };
  }

  /** 接管后：用户发言 → 对方 AI 回复 */
  async function askCompanion({ them, reason, relationType, history, userText }) {
    const j = await chat(TONG.prompts.companionReply({
      me: TONG.ME,
      them,
      reason,
      relationType,
      history: (history || []).slice(-8),
      userText,
    }));
    const text = j.text || j.reply || j.message || '';
    if (!text) throw new Error('对方未返回内容');
    return String(text).trim();
  }

  TL_GEN = {
    health,
    generateAll,
    generatePrechat,
    regenerateSoul,
    hydrate,
    chat,
    zhihuSearch,
    flattenSearch,
    fetchSession,
    fetchUserSnapshot,
    attachTrajectoryToMatches,
    askCompanion,
  };
})();
