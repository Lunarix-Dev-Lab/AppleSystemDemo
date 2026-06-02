import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly platform = inject(PLATFORM_ID);
  private readonly ACCESS_KEY = 'sa_access';
  private readonly REFRESH_KEY = 'sa_refresh';

  setTokens(access: string, refresh: string): void {
    if (!isPlatformBrowser(this.platform)) return;
    localStorage.setItem(this.ACCESS_KEY, access);
    localStorage.setItem(this.REFRESH_KEY, refresh);
  }

  getAccessToken(): string | null {
    if (!isPlatformBrowser(this.platform)) return null;
    return localStorage.getItem(this.ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platform)) return null;
    return localStorage.getItem(this.REFRESH_KEY);
  }

  clear(): void {
    if (!isPlatformBrowser(this.platform)) return;
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
