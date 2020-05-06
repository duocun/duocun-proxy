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
  MALL: '124'
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

  redirectApp(appCode, tokenId) {
    // const data = {msg: 'appCode: ' + appCode + ', https://duocun.ca?grocerytoken=' + tokenId, category: 'proxy' };
    // this.logSvc.save(data).then(() => {
    this.clearTimer();
    if (appCode === AppCode.MALL) {
      window.location.href = 'https://duocun.ca/mall?token=' + tokenId + '&state=' + appCode;
    } else if (appCode === AppCode.GROCERY) {
      window.location.href = 'https://duocun.ca/grocery?token=' + tokenId + '&state=' + appCode;
    } else if (appCode === AppCode.FOOD_DELIVERY) {
      window.location.href = 'https://duocun.ca/fod?token=' + tokenId + '&state=' + appCode;
    } else {
      alert('获取状态码失败, 请退出重新登陆');
    }

    // window.location.href =
    //   'https://duocun.ca/grocery?token=' + tokenId + '&state=123'; //  + appCode;
    // });
  }
  setTimer(tokenInfo: string) {
    if (!this.timerHandler) {
      // if auth time is greater than 10 seconds,
      // try to tell clients to login again
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
    this.clearTimer();
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  // duocun-proxy domain is localhost:5005   the router url could be call multiple times
  // dev:        http://localhost:5005/?code=071uZnPi1xT97t0OFnTi12xDPi1uZnPK&state=123
  // production: http://duocun.com.cn/?code=071uZnPi1xT97t0OFnTi12xDPi1uZnPK&state=123
  ngOnInit() {
    // set a timer, if auth takes too long, then tell users to login again
    let whiteScreenLog = 'Proxy OnInit';
    // console.log('ngOnInit');
    // log.debug(`ngOnInit called ....`);
    this.route.queryParamMap
      .pipe(
        takeUntil(this.onDestroy$)
      )
      .subscribe((queryParams) => {
        whiteScreenLog += ', route Done';

        const code = queryParams.get('code');
        const appCode = queryParams.get('state'); // no use at all
        this.setTimer(`(${code},${appCode})`);
        whiteScreenLog += `(${code},${appCode})`;

        // process wx 40163 issue
        const { accessToken, openId } = this.authSvc.getWechatOpenId();
        if (accessToken && openId) {
          whiteScreenLog += ', use local accessToken';

          this.authSvc
            .wechatLoginByOpenId(accessToken, openId)
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((r: any) => {
              if (r && r.tokenId) {
                this.authSvc.setAccessTokenId(r.tokenId);
                whiteScreenLog += `, use openId ok, redirect`;
                this.logSvc.saveWhiteScreenLog(whiteScreenLog, LogEventWhiteScreenType.Success);
                this.redirectApp(appCode, r.tokenId);
              } else {
                // add another try to increase chance to login
                this.authSvc.getCurrentAccount()
                  .pipe(takeUntil(this.onDestroy$))
                  .subscribe((account: any) => {
                    if (account) {
                      const tokenId = this.authSvc.getAccessTokenId();
                      this.redirectApp(appCode, tokenId);
                    } else {
                      whiteScreenLog += `, use local token fail ${r}`;
                      this.logSvc.saveWhiteScreenLog(whiteScreenLog, LogEventWhiteScreenType.Failure);
                      this.clearTimer();
                      // accessToken expiry
                      alert('微信登陆失败，请退出公众号重新尝试');
                      return;
                    }
                  });
              }
            }, error => {
              whiteScreenLog += `->wechatLoginByOpenId subscribe error : ${error}`;
              this.logSvc.saveWhiteScreenLog(whiteScreenLog, LogEventWhiteScreenType.Exception);
            });
        } else {
          whiteScreenLog += ', No local accessToken';
          // if accessToken expired
          this.wechatLoginByCode(appCode, code, whiteScreenLog);
        }
      }, error => {
        whiteScreenLog += `, route subscribe error : ${error}`;
        this.logSvc.saveWhiteScreenLog(whiteScreenLog, LogEventWhiteScreenType.Exception);
      });
  }

  wechatLoginByCode(appCode, code, whiteScreenLog) {
    if (appCode && code) {
      this.authSvc
        .wechatLoginByCode(code)
        .pipe(takeUntil(this.onDestroy$))
        .subscribe((r: any) => {
          // const data = {msg: 'wxLogin with code:' + code + ', appCode: ' + appCode + ', tokenId:' + r.tokenId};
          // this.logSvc.save(data).then(() => {
          if (r && r.tokenId) {
            this.authSvc.setWechatOpenId(r.accessToken, r.openId, '3000'); // r.expiresIn);
            this.authSvc.setAccessTokenId(r.tokenId); // duocun jwt token
            whiteScreenLog += `wechat code login ok, redirect`;
            this.logSvc.saveWhiteScreenLog(whiteScreenLog, LogEventWhiteScreenType.Success);
            this.redirectApp(appCode, r.tokenId); // duocun jwt token
          } else {
            whiteScreenLog += `, wechat code login fail ${r}`;
            this.logSvc.saveWhiteScreenLog(whiteScreenLog, LogEventWhiteScreenType.Failure);
            this.clearTimer();
            alert('微信登陆失败, 请退出重新尝试');
          }
        }, error => {
          whiteScreenLog += `->wechatLoginByCode subscribe err ${error}`;
          this.logSvc.saveWhiteScreenLog(whiteScreenLog, LogEventWhiteScreenType.Exception);
        });
    } else {
      // add another try to increase chance to login
      this.authSvc.getCurrentAccount()
        .pipe(takeUntil(this.onDestroy$))
        .subscribe((account: any) => {
          if (account) {
            const tokenId = this.authSvc.getAccessTokenId();
            this.redirectApp(appCode, tokenId);
          } else {
            whiteScreenLog += ', wrong local token';
            this.logSvc.saveWhiteScreenLog(whiteScreenLog, LogEventWhiteScreenType.Exception);
          }
        });
    }
  }
}
