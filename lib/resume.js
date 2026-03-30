import chalk from 'chalk';
import Table from 'cli-table3';
import { API } from './constants.js';
import { apiGet } from './api.js';
import { requireLogin } from './auth.js';

export async function listJobs() {
  requireLogin();

  const res = await apiGet(API.JOB_LIST, { page: 1, type: 0 });

  if (res.code !== 0) {
    console.log(chalk.red(`获取职位列表失败: ${res.message || '未知错误 (code=' + res.code + ')'}`));
    return [];
  }

  const jobs = res.zpData?.list || res.zpData?.data || [];
  if (jobs.length === 0) {
    console.log(chalk.yellow('暂无发布的职位'));
    return [];
  }

  const table = new Table({
    head: [
      chalk.cyan('#'),
      chalk.cyan('职位名称'),
      chalk.cyan('薪资'),
      chalk.cyan('城市'),
      chalk.cyan('Job ID'),
    ],
    colWidths: [5, 30, 16, 10, 20],
  });

  jobs.forEach((job, i) => {
    table.push([
      i + 1,
      job.jobName || job.positionName || '--',
      job.salaryDesc || job.salary || '--',
      job.cityName || job.areaDistrict || '--',
      job.encryptJobId || job.jobId || '--',
    ]);
  });

  console.log(chalk.cyan('\n已发布职位列表\n'));
  console.log(table.toString());
  return jobs;
}

export async function listResumes(options = {}) {
  requireLogin();

  const { jobId, page = 1 } = options;

  if (!jobId) {
    console.log(chalk.yellow('请指定职位 ID，先查看职位列表:\n'));
    const jobs = await listJobs();
    if (jobs.length > 0) {
      console.log(chalk.gray(`\n使用方式: boss resumes --job <jobId>`));
      console.log(chalk.gray(`示例: boss resumes --job ${jobs[0]?.encryptJobId || jobs[0]?.jobId || 'xxx'}`));
    }
    return;
  }

  const params = {
    jobId,
    page,
    status: 0,
    source: 1,
    salary: 0,
    age: -1,
    school: -1,
    degree: 0,
    experience: 0,
    intention: -1,
    switchJobFrequency: -1,
    refresh: Date.now(),
    _: Date.now(),
  };

  const res = await apiGet(API.RECOMMEND_GEEK_LIST, params);

  if (res.code !== 0) {
    console.log(chalk.red(`获取推荐简历失败: ${res.message || '未知错误 (code=' + res.code + ')'}`));
    return;
  }

  const geeks = res.zpData?.geekList || res.zpData?.list || [];
  if (geeks.length === 0) {
    console.log(chalk.yellow('暂无推荐候选人'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('#'),
      chalk.cyan('姓名'),
      chalk.cyan('学历'),
      chalk.cyan('工作年限'),
      chalk.cyan('年龄'),
      chalk.cyan('期望薪资'),
      chalk.cyan('活跃度'),
      chalk.cyan('状态'),
    ],
    colWidths: [5, 12, 10, 10, 8, 14, 14, 10],
    wordWrap: true,
  });

  geeks.forEach((g, i) => {
    const card = g.geekCard || g;
    table.push([
      i + 1,
      card.geekName || g.name || '--',
      card.geekDegree || card.degree || '--',
      card.geekWorkYear || card.workYear || '--',
      card.ageDesc || '--',
      card.salary || g.expectSalary || '--',
      g.activeTimeDesc || '--',
      g.isFriend ? chalk.green('已沟通') : '未沟通',
    ]);
  });

  console.log(chalk.cyan(`\n推荐候选人 (第 ${page} 页)\n`));
  console.log(table.toString());

  if (geeks.length >= 15) {
    console.log(chalk.gray(`\n下一页: boss resumes --job ${jobId} --page ${page + 1}`));
  }
}
