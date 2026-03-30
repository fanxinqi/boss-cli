export const BASE_URL = 'https://www.zhipin.com';

export const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'x-requested-with': 'XMLHttpRequest',
  'Referer': 'https://www.zhipin.com/',
  'Origin': 'https://www.zhipin.com',
};

export const API = {
  // Auth
  QR_RAND_KEY: '/wapi/zppassport/captcha/randkey',
  QR_IMAGE: '/wapi/zpweixin/qrcode/getqrcode',
  QR_SCAN: '/wapi/zppassport/qrcode/scan',
  QR_SCAN_LOGIN: '/wapi/zppassport/qrcode/scanLogin',
  QR_DISPATCHER: '/wapi/zppassport/qrcode/dispatcher',

  // User
  USER_INFO: '/wapi/zpuser/wap/getUserInfo.json',

  // B-side
  JOB_LIST: '/wapi/zpjob/job/data/list',
  RECOMMEND_GEEK_LIST: '/wapi/zpboss/h5/boss/recommendGeekList',
  BOSS_FRIEND_LIST: '/wapi/zprelation/friend/getBossFriendList.json',
  CHAT_GEEK_INFO: '/wapi/zpboss/h5/chat/geek.json',
  CHAT_START: '/wapi/zpboss/h5/chat/start',
  CHAT_HISTORY: '/wapi/zpchat/history',

  // Resume
  REQUEST_RESUME: '/chat/requestResume.json',
  ACCEPT_RESUME: '/chat/acceptResume.json',
};
