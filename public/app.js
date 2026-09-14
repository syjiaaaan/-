/* 知遇.同路人 — 应用逻辑 */
window.TONG = window.TONG || {};

(function () {
  const root = document.getElementById('page-root');

  /* ---------- utils ---------- */
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  function diceUrl(seed) {
    return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e8f3ff,e6f8f1,fff7e6,f3eeff`;
  }
  function initialFallback(name, color) {
    const ch = String(name || '?').trim().charAt(0) || '?';
    const bg = color || '#0084FF';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="24" fill="${bg}"/><text x="48" y="58" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="36" font-weight="700" fill="#fff">${esc(ch)}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  function avatar(user, size = '') {
    const cls = size ? `avatar avatar-${size} avatar-dice` : 'avatar avatar-dice';
    const seed = esc(user?.avatarSeed || user?.id || user?.name || 'me');
    const name = esc(user?.name || '?');
    if (user?.avatarUrl) {
      return `<div class="${cls}" title="${name}"><img class="avatar-img" src="${esc(user.avatarUrl)}" alt="${name}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${initialFallback(user?.name, user?.color)}'" /></div>`;
    }
    return `<div class="${cls}" title="${name}"><img class="avatar-img" src="${diceUrl(seed)}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='${initialFallback(user?.name, user?.color)}'" /></div>`;
  }
  function iconSvg(name) {
    const icons = {
      find: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/><circle cx="11" cy="11" r="2.5"/></svg>',
      encounter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M12 5l7 7-7 7" opacity=".35"/><circle cx="7" cy="12" r="2.5"/><circle cx="17" cy="12" r="2.5"/></svg>',
      map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 18c3-6 5-8 8-8s5 2 8 8"/><circle cx="6" cy="16" r="2"/><circle cx="12" cy="8" r="2"/><circle cx="18" cy="16" r="2"/></svg>',
      soul: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c1.2-3.5 3.5-5 6.5-5s5.3 1.5 6.5 5"/></svg>',
      shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 3.5v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-5L12 3z"/></svg>',
    };
    return icons[name] || icons.find;
  }
  function heroVisualSvg() {
    return `<img class="hero-photo" src="./assets/hero-main.jpg" alt="知识轨迹主视觉" />`;
  }
  function sceneBg(src, content, veilClass = '') {
    return `<div class="scene-bg">
      <img class="scene-bg-img" src="${src}" alt="" loading="lazy" />
      <div class="scene-bg-veil ${veilClass}"></div>
      <div class="scene-content">${content}</div>
    </div>`;
  }
  function pageHero(src, title, desc) {
    return `<div class="page-hero-visual">
      <img src="${src}" alt="" loading="lazy" />
      <div class="veil">
        <div class="veil-text">
          <h1 class="h2">${esc(title)}</h1>
          ${desc ? `<p>${esc(desc)}</p>` : ''}
        </div>
      </div>
    </div>`;
  }
  function encounterIllu(type) {
    const map = {
      agree: '<svg viewBox="0 0 40 40" fill="none"><path d="M8 20h8l3-8 4 16 3-8h6" stroke="#0084FF" stroke-width="2" stroke-linecap="round"/></svg>',
      collect: '<svg viewBox="0 0 40 40" fill="none"><rect x="8" y="12" width="14" height="16" rx="3" stroke="#10B981" stroke-width="2"/><rect x="18" y="12" width="14" height="16" rx="3" stroke="#0084FF" stroke-width="2" fill="#E8F3FF"/></svg>',
      question: '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="12" stroke="#0084FF" stroke-width="2"/><path d="M16 17c0-2.5 2-4 4-4s4 1.5 4 3.5c0 2-2 2.5-3 3.5v2" stroke="#0084FF" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="27" r="1.2" fill="#0084FF"/></svg>',
      timeline: '<svg viewBox="0 0 40 40" fill="none"><path d="M6 20h28" stroke="#CBD5E1" stroke-width="2"/><circle cx="12" cy="20" r="4" fill="#10B981"/><circle cx="28" cy="20" r="4" fill="#0084FF"/><path d="M12 20h16" stroke="#0084FF" stroke-width="1.5" stroke-dasharray="2 3"/></svg>',
      opinion: '<svg viewBox="0 0 40 40" fill="none"><circle cx="15" cy="18" r="8" stroke="#0084FF" stroke-width="2"/><circle cx="25" cy="22" r="8" stroke="#8B5CF6" stroke-width="2"/></svg>',
    };
    return map[type] || map.agree;
  }
  function tagHtml(type) {
    const r = TONG.RELATIONS[type] || TONG.RELATIONS.same;
    return `<span class="tag tag-${type}"><span class="dot dot-${type}"></span>${r.name}</span>`;
  }
  function toast(msg) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
  function userById(id) {
    return TONG.USERS.find((u) => u.id === id) || (id === 'me' ? TONG.ME : null);
  }

  function emptyBox(title, desc, actionHtml = '') {
    return `<div class="card card-plain" style="text-align:center;padding:36px 20px;border-style:dashed">
      <div class="h3" style="margin-bottom:8px">${esc(title)}</div>
      <p class="small muted" style="max-width:36em;margin:0 auto 16px">${esc(desc)}</p>
      ${actionHtml}
    </div>`;
  }

  function hasPeople() {
    return (TONG.USERS || []).length > 0;
  }
  function skillBars(skills) {
    return Object.entries(skills || {}).map(([name, val]) => `
      <div class="skill-row">
        <span>${esc(name)}</span>
        <div class="skill-bar"><div class="skill-fill" style="width:${(val / 5) * 100}%"></div></div>
        <span class="tiny">${val}/5</span>
      </div>`).join('');
  }
  function relationLegend() {
    return `<div class="chip-list" style="margin-bottom:24px;justify-content:center">
      ${Object.values(TONG.RELATIONS).map((r) => `
        <span class="tag tag-${r.key}"><span class="dot dot-${r.key}"></span>${r.name} · ${r.desc}</span>
      `).join('')}
    </div>`;
  }

  /* ---------- routing ---------- */
  function parseRoute() {
    const hash = location.hash.replace(/^#/, '') || '/';
    const parts = hash.split('/').filter(Boolean);
    if (!parts.length) return { name: 'home', params: {} };
    if (parts[0] === 'reason') return { name: 'reason', params: { id: parts[1] } };
    if (parts[0] === 'chat') return { name: 'chat', params: { id: parts[1] } };
    const map = {
      soul: 'soul', find: 'find', encounter: 'encounter',
      map: 'map', settings: 'settings', demo: 'demo', profile: 'profile',
    };
    return { name: map[parts[0]] || 'home', params: {} };
  }

  function setActiveNav(route) {
    document.querySelectorAll('.nav-link').forEach((a) => {
      a.classList.toggle('active', a.dataset.route === `/${route === 'home' ? '' : route}`);
    });
    const links = document.getElementById('nav-links');
    if (links) links.classList.remove('open');
  }

  function navigate(path) {
    location.hash = path.startsWith('#') ? path : `#${path}`;
  }

  /* ---------- pages ---------- */
  const pages = {
    profile() {
      return `
        <div class="container container-narrow">
          <div class="section-card">
            <h3 class="h3">知乎账号信息</h3>
            <p class="small muted" style="margin-bottom:16px">来自 OAuth 授权后的公开资料与创作/关注/收藏数据。</p>
            <div id="profile-body" class="small muted">正在读取账号信息…</div>
            <div class="action-row" id="profile-actions"></div>
          </div>
        </div>`;
    },
    home() {
      const previews = TONG.ENCOUNTERS.slice(0, 3);
      return `
        <div class="container">
          <section class="hero">
            <div class="hero-copy">
              <div class="hero-badge">✦ Agent 先相遇，让人与人真正认识</div>
              <h1 class="h1">
                <span class="hero-line">答案之外，</span>
                <span class="hero-line">找到走过这条路的人。</span>
              </h1>
              <p class="lead">让 AI 不只是回答你的问题，而是帮你找到曾经走过、正在同行、或能补上下一段路的人。</p>
              <div class="hero-actions">
                <button class="btn btn-primary btn-lg" id="btn-ai-generate" data-guide="1">AI 生成并寻找同路人</button>
                <a href="#/profile" class="btn btn-ghost btn-lg" data-link>我的知乎</a>
              </div>
              <div class="hero-guide-hint" id="hero-guide-hint" hidden>点击上方大按钮，用你的知乎数据生成并开始找同路人</div>
            </div>
            <div class="hero-visual">${heroVisualSvg()}</div>
          </section>

          <section class="card card-plain" id="ai-console-card" style="margin-bottom:28px;display:none">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
              <h3 class="h3" style="margin:0">AI 生成控制台</h3>
              <span class="tiny muted" id="ai-health">检测中…</span>
            </div>
            <div class="tip-banner" style="margin-bottom:12px">
              <span>✦</span>
              <div>流程：后端全量拉取创作/关注/收藏 → AI 分析 → 填入 Soul / 匹配 / 擦肩 / 地图。候选同路人来自知乎搜索。</div>
            </div>
            <div id="ai-steps" class="small muted" style="font-family:ui-monospace,Consolas,monospace;line-height:1.9"></div>
            <div class="action-row" style="margin-bottom:0">
              <button class="btn btn-primary btn-sm" id="btn-ai-generate-2">开始生成</button>
              <a class="btn btn-secondary btn-sm" href="#/settings" data-link>编辑主角简介</a>
            </div>
          </section>

          <section class="grid-3 stagger" style="margin-bottom:28px">
            <a href="#/find" data-link class="card entry-card" data-accent="blue">
              <div class="entry-icon" style="background:var(--blue-soft);color:var(--blue)">${iconSvg('find')}</div>
              <h3 class="h3">找同路人</h3>
              <p>AI 主动帮我找值得认识的人</p>
              <span class="entry-arrow">→</span>
            </a>
            <a href="#/encounter" data-link class="card entry-card" data-accent="green">
              <div class="entry-icon" style="background:var(--green-soft);color:var(--green)">${iconSvg('encounter')}</div>
              <h3 class="h3">今日擦肩</h3>
              <p>看看今天和谁产生了隐藏交集</p>
              <span class="entry-arrow">→</span>
            </a>
            <a href="#/map" data-link class="card entry-card" data-accent="amber">
              <div class="entry-icon" style="background:var(--amber-soft);color:#D97706">${iconSvg('map')}</div>
              <h3 class="h3">同行地图</h3>
              <p>看我正在走的路，以及谁走过这里</p>
              <span class="entry-arrow">→</span>
            </a>
          </section>

          <section class="card card-plain" style="margin-bottom:28px;display:flex;gap:20px;align-items:center;flex-wrap:wrap">
            ${avatar(TONG.ME, 'lg')}
            <div style="flex:1;min-width:200px">
              <div class="small muted" style="margin-bottom:4px">我的 Soul Agent</div>
              <div style="font-weight:600;margin-bottom:4px">🟢 愿意认识新人</div>
              <p class="small muted">我的 Agent 会先替我去认识别人。</p>
            </div>
            <a href="#/soul" class="btn btn-secondary btn-sm" data-link>查看我的 Soul Profile</a>
          </section>

          <section class="grid-2">
            <div class="card card-plain">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <h3 class="h3">今日擦肩预览</h3>
                <a href="#/encounter" class="tiny" style="color:var(--blue)" data-link>全部 →</a>
              </div>
              ${previews.length
                ? `<div class="stagger" style="display:flex;flex-direction:column;gap:10px">
                ${previews.map((e) => {
                  const u = userById(e.userId);
                  return `<div style="display:flex;gap:12px;align-items:center;padding:12px;background:var(--bg);border-radius:16px">
                    ${avatar(u, 'sm')}
                    <div>
                      <div class="small" style="font-weight:500">${esc(e.desc)}</div>
                      <div class="tiny">${esc(e.typeName)} · ${esc(u?.name || '')}</div>
                    </div>
                  </div>`;
                }).join('')}
              </div>`
                : `<p class="small muted">暂无擦肩记录。预设数据已清空，等待接入真实轨迹后出现。</p>`}
            </div>

            <div class="card card-plain">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <h3 class="h3">同行地图预览</h3>
                <a href="#/map" class="tiny" style="color:var(--blue)" data-link>展开 →</a>
              </div>
              ${(TONG.ME.pathNodes || []).length
                ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
                ${TONG.ME.pathNodes.map((n, i) => {
                  const style = n.status === 'done' ? 'background:var(--blue);color:#fff;border-color:var(--blue)'
                    : n.status === 'current' ? 'background:var(--blue-soft);color:var(--blue);border-color:var(--blue)'
                    : 'background:var(--card);color:var(--ink-3);border-color:var(--border)';
                  return `<span style="padding:8px 12px;border-radius:999px;border:1px solid;font-size:12px;${style}">${esc(n.label)}</span>
                    ${i < TONG.ME.pathNodes.length - 1 ? '<span style="color:var(--ink-4);align-self:center">→</span>' : ''}`;
                }).join('')}
              </div>
              <p class="small muted">路径节点将随你的授权画像自动生成。</p>`
                : `<p class="small muted">尚未生成路径。完成授权或导入轨迹后，这里会显示你正在走的路与同行者。</p>`}
            </div>
          </section>
        </div>`;
    },

    soul() {
      const me = TONG.ME;
      return `
        <div class="container container-narrow">
          ${pageHero('./assets/soul-profile.jpg', '我的知乎轨迹', '这不是人格测试，而是随行为变化的动态画像。Agent 只使用你授权的信息。')}
          <div class="soul-hero">
            ${avatar(me, 'lg')}
            <div>
              <div class="tiny" style="margin-bottom:6px">Soul Profile · 知识人格</div>
              <h1 class="h2">我的知乎轨迹</h1>
              <p class="lead small" style="margin-top:8px">这不是人格测试，而是随行为变化的动态画像。Agent 只使用你授权的信息。</p>
            </div>
          </div>

          <div class="action-row" style="margin-bottom:28px">
            <button class="btn btn-primary btn-sm" id="soul-regen">重新生成</button>
            <button class="btn btn-secondary btn-sm" id="soul-edit-skills">编辑技能标签</button>
            <button class="btn btn-secondary btn-sm" id="soul-share">导出分享卡</button>
            <a href="#/settings" class="btn btn-ghost btn-sm" data-link>调整授权范围</a>
          </div>

          <div id="soul-content" class="stagger">
            <div class="section-card">
              <h3 class="h3"><span class="section-num">1</span>我最近在走什么路</h3>
              <p class="muted small">${esc(TONG.store.load().soul?.path || me.currentStage || '尚未生成。点击「重新生成」由 AI 填写。')}</p>
            </div>
            <div class="section-card">
              <h3 class="h3"><span class="section-num">2</span>我知道什么</h3>
              ${Object.keys(me.skills || {}).length
                ? skillBars(me.skills)
                : '<p class="muted small">暂无技能标签。</p>'}
            </div>
            <div class="section-card">
              <h3 class="h3"><span class="section-num">3</span>我正在困惑什么</h3>
              <div class="quote-box muted small">${esc(TONG.store.load().soul?.confusion || '尚未生成困惑摘要。')}</div>
            </div>
            <div class="section-card">
              <h3 class="h3"><span class="section-num">4</span>我最近关注什么</h3>
              ${(me.topics || []).length
                ? `<div class="chip-list">${me.topics.map((t) => `<span class="chip active">${esc(t)}</span>`).join('')}</div>`
                : '<p class="muted small">暂无关注话题。</p>'}
            </div>
            <div class="section-card">
              <h3 class="h3"><span class="section-num">5</span>我通常如何思考问题</h3>
              ${(me.thinkingStyle || []).length
                ? `<ul style="padding-left:18px;color:var(--ink-2);font-size:14px;line-height:1.9">${me.thinkingStyle.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
                : '<p class="muted small">暂无思考风格描述。</p>'}
            </div>
            <div class="section-card">
              <h3 class="h3"><span class="section-num">6</span>我可能帮助别人什么</h3>
              ${(TONG.store.load().soul?.canHelp || []).length
                ? `<div class="chip-list">${TONG.store.load().soul.canHelp.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>`
                : '<p class="muted small">将根据授权与 AI 生成内容填充。</p>'}
            </div>
          </div>
        </div>`;
    },

    find() {
      if (!hasPeople()) {
        return `
        <div class="container">
          ${pageHero('./assets/find-livingroom.jpg', '让 Agent 先替你认识', '候选池为空时，可先用 AI 一键生成全站内容。')}
          ${relationLegend()}
          ${emptyBox(
            '暂无候选同路人',
            '用内置提示词 + 后端 DeepSeek 生成用户画像、候选池与匹配理由。',
            '<button class="btn btn-primary btn-sm" id="btn-ai-generate">AI 一键生成全站内容</button>'
          )}
          <div id="ai-console-card" class="card card-plain" style="margin-top:16px;display:block">
            <div id="ai-steps" class="small muted" style="font-family:ui-monospace,Consolas,monospace;line-height:1.9"></div>
          </div>
        </div>`;
      }
      return `
        <div class="container">
          ${pageHero('./assets/find-livingroom.jpg', '让 Agent 先替你认识', '点击后直接直播双方 Agent 的实时互聊，不再冗长巡游房间。')}

          ${relationLegend()}

          <div class="scene-bg living-room has-bg" id="living-room" style="min-height:220px;margin-bottom:16px">
            <img class="scene-bg-img" src="./assets/find-livingroom.jpg" alt="" loading="lazy" />
            <div class="scene-bg-veil strong"></div>
            <div class="scene-content" style="min-height:220px;position:relative">
              <div class="living-room-center" style="top:42%">
                <div class="my-agent">我</div>
                <div class="my-agent-label">我的 Agent</div>
              </div>
              <div class="room room-r1" data-room="0"></div>
              <div class="room room-r2" data-room="1"></div>
              <div class="room room-r3" data-room="2"></div>
              <div class="room room-r4" data-room="3"></div>
            </div>
          </div>

          <div class="progress-log" id="progress-log">
            <p class="muted">准备好了吗？点击下方开始，Agent 会立刻互聊。</p>
            <div class="progress-bar-wrap"><div class="progress-bar" id="progress-bar"></div></div>
            <div class="progress-detail" id="progress-detail">待启动 · 0% · 等待开始</div>
          </div>

          <div class="chat-panel live-agent-panel" id="live-agent-panel" style="display:none;min-height:360px;max-height:480px;margin-top:16px">
            <div class="chat-header">
              <div class="avatar avatar-sm" style="background:var(--blue);color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700">A</div>
              <div class="avatar avatar-sm" style="background:#64748B;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700;margin-left:-10px">B</div>
              <div style="margin-left:8px">
                <div style="font-weight:600;font-size:14px">Agent 实时互聊</div>
                <div class="tiny">仅授权语义 · 不是真人私聊</div>
              </div>
              <span class="chat-status" id="live-status">进行中…</span>
            </div>
            <div class="chat-messages" id="live-agent-messages"></div>
          </div>

          <div style="text-align:center;margin-top:24px" id="find-actions">
            <button class="btn btn-primary btn-lg" id="btn-start-find">开始寻找同路人</button>
          </div>

          <div id="find-result" style="display:none;margin-top:28px"></div>
          <div id="find-multi" style="display:none;margin-top:20px"></div>
        </div>`;
    },

    reason(id) {
      const c = TONG.matching.byId(id);
      if (!c || !c.user) {
        return `<div class="container container-narrow">
          ${emptyBox('找不到该关系解释', '预设候选已移除，或该用户已不在当前候选池中。', '<a href="#/find" class="btn btn-secondary btn-sm" data-link>返回找同路人</a>')}
        </div>`;
      }
      const u = c.user || userById(id);
      const r = c.reason || {};
      const rel = TONG.RELATIONS[c.type] || TONG.RELATIONS.same;
      return `
        <div class="container container-narrow">
          <a href="#/find" class="btn btn-ghost btn-sm" data-link style="margin-bottom:16px">← 返回找同路人</a>
          <div class="reason-hero">
            ${tagHtml(c.type)}
            <h1 class="h2" style="margin:16px 0 8px">${esc(r.title)}</h1>
            <p class="lead small">${esc(rel.desc)}。连接价值来自轨迹与互补，而不是匹配百分数。</p>
          </div>

          <div class="section-card soft-bg-card" style="margin-bottom:20px">
            <div class="soft-bg" style="background-image:url('./assets/badge-relations.jpg')"></div>
            <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
              ${avatar(u, 'lg')}
              <div style="flex:1;min-width:220px">
                <div style="font-weight:600;font-size:18px">${esc(u.name)}${u.real ? ' <span class="tiny" style="color:var(--green)">公开作者</span>' : ''}</div>
                <div class="small muted">${esc(u.currentStage)}</div>
                ${u.publicBadge ? `<div class="tiny" style="margin-top:4px;color:var(--ink-3)">公开信息：${esc(u.publicBadge)}</div>` : ''}
                ${u.sourceUrl ? `<a class="tiny" style="color:var(--blue);display:inline-block;margin-top:6px" href="${esc(u.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看公开来源：${esc(u.sourceTitle || '知乎内容')} ↗</a>` : ''}
                <div class="chip-list" style="margin-top:10px">
                  ${(u.topics || []).slice(0, 3).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <h3 class="h3">TA 的轨迹</h3>
            <div class="timeline">
              ${(function () {
                const raw = (r.theirTrajectory && r.theirTrajectory.length)
                  ? r.theirTrajectory
                  : (u.trajectory || []);
                const items = raw
                  .map((t) => {
                    if (t == null) return '';
                    if (typeof t === 'string') return t;
                    if (typeof t === 'object') {
                      const year = t.year ? String(t.year) : '';
                      const event = t.event || t.title || t.text || t.Summary || t.Title || '';
                      if (year && event) return `${year} · ${event}`;
                      return event || year || '';
                    }
                    return String(t);
                  })
                  .map((s) => s.replace(/^undefined\s*·?\s*/i, '').trim())
                  .filter((s) => s && s.toLowerCase() !== 'undefined' && !/^undefined$/i.test(s));
                if (!items.length) return '<p class="small muted">该候选暂无公开轨迹摘要</p>';
                return items.map((t) => `<div class="timeline-item">${esc(t)}</div>`).join('');
              })()}
            </div>
          </div>

          <div class="section-card">
            <h3 class="h3">你的当前阶段</h3>
            <ul style="padding-left:18px;color:var(--ink-2);font-size:14px;line-height:1.9">
              ${(r.yourStage || []).map((s) => `<li>${esc(s)}</li>`).join('')}
            </ul>
          </div>

          <div class="grid-2" style="margin-bottom:20px">
            <div class="section-card" style="margin:0">
              <h3 class="h3">共同目标</h3>
              <div class="chip-list">${(r.commonGoals || []).map((t) => `<span class="chip active">${esc(t)}</span>`).join('') || '<span class="muted small">仍在形成中的交集</span>'}</div>
            </div>
            <div class="section-card" style="margin:0">
              <h3 class="h3">潜在交换</h3>
              <ul style="padding-left:18px;color:var(--ink-2);font-size:14px;line-height:1.8">
                ${(r.potentialExchange || []).map((s) => `<li>${esc(s)}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="section-card">
            <h3 class="h3">你们最值得聊的是</h3>
            <div class="quote-box">${esc(r.talk)}</div>
            <p class="small muted" style="margin-top:16px;margin-bottom:8px">推荐破冰问题</p>
            <div class="quote-box" style="background:linear-gradient(135deg,#FFF7E6,#FFFDF7);border-left-color:var(--amber)">
              ${esc(r.icebreaker)}
            </div>
          </div>

          <div class="action-row">
            <button class="btn btn-primary" data-connect="${esc(u.id)}">认识 TA</button>
            <button class="btn btn-secondary" data-agent-ask="${esc(u.id)}">先让 Agent 再问一个问题</button>
            <button class="btn btn-secondary" data-share-match="${esc(u.id)}">导出分享卡</button>
            <button class="btn btn-ghost" data-skip="${esc(u.id)}">暂时跳过</button>
          </div>
        </div>`;
    },

    encounter() {
      const greeted = new Set(TONG.store.load().greetedEncounters || []);
      const items = TONG.ENCOUNTERS;
      if (!items.length) {
        return `
        <div class="container">
          <div style="max-width:640px;margin-bottom:28px">
            <div class="hero-badge">轻互动 · 低压力</div>
            <h1 class="h2">今日擦肩</h1>
            <p class="lead" style="margin-top:10px">这里会展示你与陌生人的知识轨迹交集。不需要立刻「加好友」，只是一次轻轻点头。</p>
          </div>
          ${emptyBox(
            '今日暂无擦肩',
            '预设擦肩数据已清空。接入真实公开轨迹后，交集会自动出现在这里。',
            '<a href="#/" class="btn btn-secondary btn-sm" data-link>返回首页</a>'
          )}
        </div>`;
      }
      return `
        <div class="container">
          <div style="max-width:640px;margin-bottom:28px">
            <div class="hero-badge">轻互动 · 低压力</div>
            <h1 class="h2">今日擦肩</h1>
            <p class="lead" style="margin-top:10px">今天你和 <strong>${items.length}</strong> 个陌生人产生了知识轨迹交集。不需要立刻「加好友」，只是一次轻轻点头。</p>
          </div>

          <div class="tip-banner">
            <span>ⓘ</span>
            <div>擦肩来自公开行为的抽象交集：共同关注、收藏重叠、时间轨迹与观点张力。不会展示原始隐私数据。</div>
          </div>

          <div class="stagger" style="display:flex;flex-direction:column;gap:16px">
            ${items.map((e) => {
              const u = userById(e.userId);
              const done = greeted.has(e.id);
              return `
                <div class="card encounter-card" data-encounter="${e.id}">
                  <div class="encounter-illu">${encounterIllu(e.type)}</div>
                  ${avatar(u, 'lg')}
                  <div style="flex:1">
                    <div class="encounter-type"><span class="dot" style="background:var(--blue)"></span>${esc(e.typeName)}</div>
                    <h3 class="h3" style="margin-bottom:6px">${esc(e.desc)}</h3>
                    <p class="small muted">${esc(e.detail)}</p>
                    <p class="small" style="margin-top:8px;color:var(--ink-3)">与 <strong>${esc(u.name)}</strong> · ${esc(u.currentStage)}</p>
                    <div class="encounter-actions">
                      <button class="pill-btn" data-wave="${e.id}" ${done ? 'disabled' : ''}>${done ? '已打招呼 ✓' : '👋 原来你也在看这个'}</button>
                      <button class="pill-btn" data-collect="${e.id}">📚 看看我们共同收藏的内容</button>
                      <button class="pill-btn" data-topic="${e.id}">💬 AI 帮我们找一个共同话题</button>
                      <a href="#/reason/${esc(e.userId)}" class="pill-btn" data-link>查看关系解释 →</a>
                    </div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    },

    map() {
      const me = TONG.ME;
      const nodes = me.pathNodes || [];
      if (!nodes.length) {
        return `
        <div class="container">
          ${pageHero('./assets/map-bg.jpg', '同行地图', '你不是在浏览陌生人，而是在探索自己的未来路径。')}
          ${emptyBox(
            '路径尚未生成',
            '预设路径节点与同行者已清空。完成授权画像或导入轨迹后，地图会自动点亮。',
            '<a href="#/soul" class="btn btn-primary btn-sm" data-link>去生成 Soul Profile</a>'
          )}
        </div>`;
      }
      return `
        <div class="container">
          ${pageHero('./assets/map-bg.jpg', '同行地图', '你不是在浏览陌生人，而是在探索自己的未来路径。点击路径上的同行者，查看为什么值得认识。')}
          <div class="filter-row" id="map-filters">
            <button class="filter-chip active" data-filter="all">全部</button>
            <button class="filter-chip" data-type="same" data-filter="same"><span class="dot dot-same"></span>同路人</button>
            <button class="filter-chip" data-type="ahead" data-filter="ahead"><span class="dot dot-ahead"></span>前路人</button>
            <button class="filter-chip" data-type="complement" data-filter="complement"><span class="dot dot-complement"></span>补路人</button>
            <button class="filter-chip" data-type="different" data-filter="different"><span class="dot dot-different"></span>异路人</button>
          </div>

          <div class="scene-bg map-wrap">
            <img class="scene-bg-img" src="./assets/map-bg.jpg" alt="" loading="lazy" />
            <div class="scene-bg-veil strong"></div>
            <div class="scene-content">
            <div class="map-path">
              ${me.pathNodes.map((n) => {
                const people = TONG.MAP_PEOPLE[n.id] || [];
                return `
                  <div class="map-node-wrap">
                    <div class="map-node ${n.status}" title="${esc(n.label)}"></div>
                    <div class="map-label">${esc(n.label)}</div>
                    <div class="map-people">
                      ${people.map((p) => {
                        const u = userById(p.userId);
                        if (!u) return '';
                        const cand = TONG.matching.byId(u.id);
                        const relType = cand?.type || 'same';
                        return `<div class="map-person" data-map-user="${esc(u.id)}" data-rel="${relType}">
                          ${avatar(u, 'sm')}
                          <div>
                            <div class="who">${esc(u.name)}</div>
                            <div class="why">${esc(p.why)} · ${TONG.RELATIONS[relType].name}</div>
                          </div>
                        </div>`;
                      }).join('')}
                      ${n.status === 'current' ? `<div class="map-person" style="border-color:var(--blue);background:var(--blue-soft)">
                        ${avatar(TONG.ME, 'sm')}
                        <div><div class="who">你在这里</div><div class="why">${esc(me.shortStage)}</div></div>
                      </div>` : ''}
                    </div>
                  </div>`;
              }).join('')}
            </div>
            </div>
          </div>

          <div class="grid-3" style="margin-top:24px">
            <div class="card card-plain">
              <h3 class="h3" style="margin-bottom:8px">现在和你一起走的人</h3>
              <p class="small muted">同路人 · 处在相似阶段，可以互相打气与对照解法。</p>
            </div>
            <div class="card card-plain">
              <h3 class="h3" style="margin-bottom:8px">已经走过这里的人</h3>
              <p class="small muted">前路人 · 他们的轨迹覆盖你当前的困惑，最值得问「你当时怎么选」。</p>
            </div>
            <div class="card card-plain">
              <h3 class="h3" style="margin-bottom:8px">下一段路上的人</h3>
              <p class="small muted">补路人 · 在视觉、写作、系统能力上补上你即将需要的那块。</p>
            </div>
          </div>
        </div>`;
    },

    chat(id) {
      const c = TONG.matching.byId(id);
      const u = c?.user || userById(id);
      if (!u || u.id === 'me') {
        return `<div class="container">
          ${emptyBox('无法打开对话', '预设用户已移除，或该会话对象不存在。', '<a href="#/find" class="btn btn-secondary btn-sm" data-link>返回找同路人</a>')}
        </div>`;
      }
      const r = c?.reason || {};
      const connected = (TONG.store.load().connected || []).includes(u.id);
      const savedLog = TONG.store.getAgentLog(u.id);
      const logCount = savedLog?.chatLog?.length || 0;
      return `
        <div class="container">
          <a href="#/reason/${esc(u.id)}" class="btn btn-ghost btn-sm" data-link style="margin-bottom:12px">← 关系解释卡</a>
          ${pageHero(connected ? './assets/chat-handover.jpg' : './assets/chat-icebreaker.jpg', '破冰与接管对话', 'Agent 互聊已先完成。你想看时，再实时回放完整记录。')}

          <div class="chat-layout">
            <div>
              <div class="icebreaker-box soft-bg-card">
                <div class="soft-bg" style="background-image:url('./assets/chat-icebreaker.jpg')"></div>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                  ${avatar(u, 'sm')}
                  <div>
                    <div style="font-weight:600">${esc(u.name)}</div>
                    <div class="tiny">${esc(u.currentStage)}</div>
                  </div>
                  <div style="margin-left:auto">${tagHtml(c.type)}</div>
                </div>
                <div class="small muted" style="margin-bottom:8px">关系摘要</div>
                <p class="small" style="color:var(--ink-2);line-height:1.7">${esc(r.potentialExchange?.[0] || '')} ${esc(r.talk || '')}</p>

                <div class="small muted" style="margin:18px 0 8px">最自然的开场方式</div>
                <div class="icebreaker-text" id="icebreaker-text" data-full="${esc(r.icebreaker)}"></div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <button class="btn btn-primary btn-sm" id="btn-send-open" ${connected ? 'disabled' : ''}>${connected ? '已发送并接管' : '由我接管 · 发送开场'}</button>
                  <button class="btn btn-secondary btn-sm" id="btn-edit-open">编辑后再发</button>
                  <button class="btn btn-secondary btn-sm" id="btn-view-agent-log">${logCount ? `回放 Agent 聊天（${logCount} 条）` : '查看 Agent 聊天记录'}</button>
                </div>
              </div>
            </div>

            <div class="chat-panel">
              <div class="chat-header">
                ${avatar(u, 'sm')}
                <div>
                  <div style="font-weight:600;font-size:14px">${esc(u.name)}</div>
                  <div class="tiny">${connected ? '真人对话中' : 'Agent 已完成预交流 · 可回放'}</div>
                </div>
                <span class="chat-status" id="chat-status">${connected ? '真人已接管' : '等待你接管'}</span>
              </div>
              <div class="chat-messages" id="chat-messages">
                <div class="msg msg-ai">
                  <div class="msg-meta">系统 · 交接说明</div>
                  双方 Agent 已在你介入前完成预交流${logCount ? `（共 ${logCount} 条记录）` : ''}。点击左侧「回放 Agent 聊天」可实时观看完整过程；你也可以直接发送开场并接管。
                </div>
                ${connected ? `
                  <div class="msg msg-me">（你已发送开场）${esc(r.icebreaker)}</div>
                  <div class="msg msg-them">${esc(mockReply(u, r))}</div>
                ` : ''}
              </div>
              <div class="chat-input-wrap">
                <textarea class="chat-input" id="chat-input" rows="2" placeholder="接管后可以直接和 TA 聊…" ${connected ? '' : 'disabled'}></textarea>
                <button class="btn btn-primary btn-sm" id="chat-send" ${connected ? '' : 'disabled'}>发送</button>
              </div>
            </div>
          </div>
        </div>`;
    },

    settings() {
      const s = TONG.store.load();
      return `
        <div class="container container-narrow">
          ${pageHero('./assets/privacy-shield.jpg', '隐私与社交意愿', 'Agent 只能使用你主动授权的信息。分享「语义」，不分享「原始数据」。')}

          <div class="section-card setting-section soft-bg-card">
            <div class="soft-bg" style="background-image:url('./assets/privacy-shield.jpg')"></div>
            <h3 class="h3">数据授权范围</h3>
            ${TONG.PRIVACY_OPTIONS.map((opt) => {
              const on = !!s.privacyScopes?.[opt.key];
              return `<div class="switch-row">
                <div>
                  <div class="switch-label">${esc(opt.label)}</div>
                  <div class="switch-desc">${esc(opt.desc)}</div>
                </div>
                <button class="switch ${on ? 'on' : ''}" data-privacy="${opt.key}" aria-label="${esc(opt.label)}"></button>
              </div>`;
            }).join('')}
          </div>

          <div class="section-card setting-section soft-bg-card">
            <div class="soft-bg" style="background-image:url('./assets/intent-orbs.jpg')"></div>
            <h3 class="h3">社交意愿</h3>
            <div class="intent-options">
              ${TONG.INTENT_OPTIONS.map((o) => `
                <div class="intent-option ${s.socialIntent === o.key ? 'selected' : ''}" data-intent="${o.key}">
                  <span class="intent-dot">${o.emoji}</span>
                  <div>
                    <div style="font-weight:500;font-size:14px">${esc(o.label)}</div>
                    <div class="tiny">${esc(o.desc)}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>

          <div class="section-card setting-section">
            <h3 class="h3">我现在愿意聊</h3>
            <div class="chip-list" id="willing-list">
              ${TONG.TALK_TOPICS.map((t) => `<button class="chip ${s.willingToTalk.includes(t) ? 'active' : ''}" data-willing="${esc(t)}">${esc(t)}</button>`).join('')}
            </div>
          </div>

          <div class="section-card setting-section">
            <h3 class="h3">我现在不想聊</h3>
            <div class="chip-list" id="unwilling-list">
              ${TONG.TALK_TOPICS.map((t) => `<button class="chip ${s.notWillingToTalk.includes(t) ? 'blocked' : ''}" data-unwilling="${esc(t)}">${esc(t)}</button>`).join('')}
            </div>
          </div>

          <div class="section-card setting-section" id="api-config-section">
            <h3 class="h3">主角简介（供 AI 生成）</h3>
            <p class="small muted" style="margin-bottom:14px">这些信息会写入内置提示词，由后端 DeepSeek 生成各页内容。越具体，生成质量越高。</p>
            <div style="display:grid;gap:10px">
              <label class="small muted">名字
                <input class="chat-input" id="seed-name" style="width:100%;margin-top:6px" value="${esc(s.seed?.name || '')}" placeholder="林晓" />
              </label>
              <label class="small muted">当前阶段
                <input class="chat-input" id="seed-stage" style="width:100%;margin-top:6px" value="${esc(s.seed?.stage || '')}" placeholder="大三 · 机械 · 刚进机器人实验室" />
              </label>
              <label class="small muted">关注话题（逗号分隔）
                <input class="chat-input" id="seed-topics" style="width:100%;margin-top:6px" value="${esc((s.seed?.topics || []).join('，'))}" placeholder="机器视觉，科研竞赛，嵌入式" />
              </label>
              <label class="small muted">近期问题（逗号分隔）
                <input class="chat-input" id="seed-questions" style="width:100%;margin-top:6px" value="${esc((s.seed?.questions || []).join('，'))}" placeholder="第一次进实验室注意什么？" />
              </label>
              <label class="small muted">思考风格
                <input class="chat-input" id="seed-style" style="width:100%;margin-top:6px" value="${esc(s.seed?.style || '')}" placeholder="偏实际落地，喜欢具体案例" />
              </label>
            </div>
            <div class="action-row" style="margin-top:14px;margin-bottom:0">
              <button class="btn btn-primary btn-sm" id="seed-save">保存简介</button>
              <button class="btn btn-secondary btn-sm" id="seed-generate">用 AI 生成全站</button>
              <span class="small muted" id="ai-health-setting">…</span>
            </div>
          </div>

          <div class="section-card setting-section" id="api-config-section2">
            <h3 class="h3">模型通道</h3>
            <p class="small muted" style="margin-bottom:14px">推荐：启动 <code>python server.py</code>，密钥放在服务端环境变量 <code>LLM_API_KEY</code>，前端通过 <code>/api/llm</code> 代理调用。当前默认通道：<code>https://api.openai-next.com/v1</code>，模型 <code>gpt-4o-mini</code>。</p>
            <div style="display:grid;gap:10px">
              <label class="small muted">Base URL（可选直连）
                <input class="chat-input" id="api-base" style="width:100%;margin-top:6px" placeholder="https://api.openai-next.com/v1" value="${esc(TONG.api?.loadCfg().baseUrl || '')}" />
              </label>
              <label class="small muted">API Key（可选直连，勿用于公网）
                <input class="chat-input" id="api-key" type="password" style="width:100%;margin-top:6px" placeholder="sk-..." value="${esc(TONG.api?.loadCfg().apiKey || '')}" />
              </label>
              <label class="small muted">Model
                <input class="chat-input" id="api-model" style="width:100%;margin-top:6px" placeholder="deepseek-v4-pro" value="${esc(TONG.api?.loadCfg().model || 'deepseek-v4-pro')}" />
              </label>
            </div>
            <div class="action-row" style="margin-top:14px;margin-bottom:0">
              <button class="btn btn-primary btn-sm" id="api-save">保存直连配置</button>
              <button class="btn btn-ghost btn-sm" id="api-clear">清除直连</button>
            </div>
          </div>

          <div class="tip-banner" style="margin-top:8px">
            <span>🔒</span>
            <div>核心原则：Agent 分享抽象语义，不分享原始收藏、私信、搜索与真实身份。设置会保存在本机 localStorage，仅用于演示。</div>
          </div>

          <div class="action-row">
            <button class="btn btn-secondary" id="btn-reset-demo">重置演示数据</button>
            <a href="#/demo" class="btn btn-primary" data-link>体验一键 Demo</a>
          </div>
        </div>`;
    },

    demo() {
      return `
        <div class="container">
          <div class="demo-auto-bar">
            <label><input type="checkbox" id="demo-autoplay" checked /> 自动播放</label>
            <span>小剧场演示 · 可暂停 / 跳过 / 重播</span>
            <a class="btn btn-secondary btn-sm" href="./demo-share.html" download="知遇.同路人-演示.html" style="margin-left:8px">下载可分享演示页</a>
          </div>
          <div class="demo-film" id="demo-stage"></div>
          <div style="text-align:center" id="demo-controls"></div>
          <div class="demo-steps" id="demo-steps" style="justify-content:center"></div>
        </div>`;
    },
  };

  function mockReply(u, r) {
    return '谢谢你的问题。配置真实模型后，这里会是对方 Agent 或真人基于授权语义的回复。';
  }

  /* ---------- render ---------- */
  function render() {
    const route = parseRoute();
    setActiveNav(route.name === 'reason' || route.name === 'chat' ? route.name : route.name);

    let html;
    if (route.name === 'reason') html = pages.reason(route.params.id);
    else if (route.name === 'chat') html = pages.chat(route.params.id);
    else html = (pages[route.name] || pages.home)();

    root.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    bindPage(route);
  }

  /* ---------- page bindings ---------- */
  function collectSeedFromSettings() {
    const g = (id) => document.getElementById(id)?.value?.trim() || '';
    const split = (s) => s.split(/[,，、]/).map((x) => x.trim()).filter(Boolean);
    return {
      name: g('seed-name') || '我',
      stage: g('seed-stage'),
      topics: split(g('seed-topics')),
      questions: split(g('seed-questions')),
      style: g('seed-style'),
    };
  }

  function appendAiLog(msg, kind = '') {
    const box = document.getElementById('ai-steps');
    if (!box) return;
    const line = document.createElement('div');
    const prefix = kind === 'ok' ? '✓' : kind === 'err' ? '✗' : kind === 'done' ? '★' : '…';
    line.textContent = `${prefix} ${msg}`;
    if (kind === 'ok' || kind === 'done') line.style.color = 'var(--green)';
    if (kind === 'err') line.style.color = 'var(--red)';
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  /* ---------- 生成进度条 ---------- */
  const PROGRESS_STAGES = [
    { id: 'auth', label: '检查登录与后端', weight: 5 },
    { id: 'snapshot', label: '拉取知乎公开数据', weight: 12 },
    { id: 'me', label: '分析你的轨迹并生成画像', weight: 16 },
    { id: 'search', label: '知乎搜索同路人候选', weight: 12 },
    { id: 'people', label: '提炼候选作者档案', weight: 14 },
    { id: 'traj', label: '根据公开回答生成候选轨迹', weight: 14 },
    { id: 'match', label: 'AI 匹配排序与连接理由', weight: 14 },
    { id: 'enrich', label: '补全匹配详情轨迹', weight: 6 },
    { id: 'enc', label: '生成今日擦肩与地图', weight: 7 },
    { id: 'done', label: '生成完成', weight: 0 },
  ];

  function progressFromMessage(msg) {
    const s = String(msg || '');
    if (/检查|健康|后端已|未配置/.test(s) && !/搜索/.test(s)) return 'auth';
    if (/拉取本人|快照|OAuth 用户数据|开放平台账号/.test(s)) return 'snapshot';
    if (/画像|Soul|meFromReal|分析你的/.test(s)) return 'me';
    if (/知乎搜索/.test(s)) return 'search';
    if (/候选同路|提炼|生成候选/.test(s) && !/轨迹/.test(s)) return 'people';
    if (/生成轨迹|批量生成|根据公开回答生成候选/.test(s)) return 'traj';
    if (/匹配排序|AI 匹配/.test(s)) return 'match';
    if (/补全.*轨迹|补全轨迹/.test(s)) return 'enrich';
    if (/今日擦肩|地图/.test(s)) return 'enc';
    if (/全部生成完成/.test(s)) return 'done';
    return null;
  }

  function openGenerateProgress() {
    document.getElementById('gen-progress')?.remove();
    document.getElementById('gen-progress-mini')?.remove();

    const root = document.createElement('div');
    root.id = 'gen-progress';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'AI 生成进度');
    root.innerHTML = `
      <div class="gen-progress-card">
        <div class="gen-progress-head">
          <div>
            <div class="gen-progress-title">正在生成同路人内容</div>
            <div class="gen-progress-sub" id="gen-progress-sub">准备中…</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button type="button" class="btn btn-ghost btn-sm" id="gen-minimize" title="缩小到侧边">缩小</button>
            <div class="gen-progress-pct" id="gen-progress-pct">0%</div>
          </div>
        </div>
        <div class="gen-progress-bar" aria-hidden="true"><i id="gen-progress-fill"></i></div>
        <ul class="gen-progress-steps" id="gen-progress-steps"></ul>
        <div class="gen-progress-log" id="gen-progress-log"></div>
        <div class="gen-progress-actions" id="gen-progress-actions"></div>
        <p class="tiny muted" style="margin-top:8px;text-align:center">匹配完成后可先看同路人，其余内容继续在侧边生成</p>
      </div>`;
    document.body.appendChild(root);

    const fill = root.querySelector('#gen-progress-fill');
    const pct = root.querySelector('#gen-progress-pct');
    const sub = root.querySelector('#gen-progress-sub');
    const stepsEl = root.querySelector('#gen-progress-steps');
    const logEl = root.querySelector('#gen-progress-log');
    const actionsEl = root.querySelector('#gen-progress-actions');
    const state = { current: 'auth', done: new Set(), warn: false, minimized: false, readyForFind: false, percent: 0 };

    let mini = null;

    function calcPercent() {
      let p = 0;
      let acc = 0;
      PROGRESS_STAGES.forEach((st) => {
        if (st.weight <= 0) return;
        if (state.done.has(st.id)) p += st.weight;
        else if (state.current === st.id) p += st.weight * 0.35;
        acc += st.weight;
      });
      state.percent = Math.min(99, Math.round((p / Math.max(acc, 1)) * 100));
      return state.percent;
    }

    function renderSteps() {
      let html = '';
      PROGRESS_STAGES.forEach((st) => {
        if (st.weight <= 0) return;
        const isDone = state.done.has(st.id);
        const isNow = state.current === st.id && !isDone;
        html += `<li class="${isDone ? 'done' : isNow ? 'now' : ''}">
          <span class="dot"></span>
          <span class="label">${st.label}</span>
          <span class="tag">${isDone ? '完成' : isNow ? '进行中' : '等待'}</span>
        </li>`;
      });
      stepsEl.innerHTML = html;
      const percent = calcPercent();
      fill.style.width = percent + '%';
      pct.textContent = percent + '%';
      if (mini) {
        mini.querySelector('.gen-mini-pct').textContent = percent + '%';
        mini.querySelector('.gen-mini-bar i').style.width = percent + '%';
        mini.querySelector('.gen-mini-sub').textContent = sub.textContent || '';
      }
      return percent;
    }

    function ensureMini() {
      if (mini) return mini;
      mini = document.createElement('div');
      mini.id = 'gen-progress-mini';
      mini.innerHTML = `
        <div class="gen-mini-title">AI 生成中</div>
        <div class="gen-mini-pct">0%</div>
        <div class="gen-mini-bar"><i></i></div>
        <div class="gen-mini-sub">后台继续生成…</div>
        <div class="gen-mini-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="gen-mini-expand">展开</button>
          <button type="button" class="btn btn-primary btn-sm" id="gen-mini-find">看同路人</button>
        </div>`;
      document.body.appendChild(mini);
      mini.querySelector('#gen-mini-expand')?.addEventListener('click', () => restore());
      mini.querySelector('#gen-mini-find')?.addEventListener('click', () => {
        minimize();
        if (location.hash !== '#/find') navigate('/find');
      });
      return mini;
    }

    function minimize() {
      state.minimized = true;
      root.style.display = 'none';
      ensureMini();
      mini.classList.add('show');
      renderSteps();
    }

    function restore() {
      state.minimized = false;
      if (mini) {
        mini.classList.remove('show');
        setTimeout(() => { mini?.remove(); mini = null; }, 200);
      }
      root.style.display = '';
      renderSteps();
    }

    function showFindOption() {
      if (state.readyForFind) return;
      state.readyForFind = true;
      actionsEl.innerHTML = `
        <button type="button" class="btn btn-primary" id="gen-see-find">先看同路人</button>
        <button type="button" class="btn btn-secondary" id="gen-keep-full">继续等待完整生成</button>`;
      actionsEl.querySelector('#gen-see-find')?.addEventListener('click', () => {
        minimize();
        navigate('/find');
      });
      actionsEl.querySelector('#gen-keep-full')?.addEventListener('click', () => {
        actionsEl.innerHTML = '';
      });
      // 侧边也出现
      ensureMini();
      mini.querySelector('#gen-mini-find').hidden = false;
    }

    root.querySelector('#gen-minimize')?.addEventListener('click', minimize);
    renderSteps();

    return {
      close() {
        root.classList.add('gen-progress-out');
        setTimeout(() => root.remove(), 280);
        if (mini) {
          mini.classList.add('gen-mini-out');
          setTimeout(() => mini.remove(), 280);
        }
      },
      minimize,
      update(msg, kind) {
        const stage = progressFromMessage(msg);
        if (stage === 'done') {
          PROGRESS_STAGES.forEach((st) => { if (st.weight > 0) state.done.add(st.id); });
          sub.textContent = '生成完成';
          renderSteps();
          if (mini) {
            mini.querySelector('.gen-mini-title').textContent = '生成完成';
            mini.querySelector('.gen-mini-actions').innerHTML =
              `<button type="button" class="btn btn-primary btn-sm" id="gen-mini-open">打开结果</button>`;
            mini.querySelector('#gen-mini-open')?.addEventListener('click', () => {
              if (location.hash !== '#/find') navigate('/find');
              else render();
              mini.remove();
              mini = null;
            });
          }
        } else if (stage) {
          const idx = PROGRESS_STAGES.findIndex((s) => s.id === stage);
          if (idx >= 0) {
            for (let i = 0; i < idx; i++) {
              const id = PROGRESS_STAGES[i].id;
              if (PROGRESS_STAGES[i].weight > 0) state.done.add(id);
            }
            state.current = stage;
          }
          sub.textContent = msg;
          // 匹配完成即可先看
          if (stage === 'enrich' || stage === 'enc' || (stage === 'match' && kind === 'ok')) {
            showFindOption();
          }
          renderSteps();
        } else if (msg) {
          sub.textContent = msg;
        }
        if (kind === 'err' || kind === 'warn') state.warn = true;
        if (kind === 'ok' && stage !== 'done') {
          const n = Math.min(98, (state.percent || 0) + 3);
          fill.style.width = n + '%';
          pct.textContent = n + '%';
          if (mini) {
            mini.querySelector('.gen-mini-pct').textContent = n + '%';
            mini.querySelector('.gen-mini-bar i').style.width = n + '%';
          }
        }
        const line = document.createElement('div');
        line.className = kind === 'err' ? 'err' : kind === 'warn' ? 'warn' : kind === 'ok' ? 'ok' : kind === 'done' ? 'done' : '';
        let ts = '';
        try {
          ts = TL.utils?.nowTime?.() || new Date().toLocaleTimeString('zh-CN');
        } catch (_) {
          ts = new Date().toLocaleTimeString('zh-CN');
        }
        line.textContent = `[${ts}] ${msg}`;
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
        if (mini) mini.querySelector('.gen-mini-sub').textContent = msg;
      },
      finish(ok) {
        if (ok) {
          PROGRESS_STAGES.forEach((st) => { if (st.weight > 0) state.done.add(st.id); });
          fill.style.width = '100%';
          pct.textContent = '100%';
          sub.textContent = '生成完成';
          renderSteps();
          showFindOption();
        } else {
          sub.textContent = '生成未完成';
          if (mini) mini.querySelector('.gen-mini-sub').textContent = '生成未完成';
        }
      },
    };
  }

  async function runAiGenerate(seed) {
    clearHeroGuide();
    window.__tl_generating = false;

    const card = document.getElementById('ai-console-card');
    if (card) card.style.display = 'block';
    const progress = openGenerateProgress();
    try {
      progress.update('检查登录与后端…', 'run');
    } catch (_) {}

    const health = await TL_GEN.health().catch(() => ({ ok: false, llm_configured: false }));
    const healthEl = document.getElementById('ai-health') || document.getElementById('ai-health-setting');
    if (healthEl) {
      healthEl.textContent = health.llm_configured
        ? `后端已就绪 · ${health.model || 'deepseek-chat'}${health.zhihu_configured ? ' · 知乎搜索 OK' : ' · 知乎搜索未配'}`
        : '后端未配置 LLM_API_KEY — 生成会失败';
      healthEl.style.color = health.llm_configured ? 'var(--green)' : 'var(--amber)';
    }
    if (!health.ok || !health.llm_configured) {
      progress.update('后端模型未配置，无法生成', 'err');
      progress.finish(false);
      toast('请检查后端 LLM 配置', 'err');
      await TL.utils.sleep(1200);
      progress.close();
      return;
    }
    progress.update(`后端就绪 · ${health.model || ''}`, 'ok');

    try {
      await TL_GEN.generateAll(seed || TONG.store.load().seed, (msg, kind) => {
        appendAiLog(msg, kind);
        progress.update(msg, kind);
      });
      progress.finish(true);
      toast('全站内容已生成', 'ok');
      clearHeroGuide();
      await TL.utils.sleep(600);
      if (location.hash === '#/find') {
        progress.close();
        render();
      } else {
        progress.close();
        navigate('/find');
      }
    } catch (e) {
      progress.update('失败：' + e.message, 'err');
      progress.finish(false);
      toast('生成失败：' + e.message, 'err');
      appendAiLog(String(e.message || e), 'err');
      await TL.utils.sleep(1400);
      progress.close();
    }
  }

  function clearHeroGuide() {
    sessionStorage.removeItem('tl_show_hero_guide');
    document.getElementById('btn-ai-generate')?.classList.remove('btn-guide-pulse');
    const hint = document.getElementById('hero-guide-hint');
    if (hint) hint.hidden = true;
  }

  function applyHeroGuide() {
    if (!sessionStorage.getItem('tl_show_hero_guide')) return;
    const btn = document.getElementById('btn-ai-generate');
    const hint = document.getElementById('hero-guide-hint');
    if (!btn) return;
    btn.classList.add('btn-guide-pulse');
    if (hint) hint.hidden = false;
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const clear = () => clearHeroGuide();
    btn.addEventListener('click', clear, { once: true });
  }

  function bindHome() {
    document.getElementById('btn-ai-generate')?.addEventListener('click', () => runAiGenerate());
    document.getElementById('btn-ai-generate-2')?.addEventListener('click', () => runAiGenerate());
    // find 页空态按钮
    if (!document.getElementById('ai-steps') && document.getElementById('btn-ai-generate')) {
      // ok
    }
    const card = document.getElementById('ai-console-card');
    if (card && !(TONG.USERS || []).length) card.style.display = 'block';
    TL_GEN.health().then((h) => {
      const el = document.getElementById('ai-health');
      if (el) {
        el.textContent = h.llm_configured ? `后端已就绪 · ${h.model}` : '后端未配置密钥';
        el.style.color = h.llm_configured ? 'var(--green)' : 'var(--amber)';
      }
    }).catch(() => {});
    applyHeroGuide();
  }

  function bindPage(route) {
    if (route.name === 'home') bindHome();
    if (route.name === 'profile') bindProfile();
    if (route.name === 'find') {
      document.getElementById('btn-ai-generate')?.addEventListener('click', () => runAiGenerate());
    }
    if (route.name === 'soul') bindSoul();
    if (route.name === 'find') bindFind();
    if (route.name === 'reason') bindReason(route.params.id);
    if (route.name === 'encounter') bindEncounter();
    if (route.name === 'map') bindMap();
    if (route.name === 'chat') bindChat(route.params.id);
    if (route.name === 'settings') bindSettings();
    if (route.name === 'demo') bindDemo();
  }

  function listPreview(items, limit) {
    const list = items || [];
    if (!list.length) return '<p class="tiny muted">暂无</p>';
    const shown = list.slice(0, limit || 8);
    return `<ul style="margin:0;padding-left:18px;line-height:1.7">${shown.map((it) => {
      const title = it.Title || it.Fullname || it.Description || it.Name || '(无标题)';
      const url = it.Url || it.url || '';
      const left = url
        ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>`
        : esc(title);
      const meta = it.LikeCount != null ? ` · 赞 ${it.LikeCount}` : '';
      return `<li class="small">${left}<span class="tiny muted">${esc(meta)}</span></li>`;
    }).join('')}</ul>
    ${list.length > (limit || 8) ? `<p class="tiny muted" style="margin-top:6px">共 ${list.length} 条，仅预览前 ${limit || 8} 条；完整数据已用于 AI 分析。</p>` : ''}`;
  }

  async function bindProfile() {
    const body = document.getElementById('profile-body');
    const actions = document.getElementById('profile-actions');
    if (!body || !actions) return;

    let session = { authenticated: false };
    try {
      session = await TL_GEN.fetchSession();
    } catch (_) {}

    if (!session.authenticated) {
      body.innerHTML = `
        <p style="margin-bottom:10px">尚未登录知乎账号。</p>
        <p class="tiny muted">登录后本页会显示你的公开资料、创作、关注与收藏统计。</p>`;
      actions.innerHTML = `
        <a class="btn btn-primary" href="/api/oauth/start">知乎 OAuth 登录</a>
        <a class="btn btn-ghost" href="/">返回登录页</a>`;
      return;
    }

    body.innerHTML = '正在从后端拉取完整公开数据…';
    actions.innerHTML = '';

    let snap = null;
    try {
      snap = await TL_GEN.fetchUserSnapshot();
      TONG.store.save({ userSnapshot: snap, sessionMode: snap.mode || 'oauth', dataSource: 'real-user' });
    } catch (e) {
      body.innerHTML = `<p style="color:var(--red)">拉取失败：${esc(e.message)}</p>
        <p class="tiny muted" style="margin-top:8px">会话资料：</p>
        <div>${esc(session.profile?.name || '')} · ${esc(session.profile?.headline || '')}</div>`;
      actions.innerHTML = `
        <button class="btn btn-primary" id="btn-retry-snap">重试拉取</button>
        <a class="btn btn-ghost" href="/api/oauth/start">重新授权</a>`;
      document.getElementById('btn-retry-snap')?.addEventListener('click', () => bindProfile());
      return;
    }

    const p = snap.profile || session.profile || {};
    const sum = snap.summary || {};
    const contents = snap.contents?.Items || [];
    const followees = snap.followees?.Items || [];
    const favorites = snap.favorites?.Items || [];
    const favlists = snap.favlists?.Items || [];
    const favContents = snap.favlist_contents?.Items || [];

    body.innerHTML = `
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:18px">
        ${avatar({ name: p.name || '用户', avatarUrl: p.avatarUrl, color: '#0084FF' }, 'lg')}
        <div>
          <div style="font-weight:700;font-size:18px">${esc(p.name || '知乎用户')}</div>
          <div class="small muted">${esc(p.headline || '')}</div>
          ${p.url ? `<a class="tiny" style="color:var(--blue)" href="${esc(p.url)}" target="_blank" rel="noopener">查看知乎主页 ↗</a>` : ''}
        </div>
      </div>
      ${p.description ? `<p class="small" style="margin-bottom:14px;color:var(--ink-2)">${esc(p.description)}</p>` : ''}

      <div class="stat-strip" style="margin:0 0 18px">
        <div class="stat"><b>${sum.contents ?? contents.length}</b><span>公开创作</span></div>
        <div class="stat"><b>${sum.followees ?? followees.length}</b><span>关注</span></div>
        <div class="stat"><b>${sum.favlists ?? favlists.length}</b><span>收藏夹</span></div>
        <div class="stat"><b>${sum.favorites ?? favorites.length}</b><span>近期收藏</span></div>
      </div>

      <div class="section-card" style="margin-bottom:12px">
        <h3 class="h3">最近创作</h3>
        ${listPreview(contents, 10)}
      </div>
      <div class="section-card" style="margin-bottom:12px">
        <h3 class="h3">关注的人</h3>
        ${listPreview(followees, 10)}
      </div>
      <div class="section-card" style="margin-bottom:12px">
        <h3 class="h3">近期收藏</h3>
        ${listPreview(favorites, 8)}
      </div>
      <div class="section-card">
        <h3 class="h3">收藏夹内容</h3>
        ${listPreview(favContents, 8)}
      </div>
      ${snap.errors && snap.errors.length ? `<p class="tiny" style="color:var(--amber);margin-top:10px">部分接口：${snap.errors.map(esc).join('；')}</p>` : ''}`;

    actions.innerHTML = `
      <button class="btn btn-primary" id="btn-gen-from-user">用这些数据生成全站</button>
      <button class="btn btn-secondary" id="btn-logout">退出登录</button>`;
    document.getElementById('btn-gen-from-user')?.addEventListener('click', () => runAiGenerate());
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      await fetch('/api/oauth/logout', { method: 'POST' }).catch(() => {});
      location.href = '/';
    });
  }

  function bindSoul() {
    const regen = document.getElementById('soul-regen');
    const content = document.getElementById('soul-content');
    if (regen) {
      regen.addEventListener('click', async () => {
        regen.disabled = true;
        regen.textContent = '生成中…';
        try {
          await TL_GEN.regenerateSoul(TONG.store.load().seed, (m) => toast(m));
          toast('Soul Profile 已刷新', 'ok');
          render();
        } catch (e) {
          toast('生成失败：' + e.message, 'err');
          // 回退本地 API
          try {
            const profile = await TONG.api.soulProfile({ privacyScopes: [] });
            const me = { ...TONG.ME, ...profile, topics: profile.topics || TONG.ME.topics };
            TONG.ME = me;
            TONG.store.save({ me, soul: profile });
            render();
            toast('已使用回退通道刷新', 'ok');
          } catch (e2) {
            toast('刷新失败', 'err');
          }
        } finally {
          regen.disabled = false;
          regen.textContent = '重新生成';
        }
      });
    }
    const edit = document.getElementById('soul-edit-skills');
    if (edit) {
      edit.addEventListener('click', () => {
        const skills = Object.entries(TONG.ME.skills || {});
        openModal(`
          <h3 class="h3" style="margin-bottom:12px">技能标签</h3>
          ${skills.length
            ? `<div class="chip-list" style="margin-bottom:16px">${skills.map(([k, v]) => `<span class="chip">${esc(k)} ${v}/5</span>`).join('')}</div>`
            : '<p class="small muted" style="margin-bottom:16px">暂无技能标签。完成授权导入或配置 API 后会自动填充。</p>'}
          <div class="action-row" style="margin-top:0">
            <button class="btn btn-secondary btn-sm" id="modal-close">关闭</button>
          </div>`);
      });
    }
  }

  function renderMultiExperts(session) {
    const items = (session.topIds || []).map((uid, idx) => {
      const user = userById(uid);
      const type = session.types?.[uid] || 'same';
      const reason = session.reasons?.[uid] || {};
      const score = session.scores?.[uid];
      const log = TONG.store.getAgentLog(uid);
      if (!user) return '';
      return `
        <div class="card expert-card" style="border-color:${TONG.RELATIONS[type].color};animation-delay:${idx * 0.05}s">
          <div style="display:flex;gap:12px;align-items:flex-start">
            ${avatar(user, 'lg')}
            <div style="flex:1;min-width:0">
              <div style="margin-bottom:6px">${tagHtml(type)}${idx === 0 ? ' <span class="tiny" style="color:var(--green)">推荐</span>' : ''}</div>
              <div style="font-weight:600;font-size:16px">${esc(user.name)}</div>
              <div class="small muted" style="margin-top:2px">${esc(user.shortStage || user.currentStage)}</div>
              ${user.publicBadge ? `<div class="tiny" style="margin-top:4px;color:var(--ink-3)">${esc(user.publicBadge)}</div>` : ''}
              <p class="small" style="margin-top:10px;color:var(--ink-2)">${esc(reason.talk || reason.title || '')}</p>
              ${score != null ? `<div class="tiny" style="margin-top:6px">连接价值 ${Math.round(score * 100) / 100}</div>` : ''}
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
            <a class="btn btn-primary btn-sm" href="#/chat/${esc(uid)}" data-link>由我接管 · 去破冰</a>
            <a class="btn btn-secondary btn-sm" href="#/reason/${esc(uid)}" data-link>关系解释</a>
            <button class="btn btn-secondary btn-sm" data-share-match="${esc(uid)}">导出分享卡</button>
            <button class="btn btn-ghost btn-sm" data-replay-log="${esc(uid)}">${log?.chatLog?.length ? `回放 Agent（${log.chatLog.length}）` : 'Agent 记录'}</button>
          </div>
        </div>`;
    }).join('');
    return `
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <h3 class="h3">本次找到 ${ (session.topIds || []).length } 位可认识的达人</h3>
        <span class="tiny">切换页面会保留；刷新浏览器后本批结果清空，已存 Agent 记录仍在</span>
      </div>
      <div class="grid-2 stagger">${items}</div>`;
  }

  function restoreFindSession() {
    const session = TONG.store.loadFindSession();
    if (!session) return false;
    const result = document.getElementById('find-result');
    const multi = document.getElementById('find-multi');
    const panel = document.getElementById('live-agent-panel');
    const stream = document.getElementById('live-agent-messages');
    const log = document.getElementById('progress-log');
    const actions = document.getElementById('find-actions');
    const btn = document.getElementById('btn-start-find');
    const bestId = session.bestId || session.topIds[0];
    const bestUser = userById(bestId);
    const bestCand = {
      userId: bestId,
      type: session.types?.[bestId] || 'same',
      score: session.scores?.[bestId] || 0,
      reason: session.reasons?.[bestId] || {},
      user: bestUser,
      scores: {},
    };
    const candidates = (session.topIds || []).map((uid) => ({
      userId: uid,
      type: session.types?.[uid] || 'same',
      score: session.scores?.[uid] || 0,
      reason: session.reasons?.[uid] || {},
      user: userById(uid),
      scores: {},
    })).filter((c) => c.user);

    if (log) {
      log.innerHTML = `
        <p style="color:var(--green);font-weight:600">已恢复上次匹配结果</p>
        <div class="progress-bar-wrap"><div class="progress-bar" style="width:100%"></div></div>
        <div class="progress-detail">100% · 本会话保留 · ${new Date(session.at || Date.now()).toLocaleString('zh-CN')}</div>`;
    }
    if (panel && stream) {
      panel.style.display = 'flex';
      const last = TONG.store.getAgentLog(bestId);
      stream.innerHTML = '';
      (last?.chatLog || session.liveChatLog || []).slice(0, 8).forEach((m) => {
        const el = document.createElement('div');
        el.className = `msg ${m.who === 'A' ? 'msg-me' : m.who === 'B' ? 'msg-them' : 'msg-ai'}`;
        el.innerHTML = `<div class="msg-meta">${esc(m.from || '')} · ${esc(m.time || '')}</div>${esc(m.text || '')}`;
        stream.appendChild(el);
      });
      const status = document.getElementById('live-status');
      if (status) status.textContent = '已保留';
    }
    if (result) {
      result.style.display = 'block';
      result.innerHTML = `
        <div class="handoff-banner">
          <div>
            <div class="tiny" style="color:var(--green);font-weight:600;margin-bottom:4px">本会话匹配结果已保留</div>
            <div style="font-weight:700;font-size:18px;margin-bottom:4px">现在由你接管，可任选一位达人</div>
            <div class="small muted">共 ${(session.topIds || []).length} 位 · 点击卡片下方按钮进入流程</div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a href="#/chat/${esc(bestId)}" class="btn btn-primary btn-lg" data-link>由我接管 · 去破冰</a>
            <button class="btn btn-secondary" id="btn-find-again">重新找一批</button>
          </div>
        </div>`;
      result.querySelectorAll('[data-replay-log]').forEach((el) => {
        el.addEventListener('click', () => openAgentLog(el.dataset.replayLog));
      });
      document.getElementById('btn-find-again')?.addEventListener('click', () => {
        TONG.store.clearFindSession();
        render();
      });
    }
    if (multi) {
      multi.style.display = 'block';
      multi.innerHTML = renderMultiExperts(session);
      multi.querySelectorAll('[data-replay-log]').forEach((el) => {
        el.addEventListener('click', () => openAgentLog(el.dataset.replayLog));
      });
    }
    if (actions) {
      actions.innerHTML = `
        <a href="#/chat/${esc(bestId)}" class="btn btn-primary btn-lg" data-link>由我接管 · 去破冰</a>
        <a href="#/reason/${esc(bestId)}" class="btn btn-secondary btn-sm" data-link style="margin-left:8px">关系解释</a>
        <button class="btn btn-ghost btn-sm" id="btn-find-again" style="margin-left:8px">重新找一批</button>`;
      document.getElementById('btn-find-again')?.addEventListener('click', () => {
        TONG.store.clearFindSession();
        render();
      });
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = '重新寻找同路人';
    }
    // light rooms
    const rooms = [...document.querySelectorAll('.room')];
    rooms.forEach((room, i) => {
      const u = userById(session.topIds[i]);
      room.className = `room room-r${i + 1} lit${i === 0 ? ' matched' : ''}`;
      if (u) {
        room.innerHTML = `
          <div class="room-avatar" style="background:#EEF2F7;overflow:hidden;padding:2px">
            <img src="${u.avatarUrl || diceUrl(u.avatarSeed || u.id)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${initialFallback(u.name, u.color)}'" />
          </div>
          <div class="room-name">${esc(u.name)}</div>
          <div class="room-stage">${esc(u.shortStage)}</div>`;
        room.dataset.userId = u.id;
      }
    });
    return true;
  }

  function bindFind() {
    const btn = document.getElementById('btn-start-find');
    const log = document.getElementById('progress-log');
    const result = document.getElementById('find-result');
    const actions = document.getElementById('find-actions');
    const panel = document.getElementById('live-agent-panel');
    const stream = document.getElementById('live-agent-messages');
    const liveStatus = document.getElementById('live-status');
    if (!btn) return;

    // 进入页面时恢复本会话结果（刷新后 sessionStorage 清空）
    if (restoreFindSession()) {
      btn.addEventListener('click', () => {
        TONG.store.clearFindSession();
        render();
      });
      return;
    }

    function paintProgress(msg, detail, pct) {
      log.innerHTML = `
        <p>${esc(msg)}</p>
        <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
        <div class="progress-detail">${pct}% · ${esc(detail)}</div>`;
    }

    function appendLive(m) {
      const el = document.createElement('div');
      el.className = `msg ${m.who === 'A' ? 'msg-me' : m.who === 'B' ? 'msg-them' : 'msg-ai'}`;
      el.innerHTML = `<div class="msg-meta">${esc(m.from)} · ${esc(m.time || '')}</div><div class="msg-body typewriter-cursor"></div>`;
      stream.appendChild(el);
      stream.scrollTop = stream.scrollHeight;
      return el.querySelector('.msg-body');
    }

    function typeLive(body, text) {
      return new Promise((resolve) => {
        const full = String(text || '');
        let i = 0;
        function step() {
          if (skipStream) {
            body.textContent = full;
            body.classList.remove('typewriter-cursor');
            resolve();
            return;
          }
          i += 1;
          body.textContent = full.slice(0, i);
          stream.scrollTop = stream.scrollHeight;
          if (i < full.length) {
            const ch = full[i - 1];
            const delay = ch === '。' || ch === '！' || ch === '？' ? 70
              : ch === '，' || ch === '；' ? 40
              : 14 + Math.random() * 16;
            setTimeout(step, delay);
          } else {
            body.classList.remove('typewriter-cursor');
            resolve();
          }
        }
        if (!full.length) {
          body.classList.remove('typewriter-cursor');
          resolve();
          return;
        }
        step();
      });
    }

    let running = false;
    let skipStream = false;

    function finishFind(best, candidates, payload) {
      const list = (candidates || []).filter((c) => c?.userId).slice(0, 4);
      const topIds = list.map((c) => c.userId);
      if (best?.userId && !topIds.includes(best.userId)) topIds.unshift(best.userId);
      const uid = topIds[0] || best?.userId || 'r1';
      const name = userById(uid)?.name || 'TA';

      paintProgress('Agent 预交流完成，等待你接管', `最佳候选：${name} · 本批 ${topIds.length} 位达人`, 100);
      if (liveStatus) liveStatus.textContent = '待你接管';

      if (stream) {
        const handoff = document.createElement('div');
        handoff.className = 'msg msg-ai';
        handoff.innerHTML = `<div class="msg-meta">系统 · 交接</div>
          Agent 互聊已结束。本批共 ${topIds.length} 位达人可进入真人流程；结果已写入本会话，切换页面不丢。`;
        stream.appendChild(handoff);
        stream.scrollTop = stream.scrollHeight;
      }

      // 为本批每位达人生成/保存 Agent 记录
      const types = {};
      const reasons = {};
      const scores = {};
      list.forEach((c) => {
        types[c.userId] = c.type || 'same';
        reasons[c.userId] = c.reason || {};
        scores[c.userId] = c.score || 0;
      });
      if (best?.userId) {
        types[best.userId] = best.type || types[best.userId] || 'same';
        reasons[best.userId] = best.reason || reasons[best.userId] || {};
        scores[best.userId] = best.score ?? scores[best.userId] ?? 0;
      }

      const liveChatLog = payload.prechat?.chatLog || [];

      // 并行为其余候选补齐记录（失败不影响）
      Promise.all(topIds.slice(1).map(async (id) => {
        if (TONG.store.getAgentLog(id)) return;
        try {
          const cand = list.find((c) => c.userId === id) || TONG.matching.byId(id);
          await TONG.api.agentPrechat({ bId: id, best: cand });
        } catch (_) {}
      })).catch(() => {});

      const session = {
        at: Date.now(),
        bestId: uid,
        topIds,
        types,
        reasons,
        scores,
        liveChatLog,
      };
      TONG.store.saveFindSession(session);

      const rooms = [...document.querySelectorAll('.room')];
      rooms.forEach((room, i) => {
        const rid = topIds[i];
        const bestRoom = rid === uid ? room : null;
        if (rid) room.classList.add('lit');
        if (bestRoom || rooms.find((r) => r.dataset.userId === uid) === room) {
          room.classList.add('matched');
        }
      });
      rooms.forEach((room) => {
        if (room.dataset.userId === uid) room.classList.add('matched');
      });

      result.style.display = 'block';
      const multi = document.getElementById('find-multi');
      try {
        result.innerHTML = `
          <div class="handoff-banner">
            <div>
              <div class="tiny" style="color:var(--green);font-weight:600;margin-bottom:4px">Agent 已完成预交流</div>
              <div style="font-weight:700;font-size:18px;margin-bottom:4px">现在由你接管 · 本批 ${topIds.length} 位达人</div>
              <div class="small muted">可任选一位进入破冰；切换页面结果仍保留，刷新后清空本批</div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <a href="#/chat/${esc(uid)}" class="btn btn-primary btn-lg" data-link>由我接管 · 去破冰</a>
              <a href="#/reason/${esc(uid)}" class="btn btn-secondary" data-link>先看关系解释</a>
              <button class="btn btn-secondary" data-share-match="${esc(uid)}">导出分享卡</button>
            </div>
          </div>
          ` + renderCandidateResult(best || list[0], list, payload.prechatSummary, payload.prechat);
      } catch (err) {
        result.innerHTML = `
          <div class="handoff-banner">
            <div style="font-weight:700;font-size:18px">现在由你接管这段关系</div>
            <a href="#/chat/${esc(uid)}" class="btn btn-primary btn-lg" data-link style="margin-top:12px">由我接管 · 去破冰</a>
          </div>`;
      }
      result.classList.add('soft-bg-card');
      result.style.position = 'relative';
      if (!result.querySelector('.soft-bg')) {
        result.insertAdjacentHTML('afterbegin', '<div class="soft-bg" style="background-image:url(\'./assets/find-success.jpg\')"></div>');
      }
      result.querySelectorAll('[data-replay-log]').forEach((el) => {
        el.addEventListener('click', () => openAgentLog(el.dataset.replayLog));
      });

      if (multi) {
        multi.style.display = 'block';
        multi.innerHTML = renderMultiExperts(session);
        multi.querySelectorAll('[data-replay-log]').forEach((el) => {
          el.addEventListener('click', () => openAgentLog(el.dataset.replayLog));
        });
      }

      actions.innerHTML = `
        <a href="#/chat/${esc(uid)}" class="btn btn-primary btn-lg" data-link>由我接管 · 去破冰</a>
        <a href="#/reason/${esc(uid)}" class="btn btn-secondary btn-sm" data-link style="margin-left:8px">关系解释</a>
        <button class="btn btn-ghost btn-sm" id="btn-find-again" style="margin-left:8px">重新找一批</button>`;
      TONG.store.save({ findCompleted: true, lastMatchId: uid });
      document.getElementById('btn-find-again')?.addEventListener('click', () => {
        TONG.store.clearFindSession();
        render();
      });

      setTimeout(() => {
        result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);

      btn.disabled = false;
      btn.textContent = '重新寻找同路人';
      running = false;
      skipStream = false;
    }

    btn.addEventListener('click', async () => {
      if (running) return;
      running = true;
      skipStream = false;
      btn.disabled = true;
      btn.textContent = 'Agent 互聊中…';
      result.style.display = 'none';
      result.innerHTML = '';
      panel.style.display = 'flex';
      stream.innerHTML = '';
      if (liveStatus) liveStatus.textContent = '进行中…';
      paintProgress('正在匹配并启动 Agent 互聊……', '加载授权范围 · 筛选候选 · 生成预交流', 18);

      // 显示跳过按钮
      actions.innerHTML = `<button class="btn btn-secondary btn-sm" id="btn-skip-stream">跳过直播，直接看结果</button>`;
      document.getElementById('btn-skip-stream')?.addEventListener('click', () => {
        skipStream = true;
      });

      let payload;
      try {
        payload = await TONG.api.findCompanions();
      } catch (e) {
        payload = { candidates: TONG.matching.getCandidates(6), prechatSummary: TONG.PRECHAT_SUMMARIES.default };
      }
      const candidates = payload.candidates || [];
      const best = candidates[0] || TONG.matching.getCandidates(1)[0];
      if (!best || !best.user) {
        panel.style.display = 'none';
        result.style.display = 'block';
        result.innerHTML = emptyBox(
          '没有可匹配的候选',
          '预设用户已全部移除。请先在设置中配置数据源 / API，或写入 TONG.USERS 后再试。',
          '<a href="#/settings" class="btn btn-primary btn-sm" data-link>去设置</a>'
        );
        paintProgress('无候选可匹配', '候选池为空', 0);
        btn.disabled = false;
        btn.textContent = '开始寻找同路人';
        running = false;
        return;
      }
      let chatLog = payload.prechat?.chatLog || [];
      if (!chatLog.length) {
        try {
          const p2 = await TONG.api.agentPrechat({ bId: best.userId, best });
          payload.prechat = p2;
          chatLog = p2?.chatLog || [];
        } catch (_) {}
      }

      const rooms = [...document.querySelectorAll('.room')];
      rooms.forEach((room, i) => {
        const u = candidates[i]?.user || TONG.USERS[i];
        room.className = `room room-r${i + 1} lit`;
        if (u) {
          room.innerHTML = `
            <div class="room-avatar" style="background:#EEF2F7;overflow:hidden;padding:2px">
              <img src="${u.avatarUrl || diceUrl(u.avatarSeed || u.id)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${initialFallback(u.name, u.color)}'" />
            </div>
            <div class="room-name">${esc(u.name)}</div>
            <div class="room-stage">${esc(u.shortStage)}</div>`;
          room.dataset.userId = u.id;
        }
      });

      paintProgress('Agent 已开始实时互聊', '下方为完整预交流直播 · 可随时跳过', 42);

      try {
        const total = chatLog.length || 1;
        for (let i = 0; i < chatLog.length; i++) {
          if (skipStream) {
            for (let j = i; j < chatLog.length; j++) {
              const el = document.createElement('div');
              el.className = `msg ${chatLog[j].who === 'A' ? 'msg-me' : chatLog[j].who === 'B' ? 'msg-them' : 'msg-ai'}`;
              el.innerHTML = `<div class="msg-meta">${esc(chatLog[j].from || '')} · ${esc(chatLog[j].time || '')}</div>${esc(chatLog[j].text || '')}`;
              stream.appendChild(el);
            }
            break;
          }
          const body = appendLive(chatLog[i]);
          const pct = Math.round(42 + ((i + 1) / total) * 50);
          paintProgress(
            `Agent 实时对话 ${i + 1}/${total}`,
            `${chatLog[i].from || 'Agent'} 正在打字…`,
            pct
          );
          await typeLive(body, chatLog[i].text);
          if (!skipStream) await sleep(160);
        }
        if (!chatLog.length) {
          (payload.prechatSummary || TONG.PRECHAT_SUMMARIES.default).forEach((s, i) => {
            appendLive({ who: i === 0 ? 'A' : 'SYS', from: i === 0 ? `Agent·${TONG.ME.name || '我'}` : '系统', text: s, time: '' });
          });
        }
      } catch (err) {
        console.warn('live stream error', err);
        appendLive({ who: 'SYS', from: '系统', text: '直播中断，已生成最终结果。', time: '' });
      }

      finishFind(best, candidates, payload);
    });
  }

  function renderCandidateResult(best, candidates, prechatSummary, prechat) {
    const summary = prechat?.summary || prechatSummary || TONG.PRECHAT_SUMMARIES.default;
    const turns = prechat?.turns || [];
    const facets = prechat?.facets || {};
    return `
      <div class="card" style="border-color:${TONG.RELATIONS[best.type].color}">
        <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
          ${avatar(best.user, 'lg')}
          <div style="flex:1;min-width:220px">
            <div style="margin-bottom:8px">${tagHtml(best.type)}</div>
            <h3 class="h3">${esc(best.reason.title)}</h3>
            <p class="small muted" style="margin-top:6px">${esc(best.user.currentStage)}</p>
            <p class="small" style="margin-top:12px;color:var(--ink-2)">${esc(best.reason.talk)}</p>
          </div>
        </div>
        <div class="grid-3" style="margin-top:20px">
          <div>
            <div class="tiny" style="margin-bottom:8px">其他候选</div>
            ${candidates.slice(1, 4).map((c) => `
              <a href="#/reason/${esc(c.userId)}" data-link style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
                ${avatar(c.user, 'sm')}
                <div>
                  <div class="small" style="font-weight:500">${esc(c.user.name)}</div>
                  <div class="tiny">${TONG.RELATIONS[c.type].name}</div>
                </div>
              </a>`).join('')}
          </div>
          <div style="grid-column: span 2">
            <div class="tiny" style="margin-bottom:10px;display:flex;align-items:center;gap:8px">
              Agent 预交流摘要
              <span class="tag tag-ahead" style="font-size:11px">${TONG.api?.authed() ? 'LLM 生成' : '语义核对 · Mock'}</span>
            </div>
            <div class="prechat-board">
              ${turns.map((t, i) => `
                <div class="prechat-turn ${t.who === 'A' ? 'is-a' : t.who === 'B' ? 'is-b' : 'is-sys'}" style="animation-delay:${i * 0.06}s">
                  <div class="prechat-from">${esc(t.from || (t.who === 'A' ? '我的 Agent' : t.who === 'B' ? '对方 Agent' : '系统'))}</div>
                  <div class="prechat-text">${esc(t.text)}</div>
                </div>`).join('')}
            </div>
            ${facets.common?.length || facets.complement?.length ? `
              <div class="prechat-facets">
                ${facets.common?.length ? `<div><span class="tiny">共同</span><div class="chip-list">${facets.common.map((x) => `<span class="chip active">${esc(x)}</span>`).join('')}</div></div>` : ''}
                ${facets.complement?.length ? `<div><span class="tiny">互补</span><div class="chip-list">${facets.complement.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div></div>` : ''}
                ${facets.tension?.length ? `<div><span class="tiny">值得讨论</span><div class="chip-list">${facets.tension.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div></div>` : ''}
                ${facets.willingness ? `<div><span class="tiny">对方意愿</span><div class="small" style="margin-top:4px">${esc(facets.willingness)}</div></div>` : ''}
              </div>` : ''}
            <details class="prechat-details">
              <summary>折叠版要点</summary>
              <ul style="padding-left:18px;color:var(--ink-2);font-size:13px;line-height:1.8;margin-top:8px">
                ${summary.map((s) => `<li>${esc(s)}</li>`).join('')}
              </ul>
            </details>
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-replay-log="${esc(best.userId)}">实时回放 Agent 聊天</button>
              <a class="btn btn-primary btn-sm" href="#/chat/${esc(best.userId)}" data-link>去破冰接管</a>
            </div>
          </div>
        </div>
      </div>`;
  }

  function bindReason(id) {
    root.querySelectorAll('[data-connect]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.connect;
        const s = TONG.store.load();
        if (!s.connected.includes(uid)) s.connected = [...s.connected, uid];
        TONG.store.save({ connected: s.connected });
        toast('已建立连接，进入破冰');
        navigate(`/chat/${uid}`);
      });
    });
    root.querySelectorAll('[data-agent-ask]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.agentAsk;
        openModal(`
          <h3 class="h3" style="margin-bottom:12px">Agent 追问结果</h3>
          <p class="small muted" style="margin-bottom:12px">对方 Agent 在授权范围内补充确认：</p>
          <div class="quote-box">对方 Agent 将在授权范围内补充确认连接价值。配置真实模型后，这里会显示现场生成的确认结果。</div>
          <div class="action-row" style="margin-bottom:0">
            <button class="btn btn-primary btn-sm" id="go-chat" data-uid="${esc(uid)}">去破冰</button>
            <button class="btn btn-ghost btn-sm" id="modal-close">再想想</button>
          </div>`);
        document.getElementById('go-chat')?.addEventListener('click', () => {
          closeModal();
          navigate(`/chat/${uid}`);
        });
      });
    });
    root.querySelectorAll('[data-skip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.dataset.skip;
        const s = TONG.store.load();
        TONG.store.save({ skipped: [...new Set([...(s.skipped || []), uid])] });
        toast('已跳过，系统会降低类似推荐');
        navigate('/find');
      });
    });
  }

  function bindEncounter() {
    root.querySelectorAll('[data-wave]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.wave;
        const s = TONG.store.load();
        TONG.store.save({ greetedEncounters: [...new Set([...(s.greetedEncounters || []), id])] });
        btn.disabled = true;
        btn.textContent = '已打招呼 ✓';
        toast('已发送轻量信号，对方只会看到「有人和你看向了同一篇」');
      });
    });
    root.querySelectorAll('[data-collect]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openModal(`
          <h3 class="h3" style="margin-bottom:12px">共同收藏主题</h3>
          <p class="small muted" style="margin-bottom:12px">Agent 只展示抽象主题，不展开具体私密条目。</p>
          <div class="chip-list">
            <span class="muted small">共同收藏主题将在接入数据后展示抽象语义。</span>
          </div>
          <div class="action-row" style="margin-bottom:0"><button class="btn btn-secondary btn-sm" id="modal-close">知道了</button></div>`);
      });
    });
    root.querySelectorAll('[data-topic]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const e = TONG.ENCOUNTERS.find((x) => x.id === btn.dataset.topic);
        openModal(`
          <h3 class="h3" style="margin-bottom:12px">AI 建议的共同话题</h3>
          <div class="quote-box">基于「${esc(e?.typeName || '')}」，你们可以聊：${esc(e?.detail || '共同关注的知识节点')}。要不要从「你当时是怎么开始的？」问起？</div>
          <div class="action-row" style="margin-bottom:0"><button class="btn btn-secondary btn-sm" id="modal-close">稍后再说</button></div>`);
      });
    });
  }

  function bindMap() {
    root.querySelectorAll('[data-map-user]').forEach((el) => {
      el.addEventListener('click', () => {
        const uid = el.dataset.mapUser;
        navigate(`/reason/${uid}`);
      });
    });
    const filters = document.getElementById('map-filters');
    if (filters) {
      filters.querySelectorAll('.filter-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          filters.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          const key = chip.dataset.filter;
          root.querySelectorAll('.map-person[data-rel]').forEach((el) => {
            const show = key === 'all' || el.dataset.rel === key;
            el.style.display = show ? '' : 'none';
          });
        });
      });
    }
  }

  function bindChat(id) {
    const c = TONG.matching.byId(id) || TONG.matching.getFourTypes().complement;
    const u = c.user || userById(id);
    const r = c.reason;
    const sendOpen = document.getElementById('btn-send-open');
    const editOpen = document.getElementById('btn-edit-open');
    const textEl = document.getElementById('icebreaker-text');
    const messages = document.getElementById('chat-messages');
    const status = document.getElementById('chat-status');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');

    document.getElementById('btn-view-agent-log')?.addEventListener('click', () => openAgentLog(u.id));
    root.querySelectorAll('[data-open-log]').forEach((el) => {
      el.addEventListener('click', () => openAgentLog(el.dataset.openLog));
    });

    // typewriter icebreaker (prefer API)
    if (textEl) {
      const fallback = textEl.dataset.full || r.icebreaker || '';
      textEl.textContent = '';
      textEl.classList.add('typewriter-cursor');
      TONG.api.icebreaker({ userId: u.id }).then((res) => {
        const full = res?.text || fallback;
        let i = 0;
        const timer = setInterval(() => {
          i += 1;
          textEl.textContent = full.slice(0, i);
          if (i >= full.length) {
            clearInterval(timer);
            textEl.classList.remove('typewriter-cursor');
          }
        }, 28);
      }).catch(() => {
        textEl.textContent = fallback;
        textEl.classList.remove('typewriter-cursor');
      });
    }

    if (sendOpen && !sendOpen.disabled) {
      sendOpen.addEventListener('click', () => {
        const s = TONG.store.load();
        TONG.store.save({ connected: [...new Set([...s.connected, u.id])] });
        const openText = textEl.textContent;
        messages.insertAdjacentHTML('beforeend', `<div class="msg msg-me">${esc(openText)}</div>`);
        sendOpen.disabled = true;
        sendOpen.textContent = '已发送并接管';
        status.textContent = '真人已接管';
        input.disabled = false;
        sendBtn.disabled = false;
        messages.scrollTop = messages.scrollHeight;
        replyWithAI(openText, u, r, c, messages, status);
        toast('真人接管关系');
      });
    }

    if (editOpen) {
      editOpen.addEventListener('click', () => {
        const cur = textEl.textContent;
        openModal(`
          <h3 class="h3" style="margin-bottom:12px">编辑开场</h3>
          <textarea class="chat-input" id="edit-open-area" rows="5" style="width:100%;margin-bottom:12px">${esc(cur)}</textarea>
          <div class="action-row" style="margin-bottom:0">
            <button class="btn btn-primary btn-sm" id="save-open">保存</button>
            <button class="btn btn-ghost btn-sm" id="modal-close">取消</button>
          </div>`);
        document.getElementById('save-open')?.addEventListener('click', () => {
          const v = document.getElementById('edit-open-area').value.trim();
          if (v) textEl.textContent = v;
          closeModal();
          toast('开场已更新');
        });
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const v = input.value.trim();
        if (!v) return;
        messages.insertAdjacentHTML('beforeend', `<div class="msg msg-me">${esc(v)}</div>`);
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        replyWithAI(v, u, r, c, messages, status);
      });
    }
  }

  function collectChatHistory(messagesEl) {
    const history = [];
    messagesEl.querySelectorAll('.msg').forEach((el) => {
      const body = el.textContent.replace(/^\s*Agent·[^\n]*\n?/, '').trim();
      if (el.classList.contains('msg-me')) history.push({ role: 'user', text: body });
      else if (el.classList.contains('msg-them')) history.push({ role: 'them', text: body });
    });
    return history.slice(-10);
  }

  async function replyWithAI(userText, u, r, c, messagesEl, statusEl) {
    const typing = document.createElement('div');
    typing.className = 'msg msg-them';
    typing.id = 'chat-typing';
    typing.innerHTML = `<div class="msg-meta">${esc(u?.name || 'TA')}</div><span class="muted">正在回复…</span>`;
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    if (statusEl) statusEl.textContent = '对方输入中…';

    try {
      const history = collectChatHistory(messagesEl);
      // 去掉刚插入的 typing 节点文本影响
      const text = await TL_GEN.askCompanion({
        them: u,
        reason: r,
        relationType: c?.type,
        history,
        userText,
      });
      typing.remove();
      messagesEl.insertAdjacentHTML('beforeend', `<div class="msg msg-them">${esc(text)}</div>`);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      if (statusEl) statusEl.textContent = '真人已接管';
    } catch (e) {
      typing.remove();
      messagesEl.insertAdjacentHTML(
        'beforeend',
        `<div class="msg msg-them">${esc(mockReply(u, r))}</div>`
      );
      messagesEl.scrollTop = messagesEl.scrollHeight;
      if (statusEl) statusEl.textContent = '真人已接管（回退）';
      toast('AI 回复失败，已用兜底文案', 'err');
    }
  }

  function bindSettings() {
    root.querySelectorAll('[data-privacy]').forEach((sw) => {
      sw.addEventListener('click', () => {
        const key = sw.dataset.privacy;
        const s = TONG.store.load();
        const scopes = { ...s.privacyScopes, [key]: !s.privacyScopes[key] };
        // 敏感项强制默认关闭提醒
        if (['private_messages', 'real_identity'].includes(key) && scopes[key]) {
          toast('演示建议：私信与真实身份保持关闭');
        }
        TONG.store.save({ privacyScopes: scopes });
        sw.classList.toggle('on', scopes[key]);
      });
    });

    root.querySelectorAll('[data-intent]').forEach((el) => {
      el.addEventListener('click', () => {
        const v = el.dataset.intent;
        TONG.store.save({ socialIntent: v });
        root.querySelectorAll('[data-intent]').forEach((x) => x.classList.toggle('selected', x.dataset.intent === v));
        toast('社交意愿已更新');
      });
    });

    function bindChipToggle(attr, listKey, classOn) {
      root.querySelectorAll(`[data-${attr}]`).forEach((chip) => {
        chip.addEventListener('click', () => {
          const t = chip.dataset[attr];
          const s = TONG.store.load();
          const list = new Set(s[listKey] || []);
          if (list.has(t)) list.delete(t);
          else list.add(t);
          TONG.store.save({ [listKey]: [...list] });
          chip.classList.toggle(classOn, list.has(t));
        });
      });
    }
    bindChipToggle('willing', 'willingToTalk', 'active');
    bindChipToggle('unwilling', 'notWillingToTalk', 'blocked');

    document.getElementById('btn-reset-demo')?.addEventListener('click', () => {
      TONG.store.reset();
      toast('演示数据已重置');
      render();
    });

    document.getElementById('api-save')?.addEventListener('click', () => {
      const baseUrl = document.getElementById('api-base')?.value.trim() || '';
      const apiKey = document.getElementById('api-key')?.value.trim() || '';
      const model = document.getElementById('api-model')?.value.trim() || '';
      TONG.api.saveCfg({ baseUrl, apiKey, model });
      const ok = TONG.api.authed();
      const st = document.getElementById('api-status');
      if (st) st.textContent = ok ? '当前：LLM 模式' : '当前：Mock 模式（配置不完整）';
      toast(ok ? '已启用 LLM，失败会自动回退 Mock' : '请填写完整 Base URL / Key / Model');
    });
    document.getElementById('api-clear')?.addEventListener('click', () => {
      TONG.api.saveCfg({ baseUrl: '', apiKey: '', model: '' });
      document.getElementById('api-base').value = '';
      document.getElementById('api-key').value = '';
      document.getElementById('api-model').value = '';
      toast('已清除直连配置');
    });

    document.getElementById('seed-save')?.addEventListener('click', () => {
      const seed = collectSeedFromSettings();
      TONG.store.save({ seed });
      toast('主角简介已保存', 'ok');
    });
    document.getElementById('seed-generate')?.addEventListener('click', () => {
      const seed = collectSeedFromSettings();
      TONG.store.save({ seed });
      runAiGenerate(seed);
    });
    TL_GEN.health().then((h) => {
      const el = document.getElementById('ai-health-setting');
      if (el) {
        el.textContent = h.llm_configured ? `后端 OK · ${h.model}` : '后端未配置密钥';
        el.style.color = h.llm_configured ? 'var(--green)' : 'var(--amber)';
      }
    }).catch(() => {});
  }

  /* ---------- Demo story mode（分镜小动画，无预设人物） ---------- */
  const demoScript = [
    {
      id: 'open',
      kind: 'student',
      caption: '一个用户打开知乎',
      line: '我卡在一个专业选择上：该深耕原方向，还是往交叉领域转？',
      hold: 3600,
    },
    {
      id: 'llm',
      kind: 'llm',
      caption: '传统大模型会给他：',
      line: '利弊分析、十条建议，还有通用职业路径表。',
      hold: 3400,
      muted: true,
    },
    {
      id: 'promise',
      kind: 'promise',
      caption: '「同路人」说：',
      line: '比标准答案更有价值的，往往是一个走过这段路的人。',
      hold: 3400,
    },
    {
      id: 'depart',
      kind: 'depart',
      caption: 'Agent 出发',
      line: '先读你的公开创作与轨迹，再去核对谁真的走过相似的路。',
      hold: 4200,
    },
    {
      id: 'found',
      kind: 'found',
      caption: '找到一个走过这条路的人',
      line: 'TA 曾经也卡在类似的路口，现在正在分享当时的取舍与方法。',
      hold: 3800,
    },
    {
      id: 'prechat',
      kind: 'prechat',
      caption: 'Agent 已经提前交流',
      line: '不展示私聊，只给你可解释的连接价值与共同话题。',
      hold: 3800,
    },
    {
      id: 'ice',
      kind: 'ice',
      caption: '你最值得问 TA 的问题：',
      line: '如果你重新站在我这个路口，你最希望有人提前告诉你什么？',
      hold: 4200,
      cta: true,
    },
    {
      id: 'end',
      kind: 'end',
      caption: 'AI 已经可以回答几乎所有问题。',
      line: '但有些问题，我们真正需要的是一个走过这条路的人。',
      hold: 0,
      ending: true,
    },
  ];

  let demoTimer = null;

  function demoSceneHtml(s) {
    const commonCap = `<div class="demo-cap"><span class="demo-cap-kicker">${esc(s.caption)}</span></div>`;
    const commonLine = `<div class="demo-line" id="demo-line"></div>`;
    let art = '';

    if (s.kind === 'student') {
      art = `
        <div class="scene scene-student">
          <div class="desk"></div>
          <div class="laptop"><div class="screen-glow"></div></div>
          <div class="student-silhouette"></div>
          <div class="float-q q1">?</div>
          <div class="float-q q2">?</div>
          <div class="float-q q3">?</div>
        </div>`;
    } else if (s.kind === 'llm') {
      art = `
        <div class="scene scene-llm">
          ${[0,1,2,3,4].map((i) => `<div class="llm-card" style="--i:${i}">建议 ${i + 1}</div>`).join('')}
        </div>`;
    } else if (s.kind === 'promise') {
      art = `
        <div class="scene scene-promise">
          <div class="demo-orb">我</div>
          <div class="ring-pulse"></div>
          <div class="ring-pulse d2"></div>
        </div>`;
    } else if (s.kind === 'depart') {
      art = `
        <div class="scene scene-depart">
          <svg viewBox="0 0 520 220" class="depart-svg">
            <path class="traj-path" d="M40 160 C140 160, 160 60, 260 70 S400 150, 480 80" stroke="#0084FF" fill="none" stroke-width="2.5" stroke-linecap="round"/>
            <circle class="orb-dot main" cx="40" cy="160" r="10"/>
            <circle class="orb-dot ghost" cx="180" cy="90" r="6" opacity=".45"/>
            <circle class="orb-dot ghost" cx="300" cy="78" r="6" opacity=".35"/>
            <circle class="orb-dot ghost" cx="420" cy="120" r="6" opacity=".3"/>
            <circle class="orb-dot target" cx="480" cy="80" r="8"/>
          </svg>
          <div class="depart-labels">
            <span>你的 Agent</span><span>候选房间</span><span>连接价值</span>
          </div>
        </div>`;
    } else if (s.kind === 'found') {
      const u = s.userId ? userById(s.userId) : { name: '同行者', color: '#10B981', shortStage: '路径经验分享' };
      art = `
        <div class="scene scene-found">
          <div class="found-card">
            ${avatar(u, 'lg')}
            <div class="found-card-meta">
              ${tagHtml('ahead')}
              <div class="found-name">${esc(u?.name || '同行者')}</div>
              <div class="tiny found-stage">${esc(u?.shortStage || u?.currentStage || '路径经验分享')}</div>
            </div>
          </div>
          <ol class="found-timeline">
            <li>更早 · 同类问题</li>
            <li>后来 · 走过这段路</li>
            <li>再后来 · 分享经验</li>
            <li class="now">现在 · 能回答卡点</li>
          </ol>
        </div>`;
    } else if (s.kind === 'prechat') {
      art = `
        <div class="scene scene-prechat">
          <div class="bubble b-a">A：兴趣 / 卡点 / 技能</div>
          <div class="bubble b-b">B：轨迹 / 意愿 / 边界</div>
          <div class="bubble b-sys">连接价值成立 · high</div>
        </div>`;
    } else if (s.kind === 'ice') {
      art = `
        <div class="scene scene-ice">
          <div class="ice-node n1">你</div>
          <div class="ice-bridge"></div>
          <div class="ice-node n2">TA</div>
          <div class="ice-q">?</div>
        </div>`;
    } else if (s.kind === 'end') {
      art = `
        <div class="scene scene-end">
          <div class="end-orb fade">AI</div>
          <div class="end-pair">
            <span class="end-dot"></span><span class="end-link"></span><span class="end-dot"></span>
          </div>
        </div>`;
    }

    return `${art}${commonCap}${commonLine}`;
  }

  function typeDemoLine(text, msTotal = 2200) {
    return new Promise((resolve) => {
      const el = document.getElementById('demo-line');
      if (!el) { resolve(); return; }
      const full = String(text || '');
      const step = Math.max(12, Math.floor(msTotal / Math.max(full.length, 1)));
      let i = 0;
      el.classList.add('typewriter-cursor');
      const t = setInterval(() => {
        i += 1;
        el.textContent = full.slice(0, i);
        if (i >= full.length) {
          clearInterval(t);
          el.classList.remove('typewriter-cursor');
          resolve();
        }
      }, step);
    });
  }

  function bindDemo() {
    let step = 0;
    let autoOn = true;
    let playing = false;
    const stage = document.getElementById('demo-stage');
    const controls = document.getElementById('demo-controls');
    const dots = document.getElementById('demo-steps');
    const autoBox = document.getElementById('demo-autoplay');

    function clearAuto() {
      if (demoTimer) { clearTimeout(demoTimer); demoTimer = null; }
    }

    function paintDots() {
      dots.innerHTML = demoScript.map((_, i) =>
        `<div class="demo-step-dot ${i === step ? 'active' : i < step ? 'done' : ''}"></div>`
      ).join('');
    }

    function scheduleAuto(delay) {
      clearAuto();
      if (!autoOn) return;
      if (step >= demoScript.length - 1) return;
      const s = demoScript[step];
      if (s.ending || s.cta) return;
      demoTimer = setTimeout(() => {
        step += 1;
        paint();
      }, delay);
    }

    async function paint() {
      const s = demoScript[step];
      playing = true;
      stage.classList.remove('is-switching');
      stage.innerHTML = demoSceneHtml(s);
      // 触发入场
      requestAnimationFrame(() => stage.classList.add('is-live'));
      paintDots();

      if (s.ending) {
        clearAuto();
        controls.innerHTML = `
          <p class="lead small" style="max-width:460px;margin:0 auto 20px">AI 最好的社交能力，也许不是陪你聊天，而是帮你找到那个值得聊的人。</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <a href="#/" class="btn btn-secondary" data-link>回到首页</a>
            <a href="#/find" class="btn btn-primary" data-link>自己也找一位同路人</a>
            <a href="./demo-share.html" download="知遇.同路人-演示.html" class="btn btn-secondary btn-sm">下载分享版</a>
            <button class="btn btn-ghost btn-sm" id="demo-restart">重播小剧场</button>
          </div>`;
      } else if (s.cta) {
        controls.innerHTML = `
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <a href="#/chat/${esc(s.userId || 'r1')}" class="btn btn-primary btn-lg" data-link>和 TA 打个招呼</a>
            <button class="btn btn-secondary btn-sm" id="demo-next">继续结尾</button>
            <button class="btn btn-ghost btn-sm" id="demo-restart">重播</button>
          </div>`;
      } else {
        controls.innerHTML = `
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary" id="demo-next">${step === 0 ? '播放小剧场' : '下一幕'}</button>
            <button class="btn btn-secondary btn-sm" id="demo-skip">跳到结尾</button>
            <button class="btn btn-ghost btn-sm" id="demo-restart">重播</button>
          </div>`;
      }

      document.getElementById('demo-next')?.addEventListener('click', () => {
        clearAuto();
        if (step < demoScript.length - 1) { step += 1; paint(); }
      });
      document.getElementById('demo-skip')?.addEventListener('click', () => {
        clearAuto();
        step = demoScript.length - 1;
        paint();
      });
      document.getElementById('demo-restart')?.addEventListener('click', () => {
        step = 0;
        paint();
      });

      await typeDemoLine(s.line, s.muted ? 1600 : 2400);
      playing = false;
      scheduleAuto(s.hold || 2800);
    }

    if (autoBox) {
      autoBox.addEventListener('change', () => {
        autoOn = autoBox.checked;
        if (autoOn) scheduleAuto(1200);
        else clearAuto();
      });
    }

    paint();
  }

  /* ---------- modal ---------- */
  function openModal(html) {
    closeModal();
    const el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.id = 'modal-root';
    el.innerHTML = `<div class="modal">${html}</div>`;
    el.addEventListener('click', (e) => {
      if (e.target === el) closeModal();
    });
    document.body.appendChild(el);
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
  }
  function closeModal() {
    document.getElementById('modal-root')?.remove();
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function openAgentLog(uid) {
    const log = TONG.store.getAgentLog(uid);
    const person = userById(uid);
    if (!log?.chatLog?.length) {
      openModal(`<h3 class="h3">暂无 Agent 聊天记录</h3><p class="small muted" style="margin:10px 0 16px">请先完成一次「找同路人」，系统会保存完整预交流，再在这里实时回放。</p><button class="btn btn-primary btn-sm" id="modal-close">知道了</button>`);
      return;
    }
    openModal(`
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${avatar(person, 'sm')}
        <div style="flex:1">
          <h3 class="h3">${esc(log.title || 'Agent 预交流回放')}</h3>
          <div class="tiny">${new Date(log.savedAt || Date.now()).toLocaleString('zh-CN')} · 共 ${log.chatLog.length} 条 · 打字机回放</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="agent-log-skip">跳到结尾</button>
      </div>
      <p class="tiny muted" style="margin-bottom:10px">文字逐字打出，模拟 Agent 实时交流；不是私信原文。</p>
      <div class="chat-messages" id="agent-log-stream" style="max-height:52vh;min-height:280px;border:1px solid var(--border);border-radius:16px;background:var(--bg);margin-bottom:14px"></div>
      <div class="action-row" style="margin-bottom:0">
        <a class="btn btn-primary btn-sm" href="#/chat/${esc(uid)}" data-link id="modal-goto-chat">去破冰接管</a>
        <button class="btn btn-ghost btn-sm" id="modal-close">关闭</button>
      </div>`);

    const stream = document.getElementById('agent-log-stream');
    let killed = false;
    let typeTimer = null;
    let idx = 0;

    function clearTimers() {
      killed = true;
      if (typeTimer) { clearTimeout(typeTimer); typeTimer = null; }
    }

    function appendShell(m) {
      const el = document.createElement('div');
      el.className = `msg ${m.who === 'A' ? 'msg-me' : m.who === 'B' ? 'msg-them' : 'msg-ai'}`;
      el.innerHTML = `<div class="msg-meta">${esc(m.from || '')} · ${esc(m.time || '')}</div><div class="msg-body typewriter-cursor"></div>`;
      stream.appendChild(el);
      stream.scrollTop = stream.scrollHeight;
      return el.querySelector('.msg-body');
    }

    function typeText(body, text, done) {
      const full = String(text || '');
      let i = 0;
      function step() {
        if (killed) return;
        i += 1;
        body.textContent = full.slice(0, i);
        stream.scrollTop = stream.scrollHeight;
        if (i < full.length) {
          const ch = full[i - 1];
          const delay = ch === '。' || ch === '！' || ch === '？' ? 90
            : ch === '，' || ch === '；' || ch === '、' ? 55
            : 18 + Math.random() * 22;
          typeTimer = setTimeout(step, delay);
        } else {
          body.classList.remove('typewriter-cursor');
          done && done();
        }
      }
      if (!full.length) {
        body.classList.remove('typewriter-cursor');
        done && done();
        return;
      }
      step();
    }

    function playNext() {
      if (killed) return;
      if (idx >= log.chatLog.length) return;
      const m = log.chatLog[idx++];
      const body = appendShell(m);
      typeText(body, m.text, () => {
        if (killed) return;
        if (idx < log.chatLog.length) {
          typeTimer = setTimeout(playNext, 280);
        }
      });
    }

    function finishAll() {
      clearTimers();
      stream.innerHTML = '';
      log.chatLog.forEach((m) => {
        const el = document.createElement('div');
        el.className = `msg ${m.who === 'A' ? 'msg-me' : m.who === 'B' ? 'msg-them' : 'msg-ai'}`;
        el.innerHTML = `<div class="msg-meta">${esc(m.from || '')} · ${esc(m.time || '')}</div>${esc(m.text || '')}`;
        stream.appendChild(el);
      });
      stream.scrollTop = stream.scrollHeight;
      idx = log.chatLog.length;
    }

    playNext();
    document.getElementById('agent-log-skip')?.addEventListener('click', finishAll);
    document.getElementById('modal-goto-chat')?.addEventListener('click', clearTimers);
    document.getElementById('modal-close')?.addEventListener('click', clearTimers);
  }

  /* ---------- 登录后产品演示（分镜小视频） ---------- */
  function playLoginIntro(onDone) {
    if (document.getElementById('login-intro')) return;
    const wrap = document.createElement('div');
    wrap.id = 'login-intro';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', '产品演示');
    wrap.innerHTML = `
      <div class="login-intro-card">
        <div class="login-intro-top">
          <div>
            <div class="login-intro-brand">知遇.同路人</div>
            <div class="login-intro-sub">登录成功 · 先看 30 秒产品演示</div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" id="intro-skip">跳过</button>
        </div>
        <div class="login-intro-film" id="intro-film"></div>
        <div class="login-intro-dots" id="intro-dots"></div>
        <div class="login-intro-actions" id="intro-actions"></div>
      </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add('intro-open');
    // 隐藏跟宠，避免压住字幕
    const pet = document.getElementById('cursor-pet');
    if (pet) pet.classList.add('is-away');

    const film = wrap.querySelector('#intro-film');
    const dots = wrap.querySelector('#intro-dots');
    const actions = wrap.querySelector('#intro-actions');
    let step = 0;
    let timer = null;
    let killed = false;

    function close(goHome) {
      killed = true;
      if (timer) clearTimeout(timer);
      document.body.classList.remove('intro-open');
      if (pet) pet.classList.remove('is-away');
      wrap.remove();
      sessionStorage.setItem('tl_show_hero_guide', '1');
      if (goHome !== false) {
        if (location.hash !== '#/') navigate('/');
        else render();
        setTimeout(applyHeroGuide, 80);
      }
      onDone?.();
    }

    wrap.querySelector('#intro-skip')?.addEventListener('click', () => close(true));

    function typeLine(text, done) {
      const el = film.querySelector('#demo-line');
      if (!el) { done?.(); return; }
      const full = String(text || '');
      let i = 0;
      el.classList.add('typewriter-cursor');
      function tick() {
        if (killed) return;
        i += 1;
        el.textContent = full.slice(0, i);
        if (i < full.length) timer = setTimeout(tick, 16);
        else {
          el.classList.remove('typewriter-cursor');
          done?.();
        }
      }
      tick();
    }

    function paintDots() {
      dots.innerHTML = demoScript.map((_, i) => `<span class="dot ${i === step ? 'on' : i < step ? 'done' : ''}"></span>`).join('');
    }

    function paint() {
      if (killed) return;
      const s = demoScript[step];
      // demoSceneHtml 已含 caption + line，不要重复叠字幕
      film.innerHTML = demoSceneHtml(s);
      paintDots();
      typeLine(s.line, () => {
        if (killed) return;
        if (s.ending) {
          actions.innerHTML = `<button type="button" class="btn btn-primary" id="intro-continue">回到首页并开始生成</button>`;
          actions.querySelector('#intro-continue')?.addEventListener('click', () => {
            close(true);
          });
          return;
        }
        timer = setTimeout(() => {
          if (killed) return;
          if (step < demoScript.length - 1) {
            step += 1;
            paint();
          }
        }, s.hold || 2800);
      });
    }

    paint();
  }

  async function maybePlayIntroAfterLogin() {
    const params = new URLSearchParams(location.search);
    const fromOauth = params.get('oauth') === 'ok';
    let session = { authenticated: false };
    try {
      session = await TL_GEN.fetchSession();
    } catch (_) {}
    if (!session.authenticated) return;
    const key = 'tl_intro_played';
    if (sessionStorage.getItem(key)) return;
    // 授权回来或本会话首次进入主站时播放
    if (fromOauth || location.hash.startsWith('#/') || location.hash === '' || location.hash === '#/') {
      sessionStorage.setItem(key, '1');
      if (fromOauth) {
        history.replaceState(null, '', location.pathname + '#/');
      }
      playLoginIntro();
    }
  }

  /* ---------- boot ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (a && a.getAttribute('href')?.startsWith('#')) {
      // hash navigation handled by hashchange
    }
  });

  document.getElementById('nav-menu-btn')?.addEventListener('click', () => {
    document.getElementById('nav-links')?.classList.toggle('open');
  });

  window.addEventListener('hashchange', render);
  try { TL_GEN?.hydrate?.(); } catch (_) {}
  if (!location.hash) {
    location.hash = '#/';
  } else {
    render();
  }
  maybePlayIntroAfterLogin().catch(() => {});
})();
