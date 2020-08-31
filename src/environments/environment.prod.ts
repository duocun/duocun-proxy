export const environment = {
  production: true,
  API_VERSION: 'api',
  SECURE: window.location.protocol === 'https:',
  API_BASE: window.location.protocol + '//' + window.location.hostname,
  API_URL: 'https://duocun.com.cn/api/',
  // API_URL: window.location.origin + '/api/',
  APP_URL: window.location.origin,
  MEDIA_URL: window.location.origin + '/media/',
  AUTH_PREFIX: '',
  language: 'zh',

  WX_AUTH_SVC_HOST: 'duocun.com.cn',
  WX_AUTH_SVC_PATH: 'wx/auth',

  LOG_SVC: 'https://api.duocun.ca/log/'
};
