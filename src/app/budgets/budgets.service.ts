import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { Budget } from './budgets.interface';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class BudgetsService {
  private budgetsUrl = `http://localhost:3000/api/budgets`;
  private transactionsUrl = `http://localhost:3000/api/transactions`;

  constructor(private http: HttpClient) {}

  getBudgets(): Observable<any> {
    return this.http.get(this.budgetsUrl);
  }

  getTransactions(): Observable<any> {
    return this.http.get(this.transactionsUrl);
  }

  getBudgetData(): Observable<any> {
    return forkJoin({
      budgets: this.getBudgets(),
      transactions: this.getTransactions(),
    });
  }

  updateBudget(id: number, budgetData: any): Observable<any> {
    return this.http.put(`${this.budgetsUrl}/${id}`, budgetData);
  }

  deleteBudget(budgetId: number) {
    return this.http.delete(`${this.budgetsUrl}/${budgetId}`);
  }

  addBudget(budget: Budget) {
    return this.http.post(`${this.budgetsUrl}`, budget);
  }
}
