import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';

import { TokenStorageService } from './token-storage.service';
import { LoginRequest, TokenResponse, UserProfile } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenStorageService);

  private readonly BASE = '/api/v1/auth';

  readonly currentUser = signal<UserProfile | null>(null);

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.BASE}/login`, credentials).pipe(
      tap(res => {
        this.tokens.setTokens(res.access_token, res.refresh_token);
        this.loadProfile().subscribe();
      }),
    );
  }

  loadProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.BASE}/me`).pipe(
      tap(user => this.currentUser.set(user)),
    );
  }

  refresh(): Observable<TokenResponse> {
    const refreshToken = this.tokens.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    return this.http
      .post<TokenResponse>(`${this.BASE}/refresh`, { refresh_token: refreshToken })
      .pipe(tap(res => this.tokens.setTokens(res.access_token, res.refresh_token)));
  }

  logout(): void {
    this.tokens.clear();
    this.currentUser.set(null);
    this.router.navigate(['/admin/login']);
  }

  isAuthenticated(): boolean {
    return this.tokens.isAuthenticated();
  }
}
