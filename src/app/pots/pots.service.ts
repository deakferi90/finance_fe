import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pots } from './pots.interface';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class PotsService {
  potsUrl = `http://localhost:3000/api/pots`;

  constructor(private http: HttpClient) {}

  getPots(): Observable<any[]> {
    return this.http.get<Pots[]>(this.potsUrl);
  }

  deletePot(potId: number): Observable<any> {
    return this.http.delete(`${this.potsUrl}/${potId}`);
  }

  updatePot(id: string, selectedPot: Pots): Observable<any> {
    return this.http.put(`${this.potsUrl}/${id}`, selectedPot);
  }

  addPot(pot: Pots): Observable<Pots> {
    return this.http.post<Pots>(this.potsUrl, pot);
  }
}
