import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { LogService } from './log.service';
import { AuthComponent } from './auth/auth.component';

const routes = [
  // { path: '', redirectTo: 'proxy', pathMatch: 'full' },
  { path: '', component: AuthComponent},
];
@NgModule({
  declarations: [
    AppComponent,
    AuthComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    AuthService,
    LogService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
