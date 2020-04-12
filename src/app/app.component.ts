import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';
import { LogService } from './log.service';

const AppCode = {
  FOOD_DELIVERY: '122',
  GROCERY: '123'
};
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [] // './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'duocun-proxy';
  hasCode = true;
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

  ngOnInit() {
    this.route.queryParamMap.subscribe(queryParams => {
      const code = queryParams.get('code');
      const appCode = queryParams.get('state');
      if (appCode) {
        this.authSvc.getAccount().then((account: any) => {
          if (account) {
            const tokenId = this.authSvc.getAccessTokenId();
            // const data = {msg: 'default login by ' + account.username + ', appCode: ' + appCode + ', tokenId:' + tokenId};
            // this.logSvc.save(data).then(() => {
            this.redirectApp(appCode, tokenId);
            // });
          } else {
            this.authSvc.wxLogin(code).then((r: any) => {
              // const data = {msg: 'wxLogin with code:' + code + ', appCode: ' + appCode + ', tokenId:' + r.tokenId};
              // this.logSvc.save(data).then(() => {
              if (r) {
                const tokenId = r.tokenId;
                this.authSvc.setAccessTokenId(tokenId);
                this.redirectApp(appCode, tokenId);
              } else {
                window.location.href = 'https://duocun.ca';
              }
              // });
            });
          }
        });
      } else {
        this.hasCode = false;
      }
    });
  }
}
