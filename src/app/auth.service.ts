import { Injectable } from '@angular/core';
import * as Cookies from 'js-cookie';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
      return this.http.get(this.url + '/current?tokenId=' + tokenId).toPromise();
    } else {
      return new Promise((resolve) => { resolve(); });
    }
  }

  wxLogin(authCode) {
    const url = this.url + '/wxLogin?code=' + authCode;
    return this.http.get(url).toPromise();
  }
}
