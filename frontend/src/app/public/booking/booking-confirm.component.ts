import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { Appointment } from '../../core/appointment.models';

@Component({
  selector: 'app-booking-confirm',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-sm space-y-4">

        <!-- ── Tarjeta principal ─────────────────────────────────────── -->
        <div class="bg-white rounded-3xl border border-gray-100 p-8 text-center">

          <!-- Checkmark -->
          <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>

          <h1 class="text-xl font-semibold text-gray-900">¡Turno reservado!</h1>
          <p class="mt-2 text-sm text-gray-400 leading-relaxed">
            Preparate para tu visita. Te enviamos los detalles por email.
          </p>

          <!-- Resumen del turno -->
          @if (appointment(); as apt) {
            <div class="mt-6 bg-gray-50 rounded-2xl p-4 text-left space-y-2.5">
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">Nombre</span>
                <span class="font-medium text-gray-900">{{ apt.guest_name }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">Fecha</span>
                <span class="font-medium text-gray-900 capitalize">{{ formatDate(apt.slot_datetime) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">Horario</span>
                <span class="font-medium text-gray-900">{{ formatTime(apt.slot_datetime) }}</span>
              </div>
              @if (apt.product) {
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Producto</span>
                  <span class="font-medium text-gray-900">{{ apt.product.name }}</span>
                </div>
              }
            </div>

            <!-- CTA principal -->
            <a routerLink="/catalogo"
               class="block mt-6 py-3 rounded-xl bg-black text-white text-sm font-medium
                      hover:bg-gray-800 transition-colors min-h-[48px] flex items-center justify-center">
              Volver al catálogo
            </a>

            <!-- Link de cancelación (discreto) -->
            <a [routerLink]="['/turnos/cancelar', apt.management_token]"
               class="block mt-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ¿Necesitás cancelar el turno?
            </a>

          } @else {
            <!-- Sin estado (el usuario recargó la página) -->
            <p class="mt-4 text-sm text-gray-400 leading-relaxed">
              Los detalles y el link para cancelar están en el email de confirmación.
            </p>

            <a routerLink="/catalogo"
               class="block mt-6 py-3 rounded-xl bg-black text-white text-sm font-medium
                      hover:bg-gray-800 transition-colors min-h-[48px] flex items-center justify-center">
              Volver al catálogo
            </a>

            <a routerLink="/turnos/cancelar"
               class="block mt-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Tengo el código de mi turno →
            </a>
          }
        </div>

        <!-- ── Tarjeta de código (sólo si tenemos el turno) ──────────── -->
        @if (appointment(); as apt) {
          <div class="bg-white rounded-3xl border border-gray-100 px-6 py-5">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Código de turno
            </p>
            <p class="text-xs text-gray-400 mb-3 leading-relaxed">
              Guardalo. Si perdés el email de confirmación, vas a poder cancelar tu turno
              ingresando este código en la sección
              <a routerLink="/turnos/cancelar"
                 class="font-medium text-gray-600 underline hover:text-gray-900">Gestionar mi turno</a>.
            </p>

            <div class="flex items-center gap-2">
              <code class="flex-1 font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200
                           rounded-xl px-3 py-2.5 break-all leading-relaxed select-all">
                {{ apt.management_token }}
              </code>
              <button
                type="button"
                (click)="copyToken(apt.management_token)"
                class="shrink-0 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all min-h-[40px]"
                [class]="copied()
                  ? 'border-green-200 bg-green-50 text-green-600'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'"
              >
                {{ copied() ? '✓ Copiado' : 'Copiar' }}
              </button>
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class BookingConfirmComponent {
  private readonly platform = inject(PLATFORM_ID);

  readonly appointment = signal<Appointment | null>(null);
  readonly copied = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platform)) {
      const state = window.history.state as { appointment?: Appointment };
      if (state?.appointment) {
        this.appointment.set(state.appointment);
      }
    }
  }

  copyToken(token: string): void {
    const done = () => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(token).then(done).catch(() => this._fallbackCopy(token, done));
    } else {
      this._fallbackCopy(token, done);
    }
  }

  private _fallbackCopy(text: string, callback: () => void): void {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(el);
    el.select();
    try { document.execCommand('copy'); callback(); } catch { /* silent */ }
    document.body.removeChild(el);
  }

  formatDate(dt: string): string {
    return this._parse(dt).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  }

  formatTime(dt: string): string {
    return this._parse(dt).toLocaleTimeString('es-AR', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  }

  private _parse(dt: string): Date {
    return new Date(dt.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, ''));
  }
}
