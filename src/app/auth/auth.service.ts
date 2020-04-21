import { Injectable } from '@angular/core';
import * as Cookies from 'js-cookie';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { throwError as observableThrowError, of } from 'rxjs';

import { environment } from '../../environments/environment';
const COOKIE_EXPIRY_DAYS = 3;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public url = environment.API_URL + 'Accounts';
  constructor(
    private http: HttpClient
  ) {

  }

  // max size 10
  quequeWxCode(code: string) {
    const jsonStr = Cookies.get('duocun-wx-codes');
    const codes = jsonStr ? JSON.parse(jsonStr) : [];
    if (codes && codes.length === 10) {
      codes.shift();
      codes.push(code);
      const r = JSON.stringify(codes);
      Cookies.set('duocun-wx-codes', r, { expires: COOKIE_EXPIRY_DAYS });
    } else {
      const found = codes.find(c => c === code);
      if (!found) {
        codes.push(code);
        const r = JSON.stringify(codes);
        Cookies.set('duocun-wx-codes', r, { expires: COOKIE_EXPIRY_DAYS });
      }
    }
  }


  findWxCode(code): string {
    const jsonStr = Cookies.get('duocun-wx-codes');
    const codes = jsonStr ? JSON.parse(jsonStr) : [];
    const found = codes.find(c => c === code);
    return found ? found : null;
  }

  setWechatOpenId(accessToken: string, openId: string, expiresIn: string) {
    if (accessToken && openId && expiresIn) {
      const seconds = (+expiresIn);
      const t = new Date().getTime() + seconds * 1000;
      Cookies.set('duocun-wx-token', accessToken);
      Cookies.set('duocun-wx-openid', openId);
      Cookies.set('duocun-wx-expiry', t);
    }
  }

  getWechatOpenId(): any {
    const accessToken = Cookies.get('duocun-wx-token');
    const openId = Cookies.get('duocun-wx-openid');
    const t = Cookies.get('duocun-wx-expiry');
    if (t && accessToken && openId) {
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

  getAccount() {
    const tokenId: string = this.getAccessTokenId();
    if (tokenId) {
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
