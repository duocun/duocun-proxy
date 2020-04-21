import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "./auth.service";
import { LogService } from "./log.service";
import { Subject } from "rxjs";
import {
	takeUntil,
	skip,
	debounceTime,
	distinctUntilChanged,
} from "rxjs/operators";

import { factory } from "./log4j";
const log = factory.getLogger("model.AppComponent");

const AppCode = {
	FOOD_DELIVERY: "122",
	GROCERY: "123",
};
@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: [], // './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
	title = "duocun-proxy";
	hasCode = true;
	onDestroy$ = new Subject();

	constructor(
		private route: ActivatedRoute,
		private authSvc: AuthService,
		private logSvc: LogService
	) {}

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
		window.location.href =
			"https://duocun.ca/grocery?token=" + tokenId + "&state=123"; //  + appCode;
		// });
	}

	ngOnDestroy() {
		this.onDestroy$.next();
		this.onDestroy$.complete();
	}

	// duocun-proxy domain is localhost:5005   the router url could be call multiple times
	// dev:        http://localhost:5005/?code=071uZnPi1xT97t0OFnTi12xDPi1uZnPK&state=123
	// production: http://duocun.com.cn/?code=071uZnPi1xT97t0OFnTi12xDPi1uZnPK&state=123
	ngOnInit() {
		log.debug(`ngOnInit called ....`);
		this.route.queryParamMap
			.pipe(
				skip(1),
				debounceTime(1),
				distinctUntilChanged(),
				takeUntil(this.onDestroy$)
			)
			.subscribe((queryParams) => {
				const code = queryParams.get("code");
				const appCode = queryParams.get("state"); // no use at all

				// process wx 40163 issue
				const { accessToken, openId } = this.authSvc.getWechatOpenId();
				if (accessToken && openId) {
					this.authSvc
						.wechatLoginByOpenId(accessToken, openId)
						.pipe(takeUntil(this.onDestroy$))
						.subscribe((r: any) => {
							if (r && r.tokenId) {
								this.authSvc.setAccessTokenId(r.tokenId);
								this.redirectApp(appCode, r.tokenId);
							} else {
								// accessToken expiry
								// this.wechatLoginByCode(appCode, code);
								alert("微信登陆失败，请退出公众号重新尝试");
								return;
							}
						});
				} else {
					// if accessToken expired
					this.wechatLoginByCode(appCode, code);
				}
			});
	}

	wechatLoginByCode(appCode, code) {
		if (appCode && code) {
			this.authSvc
				.wechatLoginByCode(code)
				.pipe(takeUntil(this.onDestroy$))
				.subscribe((r: any) => {
					// const data = {msg: 'wxLogin with code:' + code + ', appCode: ' + appCode + ', tokenId:' + r.tokenId};
					// this.logSvc.save(data).then(() => {
					if (r && r.tokenId) {
						// this.authSvc.setWechatOpenId(r.accessToken, r.openId, r.expiresIn);
						this.authSvc.setAccessTokenId(r.tokenId); // duocun jwt token
						this.redirectApp(appCode, r.tokenId); // duocun jwt token
					} else {
						alert("微信登陆失败, 请退出重新尝试");
					}
				});
		}
	}
}
