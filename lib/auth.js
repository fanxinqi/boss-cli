import ora from 'ora';
import chalk from 'chalk';
import { BASE_URL, API } from './constants.js';
import { launchBrowser, extractCookies, closeBrowser } from './browser.js';
import { saveCookies, loadCookies, clearCookies } from './config.js';

export async function login(options = {}) {
  console.log(chalk.cyan('BOSS直聘 B端登录'));
  console.log(chalk.yellow('提示: 请确保在 BOSS直聘 APP 中已切换到「招聘者」身份'));
  console.log(chalk.gray('将打开 Chrome 浏览器进行扫码登录...\n'));

  // 有头模式打开浏览器，让用户扫码
  const { browser, page } = await launchBrowser({
    headless: false,
    chromePath: options.chromePath,
  });

  const loginUrl = 'https://www.zhipin.com/web/user/?ka=bticket';
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log(chalk.yellow('请在浏览器中扫码登录...'));
  console.log(chalk.gray('(登录成功后会自动检测)\n'));

  const spinner = ora('等待登录...').start();

  // 轮询检测登录成功：URL 跳转 或 cookie 中出现 wt2/zp_at
  let loggedIn = false;
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const currentUrl = page.url();
      if (!currentUrl.includes('/web/user/') && !currentUrl.includes('about:blank')) {
        loggedIn = true;
        break;
      }
    } catch { /* page closed */ }

    try {
      const cookies = await page.cookies('https://www.zhipin.com');
      const hasAuth = cookies.some(c => c.name === 'wt2' || c.name === 'zp_at');
      if (hasAuth) {
        loggedIn = true;
        break;
      }
    } catch { /* ignore */ }
  }

  if (!loggedIn) {
    spinner.fail('登录超时 (180s)，请重试');
    await closeBrowser();
    return;
  }

  // 登录成功，访问B端首页触发 __zp_stoken__ 生成
  spinner.text = '正在获取完整 cookie...';
  try {
    await page.goto('https://www.zhipin.com/web/boss/recommend', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 3000));
  } catch { /* ignore */ }

  const cookies = await extractCookies();
  saveCookies(cookies);

  // 检查身份
  spinner.succeed('登录成功!');
  const keyCount = Object.keys(cookies).length;
  const hasToken = !!(cookies.wt2 || cookies.zp_at);
  const hasStoken = !!cookies.__zp_stoken__;
  console.log(chalk.gray(`  获取到 ${keyCount} 个 cookie`));
  console.log(chalk.gray(`  认证 token: ${hasToken ? '✓' : '✗'}`));
  console.log(chalk.gray(`  __zp_stoken__: ${hasStoken ? '✓' : '✗ (不影响大部分 B 端接口)'}`));

  const identity = await checkIdentity();
  if (identity === 0) {
    console.log(chalk.yellow('\n⚠ 当前为「求职者」身份，B 端功能不可用'));
    console.log(chalk.yellow('  请在 BOSS直聘 APP → 我的 → 设置 → 切换身份 → 选择「招聘者」'));
    console.log(chalk.yellow('  切换后重新执行: boss login\n'));
  } else {
    await showUserInfo();
  }

  await closeBrowser();
}

export async function loginWithCookie(cookieStr) {
  const cookies = {};
  cookieStr.split(';').forEach((pair) => {
    const [key, ...val] = pair.trim().split('=');
    if (key) cookies[key.trim()] = val.join('=').trim();
  });
  saveCookies(cookies);
  console.log(chalk.green('✓ Cookie 已保存'));

  const identity = await checkIdentity();
  if (identity === 0) {
    console.log(chalk.yellow('⚠ 当前为「求职者」身份，请先在 APP 切换到「招聘者」后重新登录'));
  } else {
    await showUserInfo();
  }
}

async function checkIdentity() {
  try {
    const { get } = await import('./client.js');
    const res = await get(API.USER_INFO);
    if (res.code === 0 && res.zpData) {
      return res.zpData.identity; // 0=求职者, 1=招聘者
    }
  } catch { /* ignore */ }
  return -1;
}

async function showUserInfo() {
  try {
    const { get } = await import('./client.js');
    const res = await get(API.USER_INFO);
    if (res.code === 0 && res.zpData) {
      const user = res.zpData;
      const role = user.identity === 1 ? '招聘者' : user.identity === 0 ? '求职者' : '未知';
      console.log(chalk.cyan(`  用户: ${user.name || user.showName || '未知'}`));
      console.log(chalk.cyan(`  身份: ${role}`));
      if (user.brandName) console.log(chalk.gray(`  公司: ${user.brandName}`));
    }
  } catch { /* ignore */ }
}

export async function logout() {
  clearCookies();
  console.log(chalk.green('✓ 已退出登录'));
}

export function isLoggedIn() {
  const cookies = loadCookies();
  return !!(cookies && (cookies.wt2 || cookies.wbg || cookies.zp_at));
}

export function requireLogin() {
  if (!isLoggedIn()) {
    console.log(chalk.red('✗ 请先登录: boss login'));
    process.exit(1);
  }
}
