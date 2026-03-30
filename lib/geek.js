import chalk from 'chalk';
import Table from 'cli-table3';
import { API } from './constants.js';
import { apiGet } from './api.js';
import { requireLogin } from './auth.js';

export async function recommendJobs(options = {}) {
  requireLogin();

  const page = options.page || 1;
  const res = await apiGet(API.GEEK_RECOMMEND_JOBS, { page });

  if (res.code !== 0) {
    console.log(chalk.red(`获取推荐职位失败: ${res.message || '未知错误 (code=' + res.code + ')'}`));
    return;
  }

  const jobs = res.zpData?.jobList || res.zpData?.list || [];
  if (jobs.length === 0) {
    console.log(chalk.yellow('暂无推荐职位'));
    return;
  }

  printJobTable(jobs, `推荐职位 (第 ${page} 页)`);

  if (res.zpData?.hasMore) {
    console.log(chalk.gray(`\n下一页: boss geek-jobs --page ${page + 1}`));
  }
}

export async function searchJobs(options = {}) {
  requireLogin();

  const { query, city, page = 1 } = options;
  if (!query) {
    console.log(chalk.red('请指定搜索关键词: boss search-jobs --query "前端开发"'));
    return;
  }

  const params = {
    query,
    page,
    pageSize: 30,
    scene: 1,
  };
  if (city) params.city = city;

  const res = await apiGet(API.GEEK_SEARCH_JOBS, params);

  if (res.code !== 0) {
    console.log(chalk.red(`搜索职位失败: ${res.message || '未知错误 (code=' + res.code + ')'}`));
    if (res.code === 37) {
      console.log(chalk.yellow('提示: 搜索接口需要 __zp_stoken__，请尝试:'));
      console.log(chalk.gray('  1. 重新登录: boss login (让浏览器生成 stoken)'));
      console.log(chalk.gray('  2. 使用推荐职位代替: boss geek-jobs'));
    }
    return;
  }

  const jobs = res.zpData?.jobList || [];
  if (jobs.length === 0) {
    console.log(chalk.yellow(`未找到 "${query}" 相关职位`));
    return;
  }

  printJobTable(jobs, `搜索: "${query}" (第 ${page} 页)`);

  if (res.zpData?.hasMore) {
    console.log(chalk.gray(`\n下一页: boss search-jobs --query "${query}" --page ${page + 1}`));
  }
}

export async function jobDetail(options = {}) {
  requireLogin();

  const { securityId } = options;
  if (!securityId) {
    console.log(chalk.red('请指定 securityId: boss job-detail --id <securityId>'));
    return;
  }

  const res = await apiGet(API.GEEK_JOB_DETAIL, { securityId });

  if (res.code !== 0) {
    console.log(chalk.red(`获取职位详情失败: ${res.message || '未知错误 (code=' + res.code + ')'}`));
    return;
  }

  const job = res.zpData?.jobInfo || {};
  const boss = res.zpData?.bossInfo || {};
  const brand = res.zpData?.brandComInfo || {};

  console.log(chalk.cyan(`\n${job.jobName || '--'}`));
  console.log(chalk.green(`  ${job.salaryDesc || '--'}`));
  console.log(chalk.gray(`  ${job.locationName || ''} | ${job.experienceName || ''} | ${job.degreeName || ''}`));
  console.log();
  console.log(chalk.cyan('  公司: ') + `${brand.brandName || '--'} | ${brand.scaleName || ''} | ${brand.stageName || ''} | ${brand.industryName || ''}`);
  console.log(chalk.cyan('  招聘者: ') + `${boss.name || '--'} · ${boss.title || ''}`);

  if (job.skills?.length) {
    console.log(chalk.cyan('  技能: ') + job.skills.join(', '));
  }

  if (job.postDescription) {
    console.log(chalk.cyan('\n  职位描述:'));
    const lines = job.postDescription.split('\n');
    for (const line of lines) {
      console.log(chalk.white(`    ${line}`));
    }
  }
  console.log();
}

export async function geekMessages(options = {}) {
  requireLogin();

  const page = options.page || 1;
  const res = await apiGet(API.GEEK_FRIEND_LIST, { page });

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
      chalk.cyan('招聘者'),
      chalk.cyan('公司'),
      chalk.cyan('最后消息'),
      chalk.cyan('状态'),
    ],
    colWidths: [14, 20, 36, 10],
    wordWrap: true,
  });

  for (const f of friends) {
    const name = f.friendName || f.name || '--';
    const brand = f.brandName || '--';
    const lastMsg = f.lastMessageInfo?.text || f.lastContent || '--';
    const status = f.lastMessageInfo?.status;
    let statusText = '--';
    if (status === 0) statusText = '系统';
    else if (status === 1) statusText = '已发送';
    else if (status === 2) statusText = chalk.green('已读');

    table.push([name, brand, lastMsg, statusText]);
  }

  console.log(chalk.cyan(`\nC端消息列表 (第 ${page} 页)\n`));
  console.log(table.toString());
}

function printJobTable(jobs, title) {
  const table = new Table({
    head: [
      chalk.cyan('#'),
      chalk.cyan('职位名称'),
      chalk.cyan('薪资'),
      chalk.cyan('公司'),
      chalk.cyan('城市'),
      chalk.cyan('经验/学历'),
      chalk.cyan('技能/福利'),
    ],
    colWidths: [5, 20, 12, 16, 12, 12, 26],
    wordWrap: true,
  });

  jobs.forEach((job, i) => {
    const location = (job.cityName || '') + (job.areaDistrict ? '·' + job.areaDistrict : '');
    const exp = [job.jobExperience, job.jobDegree].filter(Boolean).join('/');
    const skills = (job.skills || []).slice(0, 3).join(',');
    const welfare = (job.welfareList || []).slice(0, 2).join(',');
    const extra = [skills, welfare].filter(Boolean).join(' | ');

    table.push([
      i + 1,
      job.jobName || '--',
      chalk.green(job.salaryDesc || '--'),
      job.brandName || '--',
      location || '--',
      exp || '--',
      extra || '--',
    ]);
  });

  console.log(chalk.cyan(`\n${title}\n`));
  console.log(table.toString());
}
