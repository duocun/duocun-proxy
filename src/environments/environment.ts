// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  API_VERSION: 'api',
  SECURE: window.location.protocol === 'https:',
  API_BASE: window.location.protocol + '//' + window.location.hostname + ':8000',
  API_URL: 'http://localhost:8000',
  APP_URL: window.location.origin,
  MEDIA_URL: 'http://localhost:8000/',
  APP: 'duocun',
  AUTH_PREFIX: '',
  language: 'zh',

  WX_AUTH_SVC_HOST: 'duocun.com.cn', // 'localhost:8004',
  WX_AUTH_SVC_PATH: 'wx/auth',
  LOG_SVC: 'https://api.duocun.ca/log/'
};
