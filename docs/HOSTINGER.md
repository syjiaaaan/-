# Hostinger 部署（Node.js）

适用于 Hostinger **Node.js 应用** 或 **VPS**。核心是运行 `server-hostinger.mjs`（静态站 + OAuth + LLM + 知乎搜索，无需 Vercel）。

## 1. 上传代码

任选其一：

- Git：把本仓库推到 GitHub，再在 hPanel 里 Git 部署  
- SFTP：上传整个 `zhihu-oauth-demo` 目录（可去掉 `.git`、`node_modules`）

## 2. 创建 Node 应用

hPanel → **网站 / Node.js** → Create Application：

| 项 | 值 |
|----|-----|
| Node 版本 | 18 或更高 |
| Application root | 仓库根目录（含 `package.json`） |
| Application startup file | `server-hostinger.mjs` |
| Application port | 按面板提示（常见 3000） |

命令行/VPS 示例：

```bash
cd /path/to/zhihu-oauth-demo
# 无需安装依赖（仅用 Node 内置模块）
PORT=3000 HOST=0.0.0.0 node server-hostinger.mjs
```

## 3. 环境变量（必须）

在 hPanel **Environment variables** 或 `.env`/进程环境中配置：

```text
ZHIHU_OAUTH_APP_ID=645
ZHIHU_OAUTH_APP_KEY=你的AppKey
ZHIHU_OAUTH_REDIRECT_URI=https://你的域名/auth/callback
ZHIHU_ACCESS_SECRET=你的AccessSecret
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai-next.com/v1
LLM_MODEL=deepseek-v4-pro
SESSION_SECRET=请改成随机长字符串
```

**不要**把这些写进代码或提交到 GitHub。

## 4. 域名与 HTTPS

1. 把域名解析到 Hostinger  
2. 开启 **SSL（Let’s Encrypt）**  
3. 回调地址必须是：`https://你的域名/auth/callback`  
4. 到知乎开放平台把**同一个**回调地址登记到 App ID `645`

## 5. 验证

- `https://你的域名/` 应打开登录页  
- `https://你的域名/api/health` 应返回 JSON  
- 授权后进入 `/app.html`，可生成全站内容  

## 6. 与 Vercel 的差异

| | Vercel | Hostinger Node |
|--|--------|----------------|
| 入口 | `api/*.js` 函数 | `server-hostinger.mjs` 单进程 |
| 静态资源 | `public/` 自动 | 同一进程直接托管 |
| 密钥 | 项目环境变量 | hPanel 环境变量 / VPS `.env` |

## 常见问题

- **授权页「出错了」**：回调域名/路径/协议与开放平台登记不一致  
- **Authorization failed**：Access Secret 错误或缺 `X-Request-Timestamp`（本服务已带）  
- **Cookie 无效**：必须 HTTPS，且 `SESSION_SECRET` 固定不变  
- **端口连不上**：面板里的 Application port 与 `PORT` 保持一致，并让反代指向该端口  
