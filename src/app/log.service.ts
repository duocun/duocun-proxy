import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  url;
  constructor(
    private http: HttpClient,
    private authSvc: AuthService
  ) {
    this.url = environment.API_URL + 'EventLogs';
  }


  doPost(url: string, entity: any, filter?: any): Observable<any> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const accessTokenId = this.authSvc.getAccessTokenId();
    if (accessTokenId) {
      headers = headers.append('Authorization', '' + accessTokenId);
    }

    if (filter) {
      headers = headers.append('filter', JSON.stringify(filter));
    }

    return this.http.post(url, entity, { headers });
  }

  save(data) {
    return this.doPost(this.url, data).toPromise();
  }
}
