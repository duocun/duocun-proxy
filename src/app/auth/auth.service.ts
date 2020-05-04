import { Injectable } from '@angular/core';
import * as Cookies from 'js-cookie';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { throwError as observableThrowError, of } from 'rxjs';

import { environment } from '../../environments/environment';
const COOKIE_EXPIRY_DAYS = 3;

const WECHAT_CODE_KEY = 'duocun_wechat_code';
const WECHAT_OPENID_KEY = 'duocun_wechat_openId';
const WECHAT_ACCESS_TOKEN_KEY = 'duocun_wechat_access_token';
const WECHAT_EXPIRY_KEY = 'duocun_wechat_expiry';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public url = environment.API_URL + 'Accounts';
  constructor(
    private http: HttpClient
  ) {

  }

  setWechatCode(code: string) {
    window.localStorage.setItem(WECHAT_CODE_KEY, code);
  }

  findWechatCode(code): boolean {
    const codeSaved = window.localStorage.getItem(WECHAT_CODE_KEY);
    return codeSaved === code;
  }

  // deprecated
  // max size 10
  // quequeWxCode(code: string) {
  //   const jsonStr = Cookies.get('duocun-wx-codes');
  //   const codes = jsonStr ? JSON.parse(jsonStr) : [];
  //   if (codes && codes.length === 10) {
  //     codes.shift();
  //     codes.push(code);
  //     const r = JSON.stringify(codes);
  //     Cookies.set('duocun-wx-codes', r, { expires: COOKIE_EXPIRY_DAYS });
  //   } else {
  //     const found = codes.find(c => c === code);
  //     if (!found) {
  //       codes.push(code);
  //       const r = JSON.stringify(codes);
  //       Cookies.set('duocun-wx-codes', r, { expires: COOKIE_EXPIRY_DAYS });
  //     }
  //   }
  // }

  // deprecated
  // findWxCode(code): string {
  //   const jsonStr = Cookies.get('duocun-wx-codes');
  //   const codes = jsonStr ? JSON.parse(jsonStr) : [];
  //   const found = codes.find(c => c === code);
  //   return found ? found : null;
  // }

  setWechatOpenId(accessToken: string, openId: string, expiresIn: string) {
    if (accessToken && openId && expiresIn) {

      const accessTokenSaved = window.localStorage.getItem(WECHAT_ACCESS_TOKEN_KEY);
      const openIdSaved = window.localStorage.getItem(WECHAT_OPENID_KEY);

      if (accessToken !== accessTokenSaved && openId !== openIdSaved) {
        const seconds = (+expiresIn);
        const t = new Date().getTime() + seconds * 1000;
        window.localStorage.setItem(WECHAT_OPENID_KEY, openId);
        window.localStorage.setItem(WECHAT_ACCESS_TOKEN_KEY, accessToken);
        window.localStorage.setItem(WECHAT_EXPIRY_KEY, t.toString());
      }
    }
  }

  getWechatOpenId(): any {
    const accessToken = window.localStorage.getItem(WECHAT_ACCESS_TOKEN_KEY);
    const openId = window.localStorage.getItem(WECHAT_OPENID_KEY);
    const t = +window.localStorage.getItem(WECHAT_EXPIRY_KEY);

    if (accessToken && openId) {
      const expiry = new Date().setTime(+(t));
      const now = new Date().getTime();
      if (accessToken && openId && (now < expiry)) {
        return { accessToken, openId };
      } else {
        return { accessToken: null, openId: null };
      }
    } else {
      return { accessToken: null, openId: null };
    }
  }

  setAccessTokenId(token: string) {
    if (token) {
      Cookies.set('duocun-token-id', token, { expires: COOKIE_EXPIRY_DAYS });
    }
  }

  getAccessTokenId(): string {
    const tokenId = Cookies.get('duocun-token-id');
    return tokenId ? tokenId : null;
  }

  getCurrentAccount() {
    const tokenId: string = this.getAccessTokenId();
    if (tokenId && tokenId !== 'null') {
      return this.http.get(this.url + '/current?tokenId=' + tokenId);
    } else {
      return of(null);
    }
  }

  wechatLoginByCode(authCode) {
    const url = this.url + '/wechatLoginByCode?code=' + authCode;
    return this.http.get(url);
  }

  wechatLoginByOpenId(accessToken, openId) {
    const url = this.url + '/wechatLoginByOpenId';
    return this.http.post(url, { accessToken, openId });
  }

}
