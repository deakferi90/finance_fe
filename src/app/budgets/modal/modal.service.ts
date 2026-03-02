import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Budget } from '../budgets.interface';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private apiUrl = `http://localhost:3000/api/budgets`;

  constructor(private http: HttpClient) {}

  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.apiUrl);
  }

  addBudget(newBudget: Budget): Observable<Budget | null> {
    return this.http.post<Budget>(this.apiUrl, newBudget).pipe(
      catchError((err) => {
        console.error('Error adding budget:', err);
        return of(null);
      }),
    );
  }

  updateBudget(updatedBudget: Budget): Observable<Budget> {
    return this.http.put<Budget>(
      `${this.apiUrl}/${updatedBudget.id}`,
      updatedBudget,
    );
  }

  deleteBudget(budgetId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${budgetId}`).pipe(
      catchError((err) => {
        console.error('Error deleting budget:', err);
        return of(null);
      }),
    );
  }
}
