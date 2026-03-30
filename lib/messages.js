import chalk from 'chalk';
import Table from 'cli-table3';
import dayjs from 'dayjs';
import { API } from './constants.js';
import { apiGet } from './api.js';
import { requireLogin } from './auth.js';

export async function listMessages(options = {}) {
  requireLogin();

  const page = options.page || 1;
  const res = await apiGet(API.BOSS_FRIEND_LIST, { page });

  if (res.code !== 0) {
    console.log(chalk.red(`获取消息列表失败: ${res.message || '未知错误 (code=' + res.code + ')'}`));
    return;
  }

  const friends = res.zpData?.result || res.zpData?.friendList || [];
  if (friends.length === 0) {
    console.log(chalk.yellow('暂无消息'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('姓名'),
      chalk.cyan('最后消息'),
      chalk.cyan('时间'),
      chalk.cyan('状态'),
      chalk.cyan('UID'),
    ],
    colWidths: [14, 36, 18, 10, 14],
    wordWrap: true,
  });

  for (const f of friends) {
    const name = f.friendName || f.name || '未知';
    const lastMsg = f.lastMessageInfo?.text || f.lastContent || '--';
    const ts = f.lastMessageInfo?.time || f.updateTime;
    const timeStr = ts ? dayjs(ts).format('MM-DD HH:mm') : '--';
    const uid = f.friendId || f.uid || '--';

    const status = f.lastMessageInfo?.status;
    let statusText = '--';
    if (status === 0) statusText = '系统';
    else if (status === 1) statusText = '已发送';
    else if (status === 2) statusText = chalk.green('已读');

    table.push([name, lastMsg, timeStr, statusText, uid]);
  }

  console.log(chalk.cyan(`\n消息列表 (第 ${page} 页)\n`));
  console.log(table.toString());

  const hasMore = friends.length >= 15;
  if (hasMore) {
    console.log(chalk.gray(`\n查看下一页: boss messages --page ${page + 1}`));
  }
}

export async function chatHistory(options = {}) {
  requireLogin();

  const { uid } = options;
  if (!uid) {
    console.log(chalk.red('请指定用户 ID: boss messages --chat <uid>'));
    return;
  }

  const res = await apiGet(API.CHAT_HISTORY, { uid, page: options.page || 1 });

  if (res.code !== 0) {
    console.log(chalk.red(`获取聊天记录失败: ${res.message || '未知错误'}`));
    return;
  }

  const messages = res.zpData?.messages || res.zpData?.list || [];
  if (messages.length === 0) {
    console.log(chalk.yellow('暂无聊天记录'));
    return;
  }

  console.log(chalk.cyan(`\n聊天记录 (uid: ${uid})\n`));

  for (const msg of messages) {
    const time = msg.time ? dayjs(msg.time).format('MM-DD HH:mm') : '';
    const from = msg.from === 'self' || msg.type === 1 ? chalk.green('我') : chalk.blue('对方');
    const text = msg.text || msg.body || '[非文本消息]';
    console.log(`${chalk.gray(time)} ${from}: ${text}`);
  }
}
