# boss-cli

BOSS直聘 B端（招聘者）命令行工具，基于 Puppeteer 无头浏览器实现，内置反检测绕过。

## 功能

- **扫码登录** — 自动打开 Chrome，扫码后提取完整 cookie（含 `__zp_stoken__`）
- **查看职位** — 列出已发布的职位
- **查看消息** — 候选人消息列表、聊天记录
- **查看简历** — 按职位查看推荐候选人

## 安装

```bash
npm install
npm link  # 全局注册 boss 命令
```

需要本地安装 Chrome 浏览器。

## 使用

### 登录

```bash
# 扫码登录（推荐，自动启动 Chrome）
boss login

# 手动 cookie 登录（从浏览器 F12 复制）
boss login --cookie "wt2=xxx; wbg=xxx; zp_at=xxx"

# 指定 Chrome 路径
boss login --chrome-path /path/to/chrome
```

> **注意：** 请先在 BOSS直聘 APP 中切换到「招聘者」身份（我的 → 设置 → 切换身份），再扫码登录。

### 查看职位

```bash
boss jobs
```

### 查看消息

```bash
# 消息列表
boss messages
boss messages --page 2

# 与某候选人的聊天记录
boss messages --chat <uid>
```

### 查看推荐简历

```bash
# 先通过 boss jobs 获取 jobId
boss resumes --job <jobId>
boss resumes --job <jobId> --page 2
```

### 其他

```bash
boss status   # 查看登录状态
boss logout   # 退出登录
boss --help   # 查看帮助
```

## 技术架构

```
bin/boss.js        CLI 入口 (Commander.js)
lib/
├── browser.js     Puppeteer + 反检测脚本（绕过 disable-devtool）
├── auth.js        扫码登录 / Cookie 登录 / 身份校验
├── api.js         统一 API 层（浏览器优先，HTTP 回退）
├── client.js      HTTP 请求客户端
├── config.js      Cookie 持久化 (~/.boss-cli/)
├── constants.js   API 端点常量
├── messages.js    消息列表 / 聊天记录
└── resume.js      职位列表 / 推荐简历
```

### 反检测方案

BOSS直聘使用 [disable-devtool](https://github.com/theajack/disable-devtool) 检测自动化工具，本项目通过 `evaluateOnNewDocument` 在页面加载前注入绕过脚本：

1. Hook `console.table` → 消除时间差检测
2. Hook `performance.now` → 返回递增伪值
3. 劫持 `Function.prototype.toString` → 伪装原生函数签名
4. Proxy `iframe.contentWindow` → 防止沙箱绕过检测
5. 移除 `navigator.webdriver` 标记

### 数据存储

```
~/.boss-cli/
├── cookies.json     登录态 cookie
└── chrome-data/     Chrome 用户数据（会话持久化）
```

## 依赖

| 包 | 用途 |
|---|------|
| puppeteer-core | 无头浏览器控制 |
| commander | CLI 参数解析 |
| chalk | 终端着色 |
| cli-table3 | 表格输出 |
| ora | 加载动画 |
| dayjs | 时间格式化 |
