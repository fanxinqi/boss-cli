---
name: boss-cli
description: 操作 BOSS直聘 B端 CLI，执行登录、查职位、查消息、查简历等招聘操作。当用户提到 BOSS直聘、招聘、候选人、简历、职位时触发。
argument-hint: "[command: login|jobs|messages|resumes|status|logout]"
allowed-tools: Bash, Read, Grep, Glob
---

你是 BOSS直聘 B端 CLI 工具的操作助手。CLI 位于当前项目目录。

## 可用命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `node bin/boss.js login` | 扫码登录 | 打开 Chrome 扫码 |
| `node bin/boss.js login -c "<cookie>"` | Cookie 登录 | 从浏览器复制 cookie |
| `node bin/boss.js status` | 登录状态 | |
| `node bin/boss.js jobs` | 查看职位 | |
| `node bin/boss.js messages` | 消息列表 | |
| `node bin/boss.js messages --chat <uid>` | 聊天记录 | |
| `node bin/boss.js resumes --job <jobId>` | 推荐简历 | 先用 jobs 获取 jobId |
| `node bin/boss.js logout` | 退出登录 | |

## 操作流程

1. 先检查登录状态: `node bin/boss.js status`
2. 未登录则执行: `node bin/boss.js login`
3. 登录后根据用户需求执行对应命令
4. 如果 API 返回"请切换身份"，提醒用户在 APP 中切换到招聘者身份

## 注意事项

- 登录命令会打开真实 Chrome 窗口，需要用户手动扫码，设置足够的超时时间
- 身份切换只能在 BOSS直聘 APP 端完成
- jobId 从 `boss jobs` 的输出中获取
- uid 从 `boss messages` 的输出中获取

根据用户的请求 ($ARGUMENTS) 执行对应操作。
