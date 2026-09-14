# Cloudflare Pages 部署

目标：静态前端 `public/` + Pages Functions `functions/`，密钥全部放 Cloudflare 环境变量。

## 方式 A：Wrangler CLI（推荐）

```bash
npm i -g wrangler
wrangler login
# 在项目根目录
npx wrangler pages deploy public --project-name zhiyu-tongluren
```

## 方式 B：Git 连接 Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git  
2. 选仓库 `https://github.com/syjiaaaan/-`  
3. 构建设置：
   - Framework: None  
   - Build command: 空  
   - Build output: `public`  
4. Functions 会自动识别仓库根目录下的 `functions/`

## 必须配置的环境变量

Dashboard → Pages 项目 → Settings → Environment variables（Production 与 Preview）

```text
ZHIHU_OAUTH_APP_ID=645
ZHIHU_OAUTH_APP_KEY=你的AppKey
ZHIHU_OAUTH_REDIRECT_URI=https://<你的pages域名>/auth/callback
ZHIHU_ACCESS_SECRET=你的AccessSecret
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai-next.com/v1
LLM_MODEL=deepseek-v4-pro
SESSION_SECRET=随机长字符串
```

## 知乎开放平台回调

登记为：

```text
https://<你的pages域名>/auth/callback
```

与 `ZHIHU_OAUTH_REDIRECT_URI` **完全一致**。

## 验证

- `https://<域名>/` 登录页  
- `https://<域名>/api/health` JSON  
- 授权后进入 `/app.html`  

## 国内访问说明

- `*.pages.dev` 可能仍不稳；**强烈建议绑定自定义域名**  
- 绑定域名后，可达性通常优于 `*.vercel.app`  
- OAuth/LLM 仍依赖 Cloudflare 与上游 API 的连通性  

## 与 Vercel 的关系

- 同一套前端 `public/`  
- API 从 `api/*.js`（Vercel）改为 `functions/**/*.js`（Pages）  
- 两套可并存：Vercel 继续用旧配置，Pages 用本目录 Functions  
