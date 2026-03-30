#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { login, loginWithCookie, logout, isLoggedIn } from '../lib/auth.js';
import { listMessages, chatHistory } from '../lib/messages.js';
import { listJobs, listResumes } from '../lib/resume.js';
import { recommendJobs, searchJobs, jobDetail, geekMessages } from '../lib/geek.js';
import { cleanup } from '../lib/api.js';

const program = new Command();

program
  .name('boss')
  .description('BOSS直聘 CLI 工具 — 支持 B端(招聘) + C端(求职)')
  .version('1.0.0');

// ---- Login ----
program
  .command('login')
  .description('打开浏览器扫码登录 BOSS直聘')
  .option('-c, --cookie <cookie>', '手动设置 cookie 字符串')
  .option('--chrome-path <path>', '指定 Chrome 可执行文件路径')
  .action(async (opts) => {
    try {
      if (opts.cookie) {
        await loginWithCookie(opts.cookie);
      } else {
        await login({ chromePath: opts.chromePath });
      }
    } catch (err) {
      console.error(chalk.red(`登录失败: ${err.message}`));
      process.exit(1);
    }
  });

// ---- Logout ----
program
  .command('logout')
  .description('退出登录，清除 cookie 和浏览器数据')
  .action(async () => {
    await logout();
  });

// ---- Status ----
program
  .command('status')
  .description('查看登录状态')
  .action(() => {
    if (isLoggedIn()) {
      console.log(chalk.green('✓ 已登录'));
    } else {
      console.log(chalk.red('✗ 未登录'));
    }
  });

// ---- Messages ----
program
  .command('messages')
  .description('查看消息列表')
  .option('-p, --page <page>', '页码', '1')
  .option('--chat <uid>', '查看与指定用户的聊天记录')
  .action(async (opts) => {
    try {
      if (opts.chat) {
        await chatHistory({ uid: opts.chat, page: parseInt(opts.page) });
      } else {
        await listMessages({ page: parseInt(opts.page) });
      }
    } catch (err) {
      console.error(chalk.red(`获取消息失败: ${err.message}`));
    } finally {
      await cleanup();
    }
  });

// ---- Jobs ----
program
  .command('jobs')
  .description('查看已发布的职位列表')
  .action(async () => {
    try {
      await listJobs();
    } catch (err) {
      console.error(chalk.red(`获取职位失败: ${err.message}`));
    } finally {
      await cleanup();
    }
  });

// ---- Resumes ----
program
  .command('resumes')
  .description('查看推荐的候选人简历')
  .option('-j, --job <jobId>', '职位 ID (加密)')
  .option('-p, --page <page>', '页码', '1')
  .action(async (opts) => {
    try {
      await listResumes({ jobId: opts.job, page: parseInt(opts.page) });
    } catch (err) {
      console.error(chalk.red(`获取简历失败: ${err.message}`));
    } finally {
      await cleanup();
    }
  });

// ===== C端 (求职者) =====

// ---- 推荐职位 ----
program
  .command('geek-jobs')
  .description('[C端] 查看推荐职位')
  .option('-p, --page <page>', '页码', '1')
  .action(async (opts) => {
    try {
      await recommendJobs({ page: parseInt(opts.page) });
    } catch (err) {
      console.error(chalk.red(`获取推荐职位失败: ${err.message}`));
    } finally {
      await cleanup();
    }
  });

// ---- 搜索职位 ----
program
  .command('search-jobs')
  .description('[C端] 搜索职位')
  .requiredOption('-q, --query <keyword>', '搜索关键词')
  .option('-c, --city <cityCode>', '城市代码 (如 101010100=北京)')
  .option('-p, --page <page>', '页码', '1')
  .action(async (opts) => {
    try {
      await searchJobs({ query: opts.query, city: opts.city, page: parseInt(opts.page) });
    } catch (err) {
      console.error(chalk.red(`搜索职位失败: ${err.message}`));
    } finally {
      await cleanup();
    }
  });

// ---- 职位详情 ----
program
  .command('job-detail')
  .description('[C端] 查看职位详情')
  .requiredOption('--id <securityId>', '职位 securityId')
  .action(async (opts) => {
    try {
      await jobDetail({ securityId: opts.id });
    } catch (err) {
      console.error(chalk.red(`获取职位详情失败: ${err.message}`));
    } finally {
      await cleanup();
    }
  });

// ---- C端消息 ----
program
  .command('geek-messages')
  .description('[C端] 查看求职者消息列表')
  .option('-p, --page <page>', '页码', '1')
  .action(async (opts) => {
    try {
      await geekMessages({ page: parseInt(opts.page) });
    } catch (err) {
      console.error(chalk.red(`获取消息失败: ${err.message}`));
    } finally {
      await cleanup();
    }
  });

program.parse();
