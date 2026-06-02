import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { Appointment } from '../../core/appointment.models';

@Component({
  selector: 'app-booking-confirm',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-sm">

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
            Recibirás un email de confirmación con todos los detalles y el link para cancelar si lo necesitás.
          </p>

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
          }

          <a routerLink="/catalogo"
             class="block mt-6 py-2.5 rounded-xl border border-gray-200
                    text-sm font-medium text-gray-600
                    hover:bg-gray-50 transition-colors min-h-[44px] flex items-center justify-center">
            Volver al catálogo
          </a>

        </div>
      </div>
    </div>
  `,
})
export class BookingConfirmComponent {
  private readonly platform = inject(PLATFORM_ID);

  readonly appointment = signal<Appointment | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platform)) {
      const state = window.history.state as { appointment?: Appointment };
      if (state?.appointment) {
        this.appointment.set(state.appointment);
      }
    }
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
