/* 刘看山 · 多动作跟随宠物（透明底，融进页面） */
(function () {
  const pet = document.getElementById('cursor-pet');
  if (!pet) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(max-width: 720px)').matches) return;

  const imgEl = pet.querySelector('img');
  const bubble = document.getElementById('pet-bubble');
  const size = 72;
  const offsetX = 20;
  const offsetY = 24;

  // 六套动作：1 待机 2 走路 3 小跑 4 张望 5 开心 6 坐下/安静
  const ACTS = {
    idle: './assets/pet-act-1.webp',
    walk: './assets/pet-act-2.webp',
    run: './assets/pet-act-3.webp',
    look: './assets/pet-act-4.webp',
    happy: './assets/pet-act-5.webp',
    calm: './assets/pet-act-6.webp',
  };
  let currentAct = 'idle';

  function setAct(name) {
    if (!imgEl || currentAct === name || !ACTS[name]) return;
    currentAct = name;
    // 强制重载 gif 以重新播放
    imgEl.src = ACTS[name];
  }

  let targetX = -200;
  let targetY = -200;
  let x = -200;
  let y = -200;
  let lastMove = performance.now();
  let speed = 0;
  let facing = 1;
  let visible = false;
  let speakTimer = null;
  let lastSpeak = 0;

  const lines = [
    '我在跟着你～',
    '要不要找同路人？',
    '轨迹交集真有意思',
    'Agent 先认识，人再认识',
    '答案之外还有人',
    '这页还挺好看',
  ];

  function speak(text) {
    if (!bubble) return;
    bubble.textContent = text || lines[Math.floor(Math.random() * lines.length)];
    pet.classList.add('speak');
    clearTimeout(speakTimer);
    speakTimer = setTimeout(() => pet.classList.remove('speak'), 2000);
  }

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX + offsetX;
    targetY = e.clientY + offsetY;
    lastMove = performance.now();
    if (!visible) {
      visible = true;
      pet.classList.remove('is-away');
      x = targetX;
      y = targetY;
    }
  }, { passive: true });

  window.addEventListener('mousedown', () => {
    pet.classList.add('is-down');
    setAct('happy');
    if (performance.now() - lastSpeak > 2500) {
      speak();
      lastSpeak = performance.now();
    }
  });
  window.addEventListener('mouseup', () => pet.classList.remove('is-down'));

  document.addEventListener('mouseleave', () => {
    visible = false;
    pet.classList.add('is-away');
  });
  document.addEventListener('mouseenter', () => {
    visible = true;
    pet.classList.remove('is-away');
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('a,button,input,textarea,label')) return;
    if (Math.random() > 0.5) {
      setAct('look');
      speak();
    }
  }, true);

  // 根据速度切换动作
  function updateActByMotion() {
    const now = performance.now();
    const idleFor = now - lastMove;
    if (speed > 6) setAct('run');
    else if (speed > 1.4) setAct('walk');
    else if (idleFor > 2800) setAct('calm');
    else if (idleFor > 900) setAct('look');
    else setAct('idle');
  }

  // 偶尔自言自语
  setInterval(() => {
    if (!visible) return;
    if (performance.now() - lastMove < 4000) return;
    if (Math.random() > 0.65) speak();
  }, 16000);

  function tick() {
    const dx = targetX - x;
    const dy = targetY - y;
    const nx = x + dx * 0.15;
    const ny = y + dy * 0.17;
    speed = Math.hypot(nx - x, ny - y);
    x = nx;
    y = ny;

    if (Math.abs(dx) > 1.2) facing = dx >= 0 ? 1 : -1;

    pet.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (imgEl) imgEl.style.transform = `scaleX(${facing})`;

    updateActByMotion();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  setTimeout(() => speak('我是看山小跟班'), 900);
  setTimeout(() => setAct('look'), 1200);
})();
