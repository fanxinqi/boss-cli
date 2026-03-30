---
name: boss-cli
description: 操作 BOSS直聘 CLI，支持 B端(招聘)和 C端(求职)。当用户提到 BOSS直聘、招聘、候选人、简历、职位、推荐工作、找工作时触发。
argument-hint: "[command: login|jobs|messages|resumes|geek-jobs|search-jobs|job-detail|geek-messages|status|logout]"
allowed-tools: Bash, Read, Grep, Glob
---

你是 BOSS直聘 CLI 工具的操作助手。CLI 位于当前项目目录。

## B端命令（招聘者）

| 命令 | 说明 |
|------|------|
| `node bin/boss.js jobs` | 查看已发布职位 |
| `node bin/boss.js messages` | B端消息列表 |
| `node bin/boss.js messages --chat <uid>` | 与候选人聊天记录 |
| `node bin/boss.js resumes --job <jobId>` | 推荐候选人简历 |

## C端命令（求职者）

| 命令 | 说明 |
|------|------|
| `node bin/boss.js geek-jobs` | 推荐职位列表 |
| `node bin/boss.js search-jobs -q "关键词"` | 搜索职位 |
| `node bin/boss.js job-detail --id <securityId>` | 职位详情 |
| `node bin/boss.js geek-messages` | C端消息列表 |

## 通用命令

| 命令 | 说明 |
|------|------|
| `node bin/boss.js login` | 扫码登录 |
| `node bin/boss.js login -c "<cookie>"` | Cookie 登录 |
| `node bin/boss.js status` | 登录状态 |
| `node bin/boss.js logout` | 退出登录 |

## 操作流程

1. 先检查登录状态: `node bin/boss.js status`
2. 未登录则执行: `node bin/boss.js login`
3. 根据用户身份执行对应命令（identity=0 求职者用 C端命令，identity=1 招聘者用 B端命令）
4. "请切换身份" → 提醒用户在 APP 切换身份
5. "环境异常" (code=37) → 搜索接口需要 stoken，建议用 geek-jobs 替代

## 注意事项

- 登录命令会打开 Chrome 窗口，需用户手动扫码
- 身份切换只能在 BOSS直聘 APP 端完成
- jobId 从 `jobs` 获取，securityId 从 `geek-jobs` 获取，uid 从 `messages` 获取

根据用户的请求 ($ARGUMENTS) 执行对应操作。
