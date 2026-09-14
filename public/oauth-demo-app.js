const $ = (selector) => document.querySelector(selector);
const elements = {
  runtime: $('#runtime'), status: $('#status'), name: $('#name'), headline: $('#headline'), avatar: $('#avatar'),
  avatarPlaceholder: $('#avatar-placeholder'), appId: $('#app-id'), redirectUri: $('#redirect-uri'), message: $('#message'),
  login: $('#login'), refresh: $('#refresh'), logout: $('#logout'), results: $('#results'), summary: $('#summary'), grid: $('#grid'),
};

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json' } });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) throw new Error(payload.error?.message || '请求失败');
  return payload;
}

function card(definition) {
  let node = document.querySelector(`[data-id="${definition.id}"]`);
  if (node) return node;
  if (!elements.grid) return null;
  node = document.createElement('article');
  node.dataset.id = definition.id;
  node.innerHTML = `<div><span>OAuth 用户数据</span><b class="state">未运行</b></div><h3></h3><code></code><div class="preview">授权后自动请求一条数据</div>`;
  node.querySelector('h3').textContent = definition.name;
  node.querySelector('code').textContent = definition.endpoint;
  elements.grid.append(node);
  return node;
}

function renderResult(result) {
  const node = card(result);
  if (!node) return;
  const state = node.querySelector('.state');
  const preview = node.querySelector('.preview');
  state.textContent = result.status === 'success' ? '成功' : result.status === 'empty' ? '空数据' : '失败';
  state.className = `state ${result.status}`;
  preview.replaceChildren();
  if (result.status === 'success') {
    const strong = document.createElement('strong');
    strong.textContent = result.item?.Title || result.item?.Fullname || result.item?.Description || '已返回结构化数据';
    const details = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = '查看第一条 JSON';
    const pre = document.createElement('pre'); pre.textContent = JSON.stringify(result.item, null, 2);
    details.append(summary, pre); preview.append(strong, details);
  } else preview.textContent = result.message || '没有可展示的数据';
}

async function runAll() {
  if (!elements.summary) return;
  elements.summary.textContent = '正在请求';
  try {
    const payload = await api('/api/oauth/run-all', { method: 'POST', body: '{}' });
    (payload.results || []).forEach(renderResult);
    const count = (status) => (payload.results || []).filter((result) => result.status === status).length;
    elements.summary.textContent = `${count('success')} 成功 · ${count('empty')} 空数据 · ${count('error')} 失败`;
  } catch (error) { elements.summary.textContent = error.message; }
}

async function load() {
  try {
    const data = await api('/api/oauth/status');
    if (elements.runtime) {
      elements.runtime.textContent = !data.callbackConfigured
        ? '等待部署配置'
        : data.configured ? '登录环境已就绪' : '需要配置平台密钥';
    }
    if (elements.appId) elements.appId.textContent = data.appId;
    if (elements.redirectUri) elements.redirectUri.textContent = data.redirectUri || '部署后配置';
    (data.interfaces || []).forEach(card);
    if (!data.authorized) {
      if (elements.status) elements.status.textContent = data.error ? '授权失败' : '未授权';
      if (elements.message) elements.message.textContent = data.error?.message || '点击按钮后前往知乎完成授权。';
      if (elements.login) { elements.login.disabled = !data.callbackConfigured; elements.login.hidden = false; }
      if (elements.refresh) elements.refresh.hidden = true;
      if (elements.logout) elements.logout.hidden = true;
      if (elements.results) elements.results.hidden = true;
      return;
    }
    if (elements.status) elements.status.textContent = '已授权';
    if (elements.name) elements.name.textContent = data.profile?.name || '已授权知乎账号';
    if (elements.headline) elements.headline.textContent = data.profile?.headline || '';
    if (data.profile?.avatarUrl && elements.avatar && elements.avatarPlaceholder) {
      elements.avatar.src = data.profile.avatarUrl;
      elements.avatar.hidden = false;
      elements.avatarPlaceholder.hidden = true;
    }
    if (elements.message) elements.message.textContent = '完整账号信息请到主站「我的知乎」查看。';
    if (elements.login) elements.login.hidden = true;
    if (elements.refresh) elements.refresh.hidden = false;
    if (elements.logout) elements.logout.hidden = false;
    if (elements.results) elements.results.hidden = false;
    await runAll();
  } catch (error) {
    if (elements.runtime) elements.runtime.textContent = '环境检查失败';
    if (elements.message) elements.message.textContent = error.message;
  }
}

if (elements.login) elements.login.addEventListener('click', () => window.location.assign('/api/oauth/start'));
if (elements.refresh) elements.refresh.addEventListener('click', runAll);
if (elements.logout) elements.logout.addEventListener('click', async () => {
  await api('/api/oauth/logout', { method: 'POST', body: '{}' });
  window.location.assign('/');
});
load();
