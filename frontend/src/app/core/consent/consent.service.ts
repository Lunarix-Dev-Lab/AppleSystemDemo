import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { THEME } from '../../../theme.config';

type ConsentState = 'granted' | 'denied';
const STORAGE_KEY = 'sa_cookie_consent';

/**
 * Gestiona el consentimiento de cookies y carga Google Analytics SOLO si el
 * visitante aceptó. Enfoque opt-in (privacy-first): si nunca aceptó, GA no se
 * carga y no se setea ninguna cookie de analítica.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly platform = inject(PLATFORM_ID);
  readonly isBrowser = isPlatformBrowser(this.platform);
  private gaLoaded = false;

  /** null = el visitante todavía no decidió → se muestra el banner. */
  readonly consent = signal<ConsentState | null>(null);

  constructor() {
    if (!this.isBrowser) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') {
      this.consent.set(stored);
      if (stored === 'granted') this.loadAnalytics();
    }
  }

  /** El visitante acepta cookies de analítica. */
  accept(): void {
    this.persist('granted');
    this.loadAnalytics();
  }

  /** El visitante rechaza. No se carga GA y se limpian cookies previas. */
  reject(): void {
    this.persist('denied');
    this.clearAnalyticsCookies();
  }

  /** Reabre el banner para que el visitante cambie su elección. */
  reopen(): void {
    this.consent.set(null);
  }

  private persist(state: ConsentState): void {
    if (this.isBrowser) localStorage.setItem(STORAGE_KEY, state);
    this.consent.set(state);
  }

  private loadAnalytics(): void {
    if (!this.isBrowser || this.gaLoaded) return;
    const id = THEME.analytics.googleAnalyticsId;
    if (!id) return; // sin ID configurado no se carga nada
    this.gaLoaded = true;

    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(tag);

    const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer.push(arguments);
    };
    w.gtag('js', new Date());
    // anonymize_ip: minimiza el dato personal enviado a Google.
    w.gtag('config', id, { anonymize_ip: true });
  }

  private clearAnalyticsCookies(): void {
    if (!this.isBrowser) return;
    const host = location.hostname;
    const scopes = [`; domain=${host}`, `; domain=.${host}`, ''];
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_ga') || name === '_gid') {
        scopes.forEach(scope => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${scope}`;
        });
      }
    });
  }
}
