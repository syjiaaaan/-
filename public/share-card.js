/* Soul Profile 分享卡导出 */
(function () {
  const W = 900;
  const H = 1280;
  const BLUE = '#0084FF';
  const INK = '#0F172A';
  const MUTED = '#64748B';
  const BG = '#F7F9FC';
  const BORDER = '#E2E8F0';
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    const chars = String(text).split('');
    let line = '';
    let lines = [];
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = chars[i];
        if (lines.length >= maxLines - 1) {
          // rest
          let rest = chars.slice(i).join('');
          while (ctx.measureText(rest + '…').width > maxWidth && rest.length > 1) {
            rest = rest.slice(0, -1);
          }
          lines.push(rest + (i < chars.length - 1 ? '…' : ''));
          line = '';
          break;
        }
      } else {
        line = test;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineHeight));
    return lines.length;
  }

  async function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function drawShareCard(me) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // bg
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // soft radial glow
    const g = ctx.createRadialGradient(W * 0.7, 80, 20, W * 0.7, 80, 420);
    g.addColorStop(0, 'rgba(0,132,255,0.12)');
    g.addColorStop(1, 'rgba(0,132,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 400);

    // dot grid
    ctx.fillStyle = '#E2E8F0';
    for (let y = 24; y < H; y += 24) {
      for (let x = 24; x < W; x += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // top brand bar
    ctx.fillStyle = '#fff';
    roundedRect(ctx, 40, 36, W - 80, 72, 20);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = BLUE;
    roundedRect(ctx, 60, 52, 40, 40, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px Inter, "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('知', 80, 72);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = INK;
    ctx.font = '600 20px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText('知遇.同路人', 116, 70);
    ctx.fillStyle = MUTED;
    ctx.font = '400 13px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText('Soul Profile · 知识人格分享卡', 116, 92);

    // avatar — local draw (avoid CORS taint)
    ctx.save();
    roundedRect(ctx, 60, 140, 120, 120, 28);
    ctx.clip();
    const avGrad = ctx.createLinearGradient(60, 140, 180, 260);
    avGrad.addColorStop(0, '#E8F3FF');
    avGrad.addColorStop(1, '#D6EBFF');
    ctx.fillStyle = avGrad;
    ctx.fillRect(60, 140, 120, 120);
    ctx.fillStyle = '#0084FF';
    ctx.beginPath();
    ctx.arc(120, 196, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6BB6FF';
    ctx.beginPath();
    ctx.ellipse(120, 262, 38, 34, 0, Math.PI, 0, true);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 26px Inter, "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((me.name || '我').slice(0, 1), 120, 196);
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.strokeStyle = BORDER;
    roundedRect(ctx, 60, 140, 120, 120, 28);
    ctx.stroke();

    // name / stage
    ctx.fillStyle = INK;
    ctx.font = '700 36px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText(me.name || '我', 208, 190);
    ctx.fillStyle = MUTED;
    ctx.font = '400 16px Inter, "Noto Sans SC", sans-serif';
    wrapText(ctx, me.currentStage || '', 208, 224, 560, 24, 2);

    // status pill
    ctx.fillStyle = '#E6F8F1';
    roundedRect(ctx, 208, 268, 148, 32, 16);
    ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.font = '500 13px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText('●  愿意认识新人', 224, 289);

    // section helper
    function sectionTitle(y, num, title) {
      ctx.fillStyle = '#E8F3FF';
      roundedRect(ctx, 60, y - 20, 28, 28, 9);
      ctx.fill();
      ctx.fillStyle = BLUE;
      ctx.font = '600 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num), 74, y - 6);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = INK;
      ctx.font = '600 18px Inter, "Noto Sans SC", sans-serif';
      ctx.fillText(title, 100, y);
    }

    // 1 path
    let y = 360;
    sectionTitle(y, 1, '我最近在走什么路');
    y += 36;
    ctx.fillStyle = MUTED;
    ctx.font = '400 15px Inter, "Noto Sans SC", sans-serif';
    const pathText = '正在从「学习机器人」进入「真正做机器人项目」的阶段，开始面对系统集成与视觉模块的真实问题。';
    y += wrapText(ctx, pathText, 60, y, W - 120, 26, 3) * 26 + 20;

    // 2 skills
    sectionTitle(y, 2, '我知道什么');
    y += 40;
    const skills = Object.entries(me.skills || {}).slice(0, 5);
    skills.forEach(([name, val]) => {
      ctx.fillStyle = INK;
      ctx.font = '500 14px Inter, "Noto Sans SC", sans-serif';
      ctx.fillText(name, 60, y + 12);
      const bx = 180;
      const bw = 520;
      const bh = 10;
      ctx.fillStyle = '#EEF2F7';
      roundedRect(ctx, bx, y, bw, bh, 5);
      ctx.fill();
      const fw = (val / 5) * bw;
      const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      grad.addColorStop(0, BLUE);
      grad.addColorStop(1, '#6BB6FF');
      ctx.fillStyle = grad;
      roundedRect(ctx, bx, y, Math.max(fw, 8), bh, 5);
      ctx.fill();
      ctx.fillStyle = MUTED;
      ctx.font = '400 12px Inter, sans-serif';
      ctx.fillText(`${val}/5`, bx + bw + 14, y + 10);
      y += 34;
    });
    y += 10;

    // 3 confusion
    sectionTitle(y, 3, '我正在困惑什么');
    y += 28;
    ctx.fillStyle = '#E8F3FF';
    roundedRect(ctx, 60, y, W - 120, 92, 16);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '400 15px Inter, "Noto Sans SC", sans-serif';
    wrapText(ctx, me.confusion || me.path || '尚未生成困惑摘要', 80, y + 32, W - 160, 24, 3);
    y += 120;

    // 4 topics
    sectionTitle(y, 4, '我最近关注什么');
    y += 36;
    let tx = 60;
    (me.topics || []).slice(0, 5).forEach((t) => {
      ctx.font = '500 14px Inter, "Noto Sans SC", sans-serif';
      const tw = ctx.measureText(t).width + 28;
      if (tx + tw > W - 60) return;
      ctx.fillStyle = '#fff';
      roundedRect(ctx, tx, y - 22, tw, 34, 17);
      ctx.fill();
      ctx.strokeStyle = '#93C5FD';
      ctx.stroke();
      ctx.fillStyle = BLUE;
      ctx.fillText(t, tx + 14, y);
      tx += tw + 10;
    });
    y += 36;

    // 5 help
    sectionTitle(y, 5, '我可能帮助别人什么');
    y += 36;
    const helps = (me.canHelp || Object.entries(me.skills || {}).filter(([, v]) => v >= 4).map(([k]) => k) || []);
    let hx = 60;
    helps.forEach((t) => {
      ctx.font = '500 14px Inter, "Noto Sans SC", sans-serif';
      const tw = ctx.measureText(t).width + 28;
      ctx.fillStyle = '#E6F8F1';
      roundedRect(ctx, hx, y - 22, tw, 34, 17);
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.fillText(t, hx + 14, y);
      hx += tw + 10;
    });

    // footer
    ctx.fillStyle = '#fff';
    roundedRect(ctx, 40, H - 100, W - 80, 64, 18);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = '600 15px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText('答案之外，找到走过这条路的人。', 64, H - 68);
    ctx.fillStyle = MUTED;
    ctx.font = '400 12px Inter, "Noto Sans SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Agent 分享语义，不分享原始数据', W - 64, H - 68);
    ctx.textAlign = 'left';

    return canvas;
  }

  function openSharePreview(canvas, filename, title) {
    const old = document.getElementById('modal-root');
    if (old) old.remove();
    const url = canvas.toDataURL('image/png');
    const file = filename || '知遇.同路人-SoulProfile.png';
    const el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.id = 'modal-root';
    el.innerHTML = `<div class="modal" style="max-width:420px;text-align:center">
      <h3 class="h3" style="margin-bottom:8px">${esc(title || '分享卡')}</h3>
      <p class="small muted" style="margin-bottom:14px">可保存到相册或分享到社交平台</p>
      <div style="border-radius:16px;overflow:hidden;border:1px solid var(--border);margin-bottom:16px;box-shadow:var(--shadow)">
        <img src="${url}" alt="分享卡" style="width:100%;display:block" />
      </div>
      <div class="action-row" style="margin-bottom:0;justify-content:center">
        <a class="btn btn-primary btn-sm" id="share-download" download="${file}" href="${url}">下载 PNG</a>
        <button class="btn btn-secondary btn-sm" id="share-copy">复制图片</button>
        <button class="btn btn-ghost btn-sm" id="modal-close">关闭</button>
      </div>
    </div>`;
    el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });
    document.body.appendChild(el);
    el.querySelector('#modal-close')?.addEventListener('click', () => el.remove());

    el.querySelector('#share-copy')?.addEventListener('click', async () => {
      try {
        const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        const toast = window.__tongToast || (() => {});
        toast('分享卡已复制到剪贴板');
      } catch {
        const toast = window.__tongToast || (() => {});
        toast('当前环境不支持复制，请改用下载');
      }
    });
  }

  async function drawMatchShareCard(opts) {
    const { name, stage, type, typeLabel, typeDesc, talk, icebreaker, topics = [] } = opts || {};
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    const colorMap = {
      same: '#0084FF',
      ahead: '#10B981',
      complement: '#F59E0B',
      different: '#8B5CF6',
    };
    const accent = colorMap[type] || '#0084FF';

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, 900, 1100);
    const g = ctx.createRadialGradient(700, 80, 10, 700, 80, 420);
    g.addColorStop(0, accent + '22');
    g.addColorStop(1, accent + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 900, 420);

    ctx.fillStyle = '#E2E8F0';
    for (let y = 20; y < 1100; y += 24) {
      for (let x = 20; x < 900; x += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // brand
    ctx.fillStyle = '#fff';
    roundedRect(ctx, 40, 36, 820, 72, 20);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.stroke();
    ctx.fillStyle = BLUE;
    roundedRect(ctx, 60, 52, 40, 40, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px Inter, "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('知', 80, 72);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = INK;
    ctx.font = '600 20px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText('知遇.同路人', 116, 70);
    ctx.fillStyle = MUTED;
    ctx.font = '400 13px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText('为什么你们值得认识 · 分享卡', 116, 92);

    // relation badge
    ctx.fillStyle = accent;
    roundedRect(ctx, 60, 150, 120, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 14px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText(typeLabel || '同路人', 78, 173);

    ctx.fillStyle = INK;
    ctx.font = '700 34px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText(name || '一位值得认识的人', 60, 240);
    ctx.fillStyle = MUTED;
    ctx.font = '400 16px Inter, "Noto Sans SC", sans-serif';
    wrapText(ctx, stage || '', 60, 274, 780, 24, 2);

    ctx.fillStyle = INK;
    ctx.font = '600 18px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText('你们最值得聊的是', 60, 360);
    ctx.fillStyle = '#fff';
    roundedRect(ctx, 60, 380, 780, 110, 18);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = '400 16px Inter, "Noto Sans SC", sans-serif';
    wrapText(ctx, talk || '', 84, 420, 730, 26, 3);

    ctx.fillStyle = INK;
    ctx.font = '600 18px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText('推荐破冰问题', 60, 560);
    ctx.fillStyle = '#FFF7E6';
    roundedRect(ctx, 60, 580, 780, 120, 18);
    ctx.fill();
    ctx.strokeStyle = '#FDE68A';
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = '400 16px Inter, "Noto Sans SC", sans-serif';
    wrapText(ctx, icebreaker || '', 84, 620, 730, 26, 3);

    if (topics.length) {
      ctx.fillStyle = MUTED;
      ctx.font = '400 13px Inter, "Noto Sans SC", sans-serif';
      ctx.fillText('共同关注', 60, 760);
      let tx = 60;
      topics.slice(0, 5).forEach((t) => {
        ctx.font = '500 14px Inter, "Noto Sans SC", sans-serif';
        const tw = ctx.measureText(t).width + 28;
        if (tx + tw > 840) return;
        ctx.fillStyle = '#fff';
        roundedRect(ctx, tx, 780, tw, 34, 17);
        ctx.fill();
        ctx.strokeStyle = BORDER;
        ctx.stroke();
        ctx.fillStyle = BLUE;
        ctx.fillText(t, tx + 14, 802);
        tx += tw + 10;
      });
    }

    ctx.fillStyle = '#fff';
    roundedRect(ctx, 40, 1000, 820, 64, 18);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = '600 15px Inter, "Noto Sans SC", sans-serif';
    ctx.fillText('答案之外，找到走过这条路的人。', 64, 1040);
    ctx.fillStyle = MUTED;
    ctx.font = '400 12px Inter, "Noto Sans SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(typeDesc || '连接价值来自轨迹与互补', 840, 1040);
    ctx.textAlign = 'left';

    return canvas;
  }

  async function exportMatchShareCard(data) {
    const toast = window.__tongToast || (() => {});
    toast('正在生成分享卡…');
    const canvas = await drawMatchShareCard(data);
    openSharePreview(canvas, '知遇.同路人-关系卡.png', '关系分享卡');
  }

  async function exportSoulShareCard() {
    const toast = window.__tongToast || (() => {});
    toast('正在生成分享卡…');
    const me = (window.TONG && window.TONG.ME) || {};
    const canvas = await drawShareCard(me);
    openSharePreview(canvas, '知遇.同路人-SoulProfile.png', 'Soul Profile 分享卡');
  }

  // bind when soul page mounts
  const mo = new MutationObserver(() => {
    const btn = document.getElementById('soul-share');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        exportSoulShareCard().catch(() => {
          (window.__tongToast || (()=>{}))('分享卡生成失败');
        });
      });
    }
    document.querySelectorAll('[data-share-match]').forEach((el) => {
      if (el.dataset.shareBound) return;
      el.dataset.shareBound = '1';
      el.addEventListener('click', () => {
        const uid = el.dataset.shareMatch;
        const TONG = window.TONG;
        const user = (TONG.USERS || []).find((u) => u.id === uid);
        let type = 'same';
        let reason = {};
        const session = TONG.store?.loadFindSession?.();
        if (session?.types?.[uid]) type = session.types[uid];
        if (session?.reasons?.[uid]) reason = session.reasons[uid];
        try {
          const cand = TONG.matching?.byId?.(uid);
          if (cand) {
            type = cand.type || type;
            reason = cand.reason || reason;
          }
        } catch (_) {}
        const rel = TONG.RELATIONS?.[type] || TONG.RELATIONS.same;
        exportMatchShareCard({
          name: user?.name || '值得认识的人',
          stage: user?.currentStage || '',
          type,
          typeLabel: rel.name,
          typeDesc: rel.desc,
          talk: reason.talk || reason.title || '',
          icebreaker: reason.icebreaker || '',
          topics: (user?.topics || []).slice(0, 4),
        }).catch(() => {
          (window.__tongToast || (()=>{}))('分享卡生成失败');
        });
      });
    });
  });
  mo.observe(document.getElementById('page-root') || document.body, { childList: true, subtree: true });

  window.TONG = window.TONG || {};
  window.TONG.exportSoulShareCard = exportSoulShareCard;
  window.TONG.exportMatchShareCard = exportMatchShareCard;
})();
