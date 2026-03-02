import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { recurringBills } from './recurringBills.interface';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class BillsService {
  billsUrl = `http://localhost:3000/api/recurringBills`;

  constructor(private http: HttpClient) {}

  getBillsTotalValue() {
    return this.http.get<recurringBills[]>(this.billsUrl);
  }

  getBillsTotals(): Observable<{
    ok: number;
    bad: number;
    neutral: number;
    all: number;
  }> {
    return this.http.get<recurringBills[]>(this.billsUrl).pipe(
      map((bills) =>
        bills.reduce(
          (acc, bill) => {
            acc.all += bill.amount;
            if (bill.status === 'ok') acc.ok += bill.amount;
            else if (bill.status === 'bad') acc.bad += bill.amount;
            else if (bill.status === 'neutral') acc.neutral += bill.amount;
            return acc;
          },
          { ok: 0, bad: 0, neutral: 0, all: 0 },
        ),
      ),
    );
  }
}
