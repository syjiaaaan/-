/* 匹配算法：连接价值 = 兴趣 + 互补 + 轨迹 + 需求 + 适配 + 时效 - 风险 */
window.TONG = window.TONG || {};

(function () {
  const SKILL_KEYS = Object.keys(TONG.ME.skills || {});

  function overlap(a = [], b = []) {
    const setB = new Set(b);
    return a.filter((x) => setB.has(x));
  }

  function jaccard(a = [], b = []) {
    if (!a.length && !b.length) return 0;
    const sa = new Set(a);
    const sb = new Set(b);
    let inter = 0;
    sa.forEach((x) => { if (sb.has(x)) inter += 1; });
    const union = sa.size + sb.size - inter;
    return union ? inter / union : 0;
  }

  function complementarityScore(user) {
    const mySkills = TONG.ME.skills;
    const theirSkills = user.skills || {};
    let gain = 0;
    let cover = 0;
    SKILL_KEYS.forEach((k) => {
      const mine = mySkills[k] || 0;
      const theirs = theirSkills[k] || 0;
      if (mine <= 2 && theirs >= 4) {
        gain += 1;
        cover += (theirs - mine) / 5;
      }
    });
    // 他们弱、我强的技能也算互补
    Object.keys(theirSkills).forEach((k) => {
      const mine = mySkills[k] || 0;
      const theirs = theirSkills[k] || 0;
      if (theirs <= 2 && mine >= 4) gain += 0.6;
    });
    return Math.min(1, cover * 0.7 + Math.min(gain, 3) * 0.1);
  }

  function trajectoryScore(user) {
    const theirQ = (user.recentQuestions || []).join(' ');
    const myQ = (TONG.ME.recentQuestions || []).join(' ');
    const myTopics = TONG.ME.topics || [];
    const theirTopics = user.topics || [];
    const topicSim = jaccard(myTopics, theirTopics);
    // 历史问题是否覆盖我现在的困惑
    const pathKeywords = ['实验室', '入门', '第一次', '竞赛', '机器人', '投稿', '科研', '视觉', '嵌入式'];
    let hit = 0;
    pathKeywords.forEach((k) => {
      if (theirQ.includes(k) && (myQ.includes(k) || myTopics.some((t) => t.includes(k.slice(0, 2))))) hit += 1;
    });
    const trajEvents = (user.trajectory || []).map((t) => t.event).join(' ');
    let stageOverlap = 0;
    if (trajEvents.includes('实验室') || trajEvents.includes('竞赛') || trajEvents.includes('第一次')) stageOverlap = 0.3;
    return Math.min(1, topicSim * 0.55 + Math.min(hit / 4, 1) * 0.25 + stageOverlap);
  }

  function discussionScore(user) {
    // 开放意愿更高适配；high-match-only 略降
    if (user.socialIntent === 'closed') return 0.05;
    if (user.socialIntent === 'high-match-only') return 0.55;
    return 0.85;
  }

  function socialRisk(user) {
    if (user.socialIntent === 'closed') return 0.8;
    const myBlock = new Set(TONG.ME.notWillingToTalk || []);
    const clash = (user.willingToTalk || []).filter((t) => myBlock.has(t)).length;
    return Math.min(0.5, clash * 0.2);
  }

  function temporalScore(user) {
    const topics = new Set([...(TONG.ME.topics || []), ...(TONG.ME.recentQuestions || [])]);
    const theirs = [...(user.topics || []), ...(user.recentQuestions || [])];
    let hit = 0;
    theirs.forEach((t) => {
      topics.forEach((m) => {
        if (t.includes(m) || m.includes(String(t).slice(0, 2))) hit += 1;
      });
    });
    return Math.min(1, hit / 5);
  }

  function inferType(user, scores) {
    const traj = scores.trajectory;
    const comp = scores.complementarity;
    const stage = user.currentStage + (user.shortStage || '');
    const trajEvents = (user.trajectory || []).map((t) => t.event).join(' ');
    const workedBefore =
      /工作|博|研[二三]|工程师|海外/.test(stage) ||
      trajEvents.includes('开始回答') ||
      trajEvents.includes('分享') ||
      trajEvents.includes('进入机器人公司') ||
      trajEvents.includes('进入实验室') ||
      trajEvents.includes('中稿');

    if (user.id === 'u16' || user.id === 'u17' || user.id === 'u4') return 'different';
    if (comp >= 0.35 && scores.interest < 0.55) return 'complement';
    if (workedBefore && traj > 0.2) return 'ahead';
    if (comp > 0.45) return 'complement';
    return 'same';
  }

  function buildReason(user, type, scores) {
    const myQ = (TONG.ME.recentQuestions || [])[0] || '当前路径优先级';
    const myStrong = Object.entries(TONG.ME.skills || {}).filter(([, v]) => v >= 4).map(([k]) => k);
    const myWeak = Object.entries(TONG.ME.skills || {}).filter(([, v]) => v <= 2).map(([k]) => k);
    const theirStrong = Object.entries(user.skills || {}).filter(([, v]) => v >= 4).map(([k]) => k);
    const map = {
      ahead: {
        title: `找到一位「前路人」`,
        yourStage: (TONG.ME.pathNodes || [])
          .filter((n) => n.status === 'current' || n.status === 'done')
          .slice(-3)
          .map((n) => `正在经历：${n.label}`)
          .concat(TONG.ME.currentStage ? [`当前：${TONG.ME.currentStage}`] : []),
        theirTrajectory: (user.trajectory || []).slice(-4).map((t) => `${t.year} · ${t.event}`),
        commonGoals: overlap(TONG.ME.topics, user.topics).slice(0, 3),
        potentialExchange: [
          `TA 擅长的：${theirStrong.slice(0, 3).join('、') || '路径经验'}`,
          `你正在困惑的：${myQ}`,
        ],
        icebreaker: '如果重新走一遍你现在这段路，你最希望有人提前告诉你什么？',
        talk: '「你当时是怎么做优先级取舍的？」',
      },
      same: {
        title: `找到一位「同路人」`,
        yourStage: [`你现在：${TONG.ME.shortStage || TONG.ME.currentStage || '—'}`],
        theirTrajectory: (user.trajectory || []).slice(-3).map((t) => `${t.year} · ${t.event}`),
        commonGoals: overlap(TONG.ME.topics, user.topics).slice(0, 3),
        potentialExchange: [
          '可以互相打气与交换进度',
          '同一阶段的不同解法，往往比标准答案更有用',
        ],
        icebreaker: '你现在把时间主要花在哪儿？有没有后悔过优先级？',
        talk: '「我们卡在了相似的节点，也许可以一起往前推一点。」',
      },
      complement: {
        title: `找到一位「补路人」`,
        yourStage: [
          myWeak.length ? `你的短板：${myWeak.slice(0, 3).join('、')}` : '你在寻找互补能力',
          myStrong.length ? `你的优势：${myStrong.slice(0, 3).join('、')}` : '',
        ].filter(Boolean),
        theirTrajectory: (user.trajectory || []).slice(-3).map((t) => `${t.year} · ${t.event}`),
        commonGoals: overlap(TONG.ME.topics, user.topics).slice(0, 3),
        potentialExchange: [
          `你可能需要的：${theirStrong.slice(0, 3).join('、') || '相邻能力'}`,
          myStrong.length ? `你能提供的：${myStrong.slice(0, 3).join('、')}` : '路径与项目经验',
        ],
        icebreaker: `看到你在「${(user.topics || [])[0] || '相关领域'}」上比较强，我最近正好卡在这里。如果第一次做，你会怎么切入？`,
        talk: '「你们最值得交换的，不是寒暄，而是彼此刚好缺的那一块。」',
      },
      different: {
        title: `找到一位「异路人」`,
        yourStage: [`你更倾向：${TONG.ME.thinkingStyle?.[0] || '具体落地'}`, '你正在收集路径建议'],
        theirTrajectory: (user.trajectory || []).slice(-3).map((t) => `${t.year} · ${t.event}`),
        commonGoals: overlap([...TONG.ME.topics, '路径选择'], [...(user.topics || []), '路径选择']).slice(0, 3),
        potentialExchange: [
          '观点不同，但讨论理性',
          '一次高质量分歧，可能帮你校准自己的判断',
        ],
        icebreaker: `关于「${myQ}」，你的判断和我可能不太一样。你后来有没有改过看法？`,
        talk: '「我们可能值得认真聊一次——不是为了说服对方，而是为了看清自己的选择。」',
      },
    };
    const base = map[type] || map.same;
    if (!base.commonGoals || !base.commonGoals.length) {
      base.commonGoals = overlap(TONG.ME.topics, user.topics);
      if (!base.commonGoals.length) base.commonGoals = user.topics.slice(0, 2);
    }
    return base;
  }

  TONG.matching = {
    scoreUser(user) {
      if (!user) return null;
      const interest = jaccard(TONG.ME.topics, user.topics) * 0.7 +
        jaccard(TONG.ME.recentQuestions, user.recentQuestions) * 0.3;
      const complementarity = complementarityScore(user);
      const trajectory = trajectoryScore(user);
      const questionRelevance = jaccard(
        TONG.ME.recentQuestions.map((q) => q.slice(0, 4)),
        (user.recentQuestions || []).map((q) => q.slice(0, 4))
      );
      const discussionCompatibility = discussionScore(user);
      const temporalRelevance = temporalScore(user);
      const risk = socialRisk(user);

      const scores = {
        interest: Math.min(1, interest),
        complementarity,
        trajectory,
        questionRelevance,
        discussionCompatibility,
        temporalRelevance,
        socialRisk: risk,
      };

      const connectionValue =
        0.25 * scores.interest +
        0.25 * scores.complementarity +
        0.20 * scores.trajectory +
        0.15 * scores.questionRelevance +
        0.10 * scores.discussionCompatibility +
        0.05 * scores.temporalRelevance -
        scores.socialRisk;

      const type = inferType(user, scores);
      return {
        userId: user.id,
        type,
        score: Math.max(0, connectionValue),
        scores,
        reason: buildReason(user, type, scores),
        user,
      };
    },

    getCandidates(limit = 6) {
      return (TONG.USERS || [])
        .filter((u) => u && u.id !== TONG.ME.id && u.socialIntent !== 'closed')
        .map((u) => this.scoreUser(u))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },

    getFourTypes() {
      const all = (TONG.USERS || [])
        .filter((u) => u && u.socialIntent !== 'closed')
        .map((u) => this.scoreUser(u))
        .filter(Boolean);
      const forceType = (cand, type) => {
        if (!cand) return cand;
        return {
          ...cand,
          type,
          reason: buildReason(cand.user, type, cand.scores),
        };
      };
      const pick = (type) => all.filter((c) => c.type === type).sort((a, b) => b.score - a.score)[0] || null;
      return {
        same: pick('same'),
        ahead: pick('ahead'),
        complement: pick('complement'),
        different: pick('different'),
      };
    },

    byId(id) {
      if (!id) return null;
      return this.getCandidates(50).find((c) => c.userId === id) || this.scoreUser(TONG.USERS.find((u) => u.id === id));
    },
  };
})();
