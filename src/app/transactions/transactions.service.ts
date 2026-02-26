import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Transaction } from './transaction.interface';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class TransactionsService {
  dataUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.dataUrl);
  }
}
