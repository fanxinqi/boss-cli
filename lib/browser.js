import puppeteer from 'puppeteer-core';
import path from 'path';
import os from 'os';
import fs from 'fs';

const USER_DATA_DIR = path.join(os.homedir(), '.boss-cli', 'chrome-data');
const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * BOSS直聘反检测绕过脚本
 *
 * 原理：BOSS 使用 disable-devtool 库检测 CDP/DevTools 连接
 * 检测方式：
 *   1. console.table() 时间差检测 — DevTools 打开时打印大对象耗时 > 50ms
 *   2. performance.now() 时间差检测
 *   3. Function.prototype.toString 检测 — 判断原生函数是否被覆盖
 *   4. iframe contentWindow 沙箱检测 — 通过 iframe 获取未污染的原生函数
 *
 * 参考: https://github.com/loks666/get_jobs/discussions/250
 */
function getAntiDetectionScript() {
  return `(() => {
    "use strict";

    // ---- 1. 保存原生 Function.prototype.toString ----
    const nativeFunctionToString = Function.prototype.toString;

    // ---- 2. WeakMap: 函数 → 伪原生源码 ----
    const nativeSourceMap = new WeakMap();

    const registerNativeSource = (fn, source) => {
      try { nativeSourceMap.set(fn, source); } catch (_) {}
    };

    // ---- 3. 劫持 Function.prototype.toString ----
    const hookedToString = function toString() {
      if (nativeSourceMap.has(this)) {
        return nativeSourceMap.get(this);
      }
      return nativeFunctionToString.call(this);
    };
    Object.defineProperty(Function.prototype, "toString", {
      configurable: true,
      writable: true,
      value: hookedToString,
    });
    // toString 自身也要伪装成原生
    registerNativeSource(hookedToString, "function toString() { [native code] }");

    // ---- 4. Hook console.table → 空函数（绕过时间差检测）----
    const fakeTable = function table() {};
    registerNativeSource(fakeTable, "function table() { [native code] }");
    console.table = fakeTable;

    // 同时 hook console.log 等常见打印函数（部分变体会用这些）
    const consoleMethodsToHook = ["log", "warn", "info", "debug", "error", "dir", "dirxml"];
    const origConsole = {};
    for (const name of consoleMethodsToHook) {
      origConsole[name] = console[name];
      // 保留原始行为但包装成看起来原生的函数
      const wrapped = function(...args) { return origConsole[name].apply(console, args); };
      registerNativeSource(wrapped, \`function \${name}() { [native code] }\`);
      console[name] = wrapped;
    }

    // ---- 5. Hook performance.now（绕过时序检测）----
    //  必须返回随时间递增的值，否则会被 t1===t2 判定为 hook 并触发内存炸弹
    const navStart = (typeof performance !== "undefined" && performance.timing)
      ? performance.timing.navigationStart
      : Date.now();
    const fakeNow = function now() { return Date.now() - navStart; };
    registerNativeSource(fakeNow, "function now() { [native code] }");
    performance.now = fakeNow;

    // ---- 6. 防止 iframe 沙箱绕过 ----
    //  BOSS 会创建 iframe 获取未污染的原生函数来做对比检测
    const origContentWindowDesc = Object.getOwnPropertyDescriptor(
      HTMLIFrameElement.prototype, "contentWindow"
    );
    if (origContentWindowDesc && origContentWindowDesc.get) {
      const origGet = origContentWindowDesc.get;
      Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
        get: function() {
          const iframeWindow = origGet.apply(this);
          if (!iframeWindow) return iframeWindow;
          return new Proxy(iframeWindow, {
            get: function(target, property) {
              // 对 iframe 中的 console/performance 也返回我们 hook 过的版本
              if (property === "console") return console;
              if (property === "performance") return performance;
              if (property === "Function") return Function;
              const val = target[property];
              return val;
            }
          });
        }
      });
    }

    // ---- 7. 移除 webdriver 标记 ----
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
      configurable: true,
    });

    // 删除自动化相关属性
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  })();`;
}

let _browser = null;
let _page = null;

export async function launchBrowser(options = {}) {
  if (_browser && _browser.connected) return { browser: _browser, page: _page };

  const chromePath = options.chromePath || findChrome();
  if (!chromePath) {
    throw new Error('未找到 Chrome，请安装 Chrome 或通过 --chrome-path 指定路径');
  }

  fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  _browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: options.headless !== false ? 'new' : false,
    userDataDir: USER_DATA_DIR,
    protocolTimeout: 60000,
    timeout: 60000,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });

  _page = await _browser.newPage();

  // 在每个页面加载前注入反检测脚本
  await _page.evaluateOnNewDocument(getAntiDetectionScript());

  return { browser: _browser, page: _page };
}

export async function getPage() {
  if (!_page || !_browser?.connected) {
    const result = await launchBrowser();
    return result.page;
  }
  return _page;
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
    _page = null;
  }
}

/**
 * 在已登录的页面上下文中执行 API 请求
 * 浏览器会自动带上所有 cookie（包括 __zp_stoken__）
 */
export async function browserFetch(url, options = {}) {
  const page = await getPage();
  const result = await page.evaluate(async (url, options) => {
    const resp = await fetch(url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'x-requested-with': 'XMLHttpRequest',
      },
      ...options,
    });
    return resp.json();
  }, url, options);
  return result;
}

/**
 * 从浏览器提取当前所有 zhipin.com 的 cookie
 */
export async function extractCookies() {
  const page = await getPage();
  const cookies = await page.cookies('https://www.zhipin.com');
  const map = {};
  for (const c of cookies) {
    map[c.name] = c.value;
  }
  return map;
}
