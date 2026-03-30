# boss-cli

BOSS直聘 CLI 工具，支持 B端（招聘者）和 C端（求职者）双模式。

## 构建与运行

- 安装依赖: `npm install`
- 全局注册: `npm link`
- 运行: `node bin/boss.js <command>` 或 `boss <command>`

## 代码规范

- ESM 模块 (`"type": "module"`)
- 使用 `import/export`，不用 CommonJS
- 所有 API 端点定义在 `lib/constants.js`
- HTTP 请求通过 `lib/client.js`，浏览器请求通过 `lib/browser.js`
- 统一 API 入口在 `lib/api.js`（HTTP 优先，code=37 回退浏览器）
- B端功能在 `lib/messages.js` + `lib/resume.js`
- C端功能在 `lib/geek.js`

## 架构要点

- 登录依赖 Puppeteer 有头模式打开 Chrome，用户扫码后提取 cookie
- 反检测脚本在 `lib/browser.js` 的 `getAntiDetectionScript()` 函数中
- Cookie 持久化在 `~/.boss-cli/cookies.json`
- BOSS直聘身份切换只能在 APP 端完成，Web 端无此 API
- `__zp_stoken__` 是 JS 端生成的反爬 cookie，搜索接口需要它，推荐接口不需要
- API 策略：HTTP 直连 → 成功返回 / code=37 → 无头浏览器重试

## 常见问题

- "请切换身份后再试" → 用户需在 APP 切换到招聘者身份后重新登录
- "环境异常" (code=37) → 缺少 `__zp_stoken__`，会自动尝试浏览器回退
- Chrome 启动失败 → 检查 Chrome 路径，或用 `--chrome-path` 指定
