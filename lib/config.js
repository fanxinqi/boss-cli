import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.boss-cli');
const COOKIE_FILE = path.join(CONFIG_DIR, 'cookies.json');

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function saveCookies(cookies) {
  ensureDir();
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
}

export function loadCookies() {
  if (!fs.existsSync(COOKIE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

export function clearCookies() {
  if (fs.existsSync(COOKIE_FILE)) fs.unlinkSync(COOKIE_FILE);
}

export function getCookieString() {
  const cookies = loadCookies();
  if (!cookies) return '';
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
}
