/* 站点微交互：磁吸按钮、成功光效、快捷键 */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- magnetic buttons ---------- */
  function bindMagnetic() {
    if (reduced) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const els = document.querySelectorAll('.btn-primary, .btn-secondary, .nav-demo-btn');
    els.forEach((el) => {
      if (el.dataset.magBound) return;
      el.dataset.magBound = '1';
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------- success burst ---------- */
  function burst(x, y, color = '#10B981') {
    if (reduced) return;
    const wrap = document.createElement('div');
    wrap.className = 'fx-burst';
    wrap.style.left = '0';
    wrap.style.top = '0';
    wrap.innerHTML = `<div class="ring"></div><div class="ring"></div><div class="ring"></div>`;
    // center rings on point
    wrap.querySelectorAll('.ring').forEach((ring) => {
      ring.style.left = `${x - 12}px`;
      ring.style.top = `${y - 12}px`;
      ring.style.position = 'fixed';
    });
    const n = 12;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'fx-particle';
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.3;
      const dist = 48 + Math.random() * 42;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.position = 'fixed';
      p.style.background = i % 3 === 0 ? '#0084FF' : color;
      p.style.setProperty('--tx', `${Math.cos(ang) * dist}px`);
      p.style.setProperty('--ty', `${Math.sin(ang) * dist}px`);
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 1000);
  }

  function burstFromEl(el, color) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, color);
  }

  /* ---------- toast polish (reuse if missing) ---------- */
  function ensureToast() {
    if (window.__tongToast) return window.__tongToast;
    window.__tongToast = function (msg) {
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
    };
    return window.__tongToast;
  }

  /* ---------- keyboard shortcuts ---------- */
  function bindKeys() {
    window.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'd') {
        e.preventDefault();
        location.hash = '#/demo';
      } else if (k === 'f') {
        e.preventDefault();
        location.hash = '#/find';
      } else if (k === 'e') {
        e.preventDefault();
        location.hash = '#/encounter';
      } else if (k === 'm') {
        e.preventDefault();
        location.hash = '#/map';
      } else if (k === 's') {
        e.preventDefault();
        location.hash = '#/soul';
      } else if (k === '?') {
        e.preventDefault();
        showShortcutHelp();
      }
    });
  }

  function showShortcutHelp() {
    const old = document.getElementById('modal-root');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.id = 'modal-root';
    el.innerHTML = `<div class="modal">
      <h3 class="h3" style="margin-bottom:12px">键盘快捷键</h3>
      <ul style="padding-left:18px;color:var(--ink-2);font-size:14px;line-height:2">
        <li><kbd>F</kbd> 找同路人</li>
        <li><kbd>E</kbd> 今日擦肩</li>
        <li><kbd>M</kbd> 同行地图</li>
        <li><kbd>S</kbd> Soul Profile</li>
        <li><kbd>D</kbd> Demo 模式</li>
        <li><kbd>?</kbd> 打开本帮助</li>
      </ul>
      <div class="action-row" style="margin-bottom:0">
        <button class="btn btn-secondary btn-sm" id="modal-close">知道了</button>
      </div>
    </div>`;
    el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });
    document.body.appendChild(el);
    el.querySelector('#modal-close')?.addEventListener('click', () => el.remove());
  }

  /* ---------- intercept connect / find success ---------- */
  function bindSuccessHooks() {
    document.addEventListener('click', (e) => {
      const connect = e.target.closest('[data-connect]');
      if (connect) {
        burstFromEl(connect, '#10B981');
      }
      const startFind = e.target.closest('#btn-start-find');
      if (startFind) {
        // soft pulse only; real burst when result shows via MutationObserver
      }
    }, true);

    // when find result appears
    const obs = new MutationObserver(() => {
      const result = document.getElementById('find-result');
      if (result && result.style.display !== 'none' && result.innerHTML.trim() && !result.dataset.burst) {
        result.dataset.burst = '1';
        const r = result.getBoundingClientRect();
        burst(r.left + r.width / 2, Math.max(80, r.top + 40), '#0084FF');
      }
    });
    obs.observe(document.getElementById('page-root') || document.body, { childList: true, subtree: true, attributes: true });
  }

  /* ---------- rebind after route change ---------- */
  const mo = new MutationObserver(() => {
    bindMagnetic();
  });
  mo.observe(document.getElementById('page-root') || document.body, { childList: true, subtree: true });

  /* ---------- hint on home ---------- */
  function injectHint() {
    const homeActions = document.querySelector('.hero-actions');
    if (homeActions && !homeActions.parentElement.querySelector('.kbd-hint')) {
      const hint = document.createElement('div');
      hint.className = 'kbd-hint';
      hint.innerHTML = `<kbd>F</kbd> 找同路人 · <kbd>D</kbd> Demo · <kbd>?</kbd> 快捷键`;
      homeActions.insertAdjacentElement('afterend', hint);
    }
  }

  const hintObs = new MutationObserver(() => injectHint());
  hintObs.observe(document.getElementById('page-root') || document.body, { childList: true, subtree: true });

  ensureToast();
  bindKeys();
  bindSuccessHooks();
  bindMagnetic();
  injectHint();
})();
