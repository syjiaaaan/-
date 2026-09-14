/* 统一 API 层：默认 Mock，可切换真实 OpenAI 兼容接口 */
(function () {
  const TONG = (window.TONG = window.TONG || {});

  const CFG_KEY = 'tongluren_api_cfg_v1';

  function loadCfg() {
    try {
      return JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
    } catch {
      return {};
    }
  }
  function saveCfg(patch) {
    const next = { ...loadCfg(), ...patch };
    localStorage.setItem(CFG_KEY, JSON.stringify(next));
    return next;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function authed() {
    // 后端代理优先；浏览器直连为可选
    return true;
  }

  async function chatComplete(system, user, temperature = 0.4) {
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];
    // 1) 后端代理（密钥在服务端）
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature, messages }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const text = data?.choices?.[0]?.message?.content || '';
        if (text.trim()) return text.trim();
      }
    } catch (_) { /* fallthrough */ }

    // 2) 浏览器直连（可选）
    const c = loadCfg();
    if (!(c.baseUrl && c.apiKey && c.model)) throw new Error('未配置可用模型通道');
    const url = c.baseUrl.replace(/\/$/, '') + '/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${c.apiKey}`,
      },
      body: JSON.stringify({ model: c.model, temperature, messages }),
    });
    if (!res.ok) throw new Error('LLM HTTP ' + res.status);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return text.trim();
  }

  function extractJson(text) {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }

  /* ---------- Mock providers（预设内容已移除，空数据安全返回） ---------- */
  const mock = {
    async soulProfile(payload) {
      await sleep(300);
      const me = TONG.ME;
      return {
        path: me.currentStage || '',
        skills: me.skills || {},
        confusion: '',
        topics: me.topics || [],
        thinkingStyle: me.thinkingStyle || [],
        canHelp: [],
        privacyScopes: payload?.privacyScopes || [],
      };
    },

    async findCompanions() {
      await sleep(80);
      // 优先使用 AI 已生成的匹配结果
      const stored = TONG.store.load().matches || [];
      if (stored.length) {
        const best = stored[0];
        const prechat = best ? await mock.agentPrechat({ bId: best.userId, best }) : null;
        const four = TONG.matching.getFourTypes();
        return {
          best,
          candidates: stored.slice(0, 6),
          four: {
            same: stored.find((m) => m.type === 'same') || four.same,
            ahead: stored.find((m) => m.type === 'ahead') || four.ahead,
            complement: stored.find((m) => m.type === 'complement') || four.complement,
            different: stored.find((m) => m.type === 'different') || four.different,
          },
          prechatSummary: prechat?.summary || [],
          prechat,
        };
      }
      const four = TONG.matching.getFourTypes();
      const candidates = TONG.matching.getCandidates(6);
      if (!candidates.length) {
        return { best: null, candidates: [], four, prechatSummary: [], prechat: null };
      }
      const best = candidates[0];
      const prechat = await mock.agentPrechat({ bId: best.userId, best });
      return {
        best,
        candidates,
        four,
        prechatSummary: prechat?.summary || [],
        prechat,
      };
    },

    async agentPrechat(payload) {
      await sleep(200);
      const best = payload?.best || TONG.matching.byId(payload?.bId) || TONG.matching.getCandidates(1)[0];
      if (!best || !best.user) return null;
      const b = best.user;
      const rel = TONG.RELATIONS[best.type] || TONG.RELATIONS.same;
      const common = (TONG.ME.topics || []).filter((t) => (b.topics || []).some((x) => x.includes(t) || t.includes(x)));
      const myStrong = Object.entries(TONG.ME.skills || {}).filter(([, v]) => v >= 4).map(([k]) => k);
      const myWeak = Object.entries(TONG.ME.skills || {}).filter(([, v]) => v <= 2).map(([k]) => k);
      const theirStrong = Object.entries(b.skills || {}).filter(([, v]) => v >= 4).map(([k]) => k);
      const theirWeak = Object.entries(b.skills || {}).filter(([, v]) => v <= 2).map(([k]) => k);
      const intent = b.socialIntent === 'open' ? '愿意认识新人' : b.socialIntent === 'high-match-only' ? '仅高相关连接' : '暂不推荐';
      const meName = TONG.ME.name || '我';
      const now = Date.now();
      const t = (i) => new Date(now + i * 1200).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const chatLog = [
        { id: 'm1', who: 'A', from: `Agent·${meName}`, time: t(0), text: `你好，我是 ${meName} 的 Soul Agent。授权范围内发起连接评估。当前：${TONG.ME.currentStage || '待完善'}。` },
        { id: 'm2', who: 'B', from: `Agent·${b.name}`, time: t(1), text: `收到。对方公开轨迹：${b.currentStage || b.name}。开始核对连接价值。` },
        { id: 'm3', who: 'A', from: `Agent·${meName}`, time: t(2), text: `第 1 步 · 兴趣对齐。我方：${(TONG.ME.topics || []).join('、') || '（待补充）'}。你方：${(b.topics || []).join('、') || '（待补充）'}。` },
        { id: 'm4', who: 'B', from: `Agent·${b.name}`, time: t(3), text: common.length ? `交集命中：${common.join('、')}。` : '主题相邻，可交换路径经验。' },
        { id: 'm5', who: 'SYS', from: '轨迹评估', time: t(4), text: `关系类型判定：「${rel.name}」——${rel.desc}。切口：${best.reason?.talk || ''}` },
        { id: 'm6', who: 'A', from: `Agent·${meName}`, time: t(5), text: `破冰建议：「${best.reason?.icebreaker || ''}」` },
        { id: 'm7', who: 'B', from: `Agent·${b.name}`, time: t(6), text: `可接受。意愿：${intent}。可聊：${(b.willingToTalk || []).join('、') || '相关路径'}。` },
        { id: 'm8', who: 'SYS', from: '连接评估', time: t(7), text: `连接价值成立。等待双方真人决定是否接管。` },
      ];

      const summary = [
        `双方 Agent 完成 ${chatLog.length} 条预交流记录。`,
        common.length ? `共同关注：${common.join('、')}。` : '主题相邻。',
        theirStrong.length ? `知识互补：对方偏 ${theirStrong.slice(0, 2).join('、')}；你偏 ${myStrong.slice(0, 2).join('、') || '—'}。` : '知识互补待确认。',
        `关系判定：${rel.name}。`,
        `对方意愿：${intent}。`,
      ];

      const result = {
        turns: chatLog.map((m) => ({ who: m.who, from: m.from, text: m.text, time: m.time })),
        chatLog,
        summary,
        facets: {
          common: common.length ? common : [],
          complement: theirStrong.slice(0, 3),
          tension: best.type === 'different' ? ['观点可能不同'] : [],
          willingness: intent,
        },
        icebreaker: best.reason?.icebreaker || '',
        connectionValue: 'medium',
        aId: 'me',
        bId: b.id,
        bName: b.name,
        relationType: best.type,
        title: `Agent 预交流 · ${meName} ↔ ${b.name}`,
      };

      try {
        if (TONG.store?.saveAgentLog) {
          TONG.store.saveAgentLog(b.id, {
            title: result.title,
            bName: b.name,
            bId: b.id,
            relationType: best.type,
            chatLog,
            summary,
            facets: result.facets,
            icebreaker: result.icebreaker,
          });
        }
      } catch (_) {}

      return result;
    },

    async icebreaker(payload) {
      await sleep(200);
      const c = TONG.matching.byId(payload?.userId);
      return {
        text: c?.reason?.icebreaker || '',
        why: c?.reason?.talk || '',
      };
    },

    async encounters() {
      await sleep(150);
      return { items: TONG.ENCOUNTERS || [] };
    },
  };

  /* ---------- Live providers (OpenAI-compatible) ---------- */
  const live = {
    async soulProfile(payload) {
      const me = TONG.ME;
      const sys =
        '你是知乎知识社交产品「同路人」的 Soul Profile 生成器。只输出 JSON，不要 markdown。字段：path,confusion,topics,thinkingStyle,canHelp。均为中文字符串或字符串数组。不要编造隐私。';
      const user = `根据以下授权语义生成知识人格（非人格测试）：
当前阶段：${me.currentStage}
技能：${JSON.stringify(me.skills)}
近期问题：${me.recentQuestions.join('；')}
话题：${me.topics.join('、')}
授权范围：${(payload?.privacyScopes || []).join(',')}`;
      const text = await chatComplete(sys, user, 0.3);
      const j = extractJson(text) || {};
      return {
        path: j.path || me.currentStage || '',
        skills: me.skills || {},
        confusion: j.confusion || '',
        topics: Array.isArray(j.topics) ? j.topics : me.topics || [],
        thinkingStyle: Array.isArray(j.thinkingStyle) ? j.thinkingStyle : me.thinkingStyle || [],
        canHelp: Array.isArray(j.canHelp) ? j.canHelp : [],
        privacyScopes: payload?.privacyScopes || [],
      };
    },

    async findCompanions() {
      const base = await mock.findCompanions();
      if (!base.best) return base;
      try {
        const enriched = await live.agentPrechat({ bId: base.best.userId, best: base.best });
        base.prechat = enriched;
        base.prechatSummary = enriched?.summary || [];
      } catch (_) {
        /* keep mock prechat */
      }
      return base;
    },

    async agentPrechat(payload) {
      const fallback = await mock.agentPrechat(payload);
      const best = payload?.best || TONG.matching.byId(payload?.bId) || TONG.matching.getCandidates(1)[0];
      if (!best || !best.user) return fallback;
      const b = best.user;
      const rel = TONG.RELATIONS[best.type] || TONG.RELATIONS.same;
      try {
        const sys =
          '你是知乎「同路人」双边 Agent 预交流记录生成器。禁止编造隐私，禁止输出真人私聊。只输出 JSON：{chatLog:[{who:A|B|SYS,from,text,time}](12-16条，中文口语但克制专业),summary[string],facets{common[],complement[],tension[],willingness},connectionValue}。chatLog 要像真实多轮核对：开场→兴趣→卡点→技能互补→轨迹→关系判定→意愿→破冰协商→结论。';
        const user = `A（${TONG.ME.name || '我'}）：${TONG.ME.currentStage || ''}
话题：${TONG.ME.topics.join('、')}
技能：${JSON.stringify(TONG.ME.skills)}
问题：${TONG.ME.recentQuestions.join('；')}
思考风格：${(TONG.ME.thinkingStyle || []).join('；')}

B（${b.name}，仅公开语义）：${b.currentStage}
话题：${(b.topics || []).join('、')}
认证：${b.publicBadge || '无'}
技能：${JSON.stringify(b.skills || {})}
意愿：${b.socialIntent}
可聊：${(b.willingToTalk || []).join('、')}
关系：${rel.name} · ${best.reason.talk}
破冰：${best.reason.icebreaker}`;
        const text = await chatComplete(sys, user, 0.5);
        const j = extractJson(text);
        if (j?.chatLog?.length >= 8) {
          const now = Date.now();
          const chatLog = j.chatLog.map((m, i) => ({
            id: `m${i + 1}`,
            who: m.who || 'SYS',
            from: m.from || (m.who === 'A' ? `Agent·${TONG.ME.name || '我'}` : m.who === 'B' ? `Agent·${b.name}` : '系统'),
            text: m.text || '',
            time: m.time || new Date(now + i * 1100).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          }));
          const result = {
            turns: chatLog.map((m) => ({ who: m.who, from: m.from, text: m.text, time: m.time })),
            chatLog,
            summary: j.summary || fallback.summary,
            facets: j.facets || fallback.facets,
            icebreaker: best.reason.icebreaker,
            connectionValue: j.connectionValue || 'high',
            aId: 'me',
            bId: b.id,
            bName: b.name,
            relationType: best.type,
            title: `Agent 预交流 · ${TONG.ME.name || '我'} ↔ ${b.name}`,
          };
          try { TONG.store?.saveAgentLog?.(b.id, result); } catch (_) {}
          return result;
        }
      } catch (_) {}
      return fallback;
    },

    async icebreaker(payload) {
      try {
        const c = TONG.matching.byId(payload?.userId);
        if (!c?.user) return mock.icebreaker(payload);
        const sys =
          '你是破冰开场生成器。结合「你为什么认识 TA」写自然、具体、可回复的一句话。只输出 JSON：{"text":"...","why":"..."}';
        const user = `我：${TONG.ME.currentStage || ''}
TA：${c.user.currentStage || c.user.name || ''}
互补：${(c.reason?.potentialExchange || []).join('；')}
推荐问题：${c.reason?.icebreaker || ''}`;
        const text = await chatComplete(sys, user, 0.5);
        const j = extractJson(text);
        if (j?.text) return j;
      } catch (_) {}
      return mock.icebreaker(payload);
    },

    async encounters() {
      return mock.encounters();
    },
  };

  async function call(name, payload) {
    const useLive = authed() && live[name];
    try {
      if (useLive) return await live[name](payload);
      return await mock[name](payload);
    } catch (err) {
      console.warn('[API] fall back to mock', name, err);
      return await mock[name](payload);
    }
  }

  TONG.api = {
    loadCfg,
    saveCfg,
    authed,
    soulProfile: (p) => call('soulProfile', p),
    findCompanions: (p) => call('findCompanions', p),
    agentPrechat: (p) => call('agentPrechat', p),
    icebreaker: (p) => call('icebreaker', p),
    encounters: (p) => call('encounters', p),
    mock,
  };
})();
