# boss-cli

BOSS直聘 B端 CLI 工具，用于招聘者通过命令行管理职位、消息和简历。

## 构建与运行

- 安装依赖: `npm install`
- 全局注册: `npm link`
- 运行: `node bin/boss.js <command>` 或 `boss <command>`

## 代码规范

- ESM 模块 (`"type": "module"`)
- 使用 `import/export`，不用 CommonJS
- 所有 API 端点定义在 `lib/constants.js`
- HTTP 请求通过 `lib/client.js`，浏览器请求通过 `lib/browser.js`
- 统一 API 入口在 `lib/api.js`（浏览器优先，HTTP 回退）

## 架构要点

- 登录依赖 Puppeteer 有头模式打开 Chrome，用户扫码后提取 cookie
- 反检测脚本在 `lib/browser.js` 的 `getAntiDetectionScript()` 函数中
- Cookie 持久化在 `~/.boss-cli/cookies.json`
- BOSS直聘身份切换只能在 APP 端完成，Web 端无此 API
- `__zp_stoken__` 是 JS 端生成的反爬 cookie，通过浏览器渲染页面自动获取

## 常见问题

- "请切换身份后再试" → 用户需在 APP 切换到招聘者身份后重新登录
- `__zp_stoken__` 未获取 → 不影响大部分 B 端接口
- Chrome 启动失败 → 检查 Chrome 路径，或用 `--chrome-path` 指定
