/* 本地状态存储 */
window.TONG = window.TONG || {};

TONG.store = {
  KEY: 'tongluren_state_v1',

  defaults() {
    return {
      socialIntent: 'open',
      willingToTalk: ['科研', '机器人', '留学'],
      notWillingToTalk: ['求职', '私生活'],
      privacyScopes: {
        public_answers: true,
        collection_topics: true,
        followed_topics: true,
        skill_tags: true,
        private_collections: false,
        search_history: false,
        private_messages: false,
        real_identity: false,
      },
      connected: [],
      skipped: [],
      greetedEncounters: [],
      soulGenerated: false,
      findCompleted: false,
      agentChatLogs: {},
      lastFindSession: null,
      // AI 生成内容
      seed: {
        name: '林晓',
        stage: '',
        topics: [],
        questions: [],
        skills: {},
        style: '',
      },
      me: null,
      users: [],
      matches: [],
      encounters: [],
      mapPeople: null,
      soul: null,
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.defaults();
      return { ...this.defaults(), ...JSON.parse(raw) };
    } catch {
      return this.defaults();
    }
  },

  save(patch) {
    const next = { ...this.load(), ...patch };
    localStorage.setItem(this.KEY, JSON.stringify(next));
    return next;
  },

  /* 本次查找会话：切换路由保留，刷新浏览器清除 */
  saveFindSession(session) {
    try {
      sessionStorage.setItem('tongluren_find_session', JSON.stringify(session));
    } catch (_) {}
    return this.save({ findCompleted: true, lastFindId: session?.bestId || null });
  },

  loadFindSession() {
    try {
      const raw = sessionStorage.getItem('tongluren_find_session');
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !Array.isArray(s.topIds) || !s.topIds.length) return null;
      return s;
    } catch {
      return null;
    }
  },

  clearFindSession() {
    try { sessionStorage.removeItem('tongluren_find_session'); } catch (_) {}
  },

  saveAgentLog(userId, log) {
    const s = this.load();
    const map = { ...(s.agentChatLogs || {}) };
    map[userId] = { ...log, savedAt: Date.now() };
    return this.save({ agentChatLogs: map });
  },

  getAgentLog(userId) {
    return this.load().agentChatLogs?.[userId] || null;
  },

  listAgentLogs() {
    const map = this.load().agentChatLogs || {};
    return Object.entries(map)
      .map(([userId, log]) => ({ userId, ...log }))
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  },

  reset() {
    localStorage.removeItem(this.KEY);
    this.clearFindSession();
    return this.defaults();
  },
};

TONG.PRIVACY_OPTIONS = [
  { key: 'public_answers', label: '我的公开回答', desc: 'Agent 可基于公开回答提炼兴趣与能力语义', def: true },
  { key: 'collection_topics', label: '我的收藏主题', desc: '只分享收藏主题的抽象语义，不分享具体条目', def: true },
  { key: 'followed_topics', label: '我的关注话题', desc: '用于判断当前关注领域', def: true },
  { key: 'skill_tags', label: '我的技能标签', desc: '用于知识互补判断', def: true },
  { key: 'private_collections', label: '我的私密收藏', desc: '默认关闭，Agent 不会读取', def: false },
  { key: 'search_history', label: '我的搜索记录', desc: '默认关闭', def: false },
  { key: 'private_messages', label: '我的私信', desc: '永远建议关闭', def: false },
  { key: 'real_identity', label: '我的真实身份信息', desc: '姓名、学校、单位等不会被分享', def: false },
];

TONG.INTENT_OPTIONS = [
  { key: 'open', emoji: '🟢', label: '愿意认识新人', desc: 'Agent 可以在有合理连接价值时推荐你' },
  { key: 'high-match-only', emoji: '🟡', label: '只接受高相关连接', desc: '仅在连接价值很高时才打扰' },
  { key: 'closed', emoji: '🔴', label: '暂时不希望被推荐', desc: 'Agent 会停止对外建立新连接' },
];

TONG.TALK_TOPICS = ['科研', '机器人', '留学', '竞赛', '论文', '转行', '嵌入式', '机器视觉', '求职', '私生活', '投资', '闲聊'];

TONG.utils = {
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  },
  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  },
  nowTime() {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  },
};
