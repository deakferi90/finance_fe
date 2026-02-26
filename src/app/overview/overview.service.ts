import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Overview } from './overview.interface';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class OverviewService {
  dataUrl = `${environment.apiUrl}/overview`;

  constructor(private http: HttpClient) {}

  getOverviewBudgets() {
    return this.http.get<Overview[]>(this.dataUrl);
  }
}
