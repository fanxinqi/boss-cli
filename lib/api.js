import { BASE_URL } from './constants.js';
import { get as httpGet } from './client.js';
import { launchBrowser, browserFetch, closeBrowser } from './browser.js';

/**
 * 统一 API 调用：优先用无头浏览器 (带完整 cookie)，失败回退到 HTTP 直连
 */
export async function apiGet(apiPath, params = {}, options = {}) {
  const useBrowser = options.browser !== false;

  if (useBrowser) {
    try {
      // 先确保浏览器已启动并加载过 zhipin
      const { page } = await launchBrowser({ headless: true });
      const currentUrl = page.url();
      if (!currentUrl.includes('zhipin.com')) {
        await page.goto(`${BASE_URL}/web/boss`, { waitUntil: 'networkidle2', timeout: 15000 });
      }

      const qs = new URLSearchParams(params).toString();
      const url = `${BASE_URL}${apiPath}${qs ? '?' + qs : ''}`;
      const result = await browserFetch(url);
      return result;
    } catch {
      // 回退到 HTTP
    }
  }

  return httpGet(apiPath, params);
}

export async function cleanup() {
  await closeBrowser();
}
