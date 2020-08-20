import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';
import { LogService, LogEventWhiteScreenType } from '../log.service';
import { Subject } from 'rxjs';

import { takeUntil } from 'rxjs/operators';

// import { factory } from './log4j';
// const log = factory.getLogger('model.AppComponent');

const AppCode = {
  FOOD_DELIVERY: '122',
  GROCERY: '123',
  MALL: '124',
  DEV: '125'
};

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, OnDestroy {

  title = 'duocun-proxy';
  hasCode = true;
  onDestroy$ = new Subject();
  timerHandler = null;
  authTimeTooLong = false;

  constructor(
    private route: ActivatedRoute,
    private authSvc: AuthService,
    private logSvc: LogService
  ) { }

  // tokenId --- jwt tokenId means login success, if tokenId is null means login fail
  redirectApp(appCode, tokenId) {
    if (appCode === AppCode.MALL) { // production server
      window.location.href = tokenId ? `https://duocun.ca?token=${tokenId}&state=${appCode}` : `https://duocun.ca?state=${appCode}`;
    } else if (appCode === AppCode.GROCERY) { // staging server
      window.location.href = tokenId ? `https://duocun.ca/test?token=${tokenId}&state=${appCode}` : `https://duocun.ca/test?state=${appCode}`;
    } else if (appCode === AppCode.FOOD_DELIVERY) {
      window.location.href = tokenId ? `https://duocun.ca/fod?token=${tokenId}&state=${appCode}` : `https://duocun.ca/fod?state=${appCode}`;
    } else if (appCode === AppCode.DEV) {
      window.location.href = tokenId ? `https://dev.duocun.ca?token=${tokenId}&state=${appCode}` : `https://dev.duocun.ca?state=${appCode}`;
    } else {
      window.location.href = tokenId ? `https://duocun.ca?token=${tokenId}&state=${appCode}` : `https://duocun.ca?state=${appCode}`;
    }
  }


  setTimer(tokenInfo: string) {
    if (!this.timerHandler) {
      // if auth time is greater than 10 seconds, try to tell clients to login again
      this.timerHandler = setTimeout(() => {
        this.logSvc.saveWhiteScreenLog(`Proxy: auth more than 10 seconds ${tokenInfo}`, LogEventWhiteScreenType.Exception);
        this.authTimeTooLong = true;
        this.clearTimer();
      }, 10000);
    }
  }

  clearTimer() {
    if (this.timerHandler) {
      clearTimeout(this.timerHandler);
      this.timerHandler = null;
    }
  }

  ngOnDestroy() {
    // this.clearTimer();
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  // duocun-proxy domain is localhost:5005   the router url could be call multiple times
  // dev:        http://localhost:5005/?code=071L22000Liq8K15WF200PKg9d4L2205&state=123
  // production: http://duocun.com.cn/?code=071uZnPi1xT97t0OFnTi12xDPi1uZnPK&state=123
  ngOnInit() {
    // set a timer, if auth takes too long, then tell users to login again
    let sLog = '';
    this.route.queryParamMap
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((queryParams) => {
        sLog += 'proxy route ok, ';

        const code = queryParams.get('code');
        const appCode = queryParams.get('state'); // no use at all
        sLog += `(${code}, ${appCode}), `;
        if (appCode && appCode === '124' && code) {
          this.authSvc.wechatLoginByCode(code)
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((r: any) => {
              if (r && r.tokenId) {
                this.authSvc.setWechatOpenId(r.accessToken, r.openId, '7190'); // r.expiresIn);
                this.authSvc.setAccessTokenId(r.tokenId); // duocun jwt token
                sLog += `wechat code login ok, redirect`;
                this.logSvc.saveWhiteScreenLog(sLog, LogEventWhiteScreenType.Success);
                this.redirectApp(appCode, r.tokenId); // duocun jwt token
              } else {
                sLog += `wechat code login fail ${r}, `;
                this.wechatLoginByOpenId(appCode, sLog);
              }
            }, error => {
              sLog += `->wechatLoginByCode subscribe exception ${error}`;
              this.wechatLoginByOpenId(appCode, sLog);
            });
        } else if (appCode && appCode === '125' && code) { // for test
          this.authSvc.getWechatUserByAuthCode(code).subscribe((rt: any) => {
            if (rt && rt.openid) {
              // try signup
              this.authSvc.wechatSignup(rt).subscribe((r: any) => {
                this.authSvc.setWechatOpenId(r.accessToken, r.openId, '7190'); // r.expiresIn);
                this.authSvc.setAccessTokenId(r.tokenId); // duocun jwt token
                sLog += `wechat code login ok, redirect`;
                this.logSvc.saveWhiteScreenLog(sLog, LogEventWhiteScreenType.Success);
                this.redirectApp(appCode, r.tokenId); // duocun jwt token
              });
            } else {
              // get openId from cache and try signup again
              const { accessToken, openId } = this.authSvc.getWechatOpenId();
              if (openId) {
                this.authSvc.getWechatUserByOpenId(accessToken, openId).subscribe((r1: any) => {
                  this.authSvc.wechatSignup(r1).subscribe((r: any) => {
                    this.authSvc.setWechatOpenId(r.accessToken, r.openId, '7190'); // r.expiresIn);
                    this.authSvc.setAccessTokenId(r.tokenId); // duocun jwt token
                    sLog += `wechat code login ok, redirect`;
                    this.logSvc.saveWhiteScreenLog(sLog, LogEventWhiteScreenType.Success);
                    this.redirectApp(appCode, r.tokenId); // duocun jwt token
                  });
                });
              } else {
                this.redirectApp(appCode, null); // duocun jwt token
              }
            }
          });
          // getWechatUserByOpenId(accessToken, openId) {
        } else {
          // add another try to increase chance to login
          sLog += 'missing code, ';
          this.wechatLoginByOpenId(appCode, sLog);
        }
      }, error => {
        sLog += `, route subscribe error : ${error}`;
        this.logSvc.saveWhiteScreenLog(sLog, LogEventWhiteScreenType.Exception);
        this.redirectApp(null, null);
      });
  }


  wechatLoginByOpenId(appCode, sLog) {
    const { accessToken, openId } = this.authSvc.getWechatOpenId();
    if (accessToken && openId) {
      sLog += 'use local openId, ';
      this.authSvc.wechatLoginByOpenId(accessToken, openId)
        .pipe(takeUntil(this.onDestroy$))
        .subscribe((r: any) => {
          if (r && r.tokenId) {
            const tokenId = r.tokenId;
            this.authSvc.setAccessTokenId(tokenId);
            sLog += `use openId ok, redirect, `;
            this.logSvc.saveWhiteScreenLog(sLog, LogEventWhiteScreenType.Success);
            this.redirectApp(appCode, tokenId);
          } else {
            sLog += `use openId fail, `;
            this.logSvc.saveWhiteScreenLog(sLog, LogEventWhiteScreenType.Failure);
            this.redirectApp(appCode, null);
          }
        }, error => {
          sLog += `wechatLoginByOpenId subscribe exception: ${error}, `;
          this.logSvc.saveWhiteScreenLog(sLog, LogEventWhiteScreenType.Exception);
          this.redirectApp(appCode, null);
        });
    } else {
      sLog += 'no local openId, ';
      this.logSvc.saveWhiteScreenLog(sLog, LogEventWhiteScreenType.Failure);
      this.redirectApp(appCode, null);
    }
  }
}
