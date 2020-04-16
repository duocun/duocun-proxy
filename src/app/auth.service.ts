import { Injectable } from '@angular/core';
import * as Cookies from 'js-cookie';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { throwError as observableThrowError, of } from 'rxjs';

import { environment } from '../environments/environment';
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

  wxLogin(authCode) {
    const url = this.url + '/wxLogin?code=' + authCode;
    return this.http.get(url);
  }
}
