import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `http://localhost:3000/api/auth`;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  signup(data: object): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, data).pipe(
      tap({
        next: (res) => {
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Signup Error:', err);
        },
      }),
    );
  }

  login(data: object): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data).pipe(
      tap((result: any) => {
        localStorage.setItem('authUser', JSON.stringify(result));
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('authUser');
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('authUser') !== null;
  }
}
