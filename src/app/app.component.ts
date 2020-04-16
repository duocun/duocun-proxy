import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';
import { LogService } from './log.service';
import { Subject } from 'rxjs';
import { takeUntil, skip, debounceTime, distinctUntilChanged } from 'rxjs/operators';

const AppCode = {
  FOOD_DELIVERY: '122',
  GROCERY: '123'
};
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [] // './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'duocun-proxy';
  hasCode = true;
  onDestroy$ = new Subject();

  constructor(
    private route: ActivatedRoute,
    private authSvc: AuthService,
    private logSvc: LogService
  ) {

  }

  redirectApp(appCode, tokenId) {
    // const data = {msg: 'appCode: ' + appCode + ', https://duocun.ca?grocerytoken=' + tokenId, category: 'proxy' };
    // this.logSvc.save(data).then(() => {
    // if (appCode === AppCode.FOOD_DELIVERY) {
    //   window.location.href = 'https://duocun.ca/fod?token=' + tokenId + '&state=' + appCode;
    // } else if (appCode === AppCode.GROCERY) {
    //   window.location.href = 'https://duocun.ca/grocery?token=' + tokenId + '&state=' + appCode;
    // } else {
    //   window.location.href = 'https://duocun.ca';
    // }
    window.location.href = 'https://duocun.ca/grocery?token=' + tokenId + '&state=123'; //  + appCode;
    // });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    this.route.queryParamMap.pipe(
      skip(1),
      debounceTime(100),
      distinctUntilChanged(),
      takeUntil(this.onDestroy$)
    )
      .subscribe(queryParams => {
        const code = queryParams.get('code');
        const appCode = queryParams.get('state');

        // process wx 40163 issue
        const cachedCode = this.authSvc.findWxCode(code);

        if (cachedCode === code) {
          const data = {type: 'wxlogin', msg: 'login with duplicated code:' + code + ', appCode: ' + appCode};
          this.logSvc.save(data).then(() => {});
          return;
        } else {
          this.authSvc.quequeWxCode(code);
        }

        if (appCode) {
          // this.authSvc.getAccount().pipe(takeUntil(this.onDestroy$)).subscribe((account: any) => {
          //   if (account) {
          //     const tokenId = this.authSvc.getAccessTokenId();
          //     // const data = {msg: 'default login by ' + account.username + ', appCode: ' + appCode + ', tokenId:' + tokenId};
          //     // this.logSvc.save(data).then(() => {
          //     this.redirectApp(appCode, tokenId);
          //     // });
          //   } else {
          this.authSvc.wxLogin(code).pipe(takeUntil(this.onDestroy$)).subscribe((r: any) => {
            // const data = {msg: 'wxLogin with code:' + code + ', appCode: ' + appCode + ', tokenId:' + r.tokenId};
            // this.logSvc.save(data).then(() => {
            if (r && r.tokenId) {
              const tokenId = r.tokenId;
              // this.authSvc.setAccessTokenId(tokenId);
              this.redirectApp(appCode, tokenId);
            } else {
              alert('微信登陆失败, 请退出重新尝试'); // to do
              // window.location.href = 'https://duocun.ca';
            }
            // });
          });
          //   }
          // });
        } else {
          alert('微信登陆失败, 请退出重新尝试');
          this.hasCode = false;
        }
      });
  }
}
