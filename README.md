# 知遇.同路人

基于知乎公开数据 + AI 的同路人匹配（OAuth 登录 → 用户数据快照 → AI 生成画像/匹配/擦肩 → Agent 互聊 → 真人接管）。

## 本地 / VPS / Hostinger（推荐 Node 一体化）

```bash
# 设置环境变量后
PORT=3000 node server-hostinger.mjs
```

详细步骤见 [docs/HOSTINGER.md](docs/HOSTINGER.md)。

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

## 部署到 Vercel（可选）

```bash
vercel deploy --prod
```

使用 `api/` 下的 Serverless Functions；环境变量同上。

## 结构

```
public/               前端
api/                  Vercel Serverless（可选）
server-hostinger.mjs  Hostinger/VPS 一体化 Node 服务
docs/HOSTINGER.md     Hostinger 部署说明
```

## 说明

- 仅用于黑客松/演示；遵守知乎开放平台协议与用户隐私要求。
- 密钥、Access Secret、OAuth Token 切勿提交到 Git。
