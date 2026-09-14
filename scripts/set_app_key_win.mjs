/**
 * Windows：将 app_key 写入用户目录本地文件（勿提交仓库）。
 * 生产请用部署平台 Secret；macOS 仍用官方 set_app_key.mjs。
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline';

function projectDirFromArgs() {
  const i = process.argv.indexOf('--project-dir');
  return i >= 0 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : null;
}

const projectDir = projectDirFromArgs();
if (!projectDir) {
  console.log(JSON.stringify({ ok: false, error: 'Required: --project-dir.' }));
  process.exit(1);
}
const config = JSON.parse(await readFile(path.join(projectDir, 'hackathon.config.json'), 'utf8'));
if (config.oauth?.enabled !== true) {
  console.log(JSON.stringify({ ok: false, error: 'OAuth is disabled for this project.' }));
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
const ask = (q) => new Promise((r) => rl.question(q, r));
const k1 = await ask('Enter Zhihu OAuth app_key (hidden not supported, do not share screen): ');
const k2 = await ask('Confirm app_key: ');
rl.close();
if (!k1 || k1 !== k2) {
  console.log(JSON.stringify({ ok: false, error: 'app_key empty or mismatch' }));
  process.exit(1);
}

const dir = path.join(homedir(), '.zhihu-hackathon');
await mkdir(dir, { recursive: true });
const file = path.join(dir, `${config.projectSlug}.app_key.json`);
await writeFile(file, JSON.stringify({ appId: config.oauth.appId, appKey: k1, savedAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ ok: true, configured: true, storage: 'user-home-file', file }));
console.log('启动时请设置环境变量 ZHIHU_OAUTH_APP_KEY（不要写入源码）。');
