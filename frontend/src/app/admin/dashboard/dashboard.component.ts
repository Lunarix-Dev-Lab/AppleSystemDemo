import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

interface Stats {
  products: number;
  today_appointments: number;
  pending_appointments: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8 max-w-4xl">
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
        @if (auth.currentUser(); as user) {
          <p class="text-sm text-gray-400 mt-1">Bienvenido, {{ user.full_name }}</p>
        }
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <!-- Productos activos -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Productos</p>
            <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
          @if (loading()) {
            <div class="h-9 w-12 rounded-lg bg-gray-100 animate-pulse"></div>
          } @else {
            <p class="text-3xl font-semibold text-gray-900">{{ stats().products }}</p>
            <p class="text-xs text-gray-400 mt-1">activos en catálogo</p>
          }
        </div>

        <!-- Turnos hoy -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Turnos hoy</p>
            <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
          @if (loading()) {
            <div class="h-9 w-12 rounded-lg bg-gray-100 animate-pulse"></div>
          } @else {
            <p class="text-3xl font-semibold text-gray-900">{{ stats().today_appointments }}</p>
            <p class="text-xs text-gray-400 mt-1">reservados para hoy</p>
          }
        </div>

        <!-- Pendientes de confirmar -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pendientes</p>
            <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          @if (loading()) {
            <div class="h-9 w-12 rounded-lg bg-gray-100 animate-pulse"></div>
          } @else {
            <p class="text-3xl font-semibold"
               [class]="stats().pending_appointments > 0 ? 'text-amber-500' : 'text-gray-900'">
              {{ stats().pending_appointments }}
            </p>
            <p class="text-xs text-gray-400 mt-1">esperando confirmación</p>
          }
        </div>

      </div>

      @if (stats().pending_appointments > 0 && !loading()) {
        <div class="mt-6 flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
          <svg class="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm text-amber-700">
            Tenés <strong>{{ stats().pending_appointments }}</strong>
            {{ stats().pending_appointments === 1 ? 'turno pendiente' : 'turnos pendientes' }} de confirmación.
          </p>
          <a routerLink="/admin/turnos"
             class="ml-auto text-xs font-semibold text-amber-600 hover:text-amber-800 whitespace-nowrap">
            Ver turnos →
          </a>
        </div>
      }
    </div>
  `,
  imports: [RouterLink],
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly platform = inject(PLATFORM_ID);

  readonly stats = signal<Stats>({ products: 0, today_appointments: 0, pending_appointments: 0 });
  readonly loading = signal(true);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platform)) return;
    if (!this.auth.currentUser()) {
      this.auth.loadProfile().subscribe();
    }
    this.http.get<Stats>('/api/v1/stats').subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
