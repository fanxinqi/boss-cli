# boss-cli

BOSS直聘 CLI 工具，支持 **B端（招聘者）** 和 **C端（求职者）** 双模式，基于 Puppeteer 无头浏览器实现，内置反检测绕过。

## 功能

**B端（招聘者）：**
- 查看已发布的职位
- 查看候选人消息列表、聊天记录
- 按职位查看推荐候选人简历

**C端（求职者）：**
- 查看推荐职位
- 搜索职位
- 查看职位详情
- 查看求职消息列表

**通用：**
- 扫码登录 — 自动打开 Chrome，扫码后提取完整 cookie
- 手动 Cookie 登录
- 身份自动检测（求职者/招聘者）

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

> **B端用户注意：** 请先在 BOSS直聘 APP 中切换到「招聘者」身份（我的 → 设置 → 切换身份），再扫码登录。

### B端命令（招聘者）

```bash
# 查看已发布的职位
boss jobs

# 查看候选人消息列表
boss messages
boss messages --page 2

# 查看与某候选人的聊天记录
boss messages --chat <uid>

# 查看某职位下推荐的候选人简历（jobId 从 boss jobs 获取）
boss resumes --job <jobId>
boss resumes --job <jobId> --page 2
```

### C端命令（求职者）

```bash
# 查看推荐职位
boss geek-jobs
boss geek-jobs --page 2

# 搜索职位（需要 __zp_stoken__，失败时会自动尝试浏览器模式）
boss search-jobs --query "前端开发"
boss search-jobs --query "Java" --city 101010100 --page 2

# 查看职位详情（securityId 从 geek-jobs 输出中获取）
boss job-detail --id <securityId>

# 查看求职者消息列表
boss geek-messages
```

### 其他

```bash
boss status   # 查看登录状态
boss logout   # 退出登录
boss --help   # 查看帮助
```

## 城市代码

搜索职位时可指定城市代码，常用城市：

| 城市 | 代码 |
|------|------|
| 北京 | 101010100 |
| 上海 | 101020100 |
| 广州 | 101280100 |
| 深圳 | 101280600 |
| 杭州 | 101210100 |
| 成都 | 101270100 |

## 技术架构

```
bin/boss.js        CLI 入口 (Commander.js)
lib/
├── browser.js     Puppeteer + 反检测脚本（绕过 disable-devtool）
├── auth.js        扫码登录 / Cookie 登录 / 身份校验
├── api.js         统一 API 层（HTTP 优先，code=37 自动回退浏览器）
├── client.js      HTTP 请求客户端
├── config.js      Cookie 持久化 (~/.boss-cli/)
├── constants.js   API 端点常量
├── messages.js    B端消息列表 / 聊天记录
├── resume.js      B端职位列表 / 推荐简历
└── geek.js        C端推荐职位 / 搜索 / 详情 / 消息
```

### 反检测方案

BOSS直聘使用 [disable-devtool](https://github.com/theajack/disable-devtool) 检测自动化工具，本项目通过 `evaluateOnNewDocument` 在页面加载前注入绕过脚本：

1. Hook `console.table` → 消除时间差检测
2. Hook `performance.now` → 返回递增伪值
3. 劫持 `Function.prototype.toString` → 伪装原生函数签名
4. Proxy `iframe.contentWindow` → 防止沙箱绕过检测
5. 移除 `navigator.webdriver` 标记

### API 请求策略

```
请求 → HTTP 直连（快） → 成功则返回
                        → code=37（环境异常）→ 启动无头浏览器重试（带 __zp_stoken__）
```

大部分接口（推荐职位、消息、职位列表）通过 HTTP 直连即可，搜索接口需要 `__zp_stoken__` 会自动回退到浏览器模式。

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
