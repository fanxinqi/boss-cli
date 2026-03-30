import { BASE_URL } from './constants.js';
import { get as httpGet } from './client.js';
import { launchBrowser, browserFetch, closeBrowser } from './browser.js';
import { loadCookies } from './config.js';

/**
 * 统一 API 调用
 * 默认用 HTTP 直连（快），code=37 时自动回退到浏览器（带 __zp_stoken__）
 * 可通过 options.browser = true 强制走浏览器
 */
export async function apiGet(apiPath, params = {}, options = {}) {
  const forceBrowser = options.browser === true;

  if (!forceBrowser) {
    const result = await httpGet(apiPath, params);
    if (result.code !== 37) return result;
  }

  // 浏览器模式：注入已有 cookie，加载 zhipin 页面让 JS 生成 stoken，再 fetch API
  try {
    const { page } = await launchBrowser({ headless: true });

    // 注入已保存的 cookie
    const savedCookies = loadCookies();
    if (savedCookies) {
      const cookieList = Object.entries(savedCookies).map(([name, value]) => ({
        name,
        value,
        domain: '.zhipin.com',
        path: '/',
      }));
      await page.setCookie(...cookieList);
    }

    // 加载 zhipin 页面让 JS 生成 __zp_stoken__
    const currentUrl = page.url();
    if (!currentUrl.includes('zhipin.com')) {
      // 用 about:blank + cookie 注入后再导航
      await page.goto(`${BASE_URL}/web/geek/recommend`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      // 等 JS 生成 stoken
      await new Promise((r) => setTimeout(r, 5000));
    }

    const qs = new URLSearchParams(params).toString();
    const url = `${BASE_URL}${apiPath}${qs ? '?' + qs : ''}`;
    return await browserFetch(url);
  } catch (err) {
    return { code: -1, message: `浏览器请求失败: ${err.message}`, zpData: {} };
  }
}

export async function cleanup() {
  await closeBrowser();
}
