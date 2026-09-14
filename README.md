# 知遇.同路人

基于知乎公开数据 + AI 的同路人匹配 Demo（OAuth 登录 → 用户数据快照 → AI 生成画像/匹配/擦肩 → Agent 互聊 → 真人接管）。

## 本地运行

```bash
# 仅静态预览（演示能力有限）
python -m http.server 4173
# 或 Node
npm start
```

推荐使用 Vercel Serverless API（见 `api/`），密钥放在环境变量，不要写进仓库。

## 环境变量

| 变量 | 说明 |
|------|------|
| `ZHIHU_OAUTH_APP_ID` | 知乎开放平台 App ID |
| `ZHIHU_OAUTH_APP_KEY` | OAuth App Key（仅服务端） |
| `ZHIHU_OAUTH_REDIRECT_URI` | 公网 HTTPS 回调，须与开放平台登记一致 |
| `ZHIHU_ACCESS_SECRET` | 开放平台 Access Secret（仅服务端） |
| `LLM_API_KEY` | OpenAI 兼容 API Key |
| `LLM_BASE_URL` | 默认 `https://api.openai-next.com/v1` |
| `LLM_MODEL` | 默认 `deepseek-v4-pro` |
| `SESSION_SECRET` | 会话 Cookie 签名密钥 |

## 部署（Vercel）

```bash
npm i -g vercel
vercel deploy --prod
```

在 Vercel 项目设置中配置上表环境变量；回调地址示例：

`https://<你的域名>/auth/callback`

## 结构

```
public/     前端静态资源与主应用
api/        Serverless：OAuth / 用户快照 / LLM / 知乎搜索
lib/        本地 Node 开发用 OAuth 库（可选）
```

## 说明

- 仅用于黑客松/演示；请遵守知乎开放平台协议与用户隐私要求。
- 密钥、Access Secret、OAuth Token 切勿提交到 Git。
