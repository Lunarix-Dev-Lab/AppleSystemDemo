import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { Appointment } from '../../core/appointment.models';
import { AppointmentService } from '../../core/appointment.service';

@Component({
  selector: 'app-cancel',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-sm">

        @if (loading()) {
          <div class="bg-white rounded-3xl p-8 flex justify-center">
            <div class="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
          </div>

        } @else if (error()) {
          <div class="bg-white rounded-3xl border border-gray-100 p-8 text-center">
            <p class="text-sm text-red-400 mb-4">{{ error() }}</p>
            <a routerLink="/catalogo"
               class="block py-2.5 rounded-xl border border-gray-200 text-sm font-medium
                      text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]
                      flex items-center justify-center">
              Volver al catálogo
            </a>
          </div>

        } @else if (cancelled()) {
          <!-- Already cancelled or just cancelled -->
          <div class="bg-white rounded-3xl border border-gray-100 p-8 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h1 class="text-xl font-semibold text-gray-900">Turno cancelado</h1>
            <p class="mt-2 text-sm text-gray-400">Tu turno fue cancelado correctamente.</p>
            <a routerLink="/reservar"
               class="block mt-6 py-3 rounded-xl bg-black text-white text-sm font-medium
                      hover:bg-gray-800 transition-colors min-h-[48px] flex items-center justify-center">
              Reservar nuevo turno
            </a>
            <a routerLink="/catalogo"
               class="block mt-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Volver al catálogo
            </a>
          </div>

        } @else {
          <!-- Confirm cancellation -->
          <div class="bg-white rounded-3xl border border-gray-100 p-8">
            <h1 class="text-xl font-semibold text-gray-900 mb-1">Cancelar turno</h1>
            <p class="text-sm text-gray-400 mb-6">¿Confirmás la cancelación de este turno?</p>

            <div class="bg-gray-50 rounded-2xl p-4 space-y-2.5 mb-6">
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">Nombre</span>
                <span class="font-medium text-gray-900">{{ appointment()!.guest_name }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">Fecha</span>
                <span class="font-medium text-gray-900 capitalize">{{ formatDate(appointment()!.slot_datetime) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">Horario</span>
                <span class="font-medium text-gray-900">{{ formatTime(appointment()!.slot_datetime) }}</span>
              </div>
              @if (appointment()!.product; as prod) {
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Producto</span>
                  <span class="font-medium text-gray-900">{{ prod.name }}</span>
                </div>
              }
            </div>

            <div class="flex flex-col gap-3">
              <button (click)="confirm()" [disabled]="cancelling()"
                      class="py-3 rounded-xl bg-red-500 text-white text-sm font-medium
                             hover:bg-red-600 disabled:opacity-40 transition-colors min-h-[48px]">
                {{ cancelling() ? 'Cancelando…' : 'Sí, cancelar turno' }}
              </button>
              <a routerLink="/catalogo"
                 class="py-2.5 rounded-xl border border-gray-200 text-sm font-medium
                        text-gray-600 hover:bg-gray-50 transition-colors
                        text-center min-h-[44px] flex items-center justify-center">
                Mantener el turno
              </a>
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class CancelComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly appointmentService = inject(AppointmentService);
  private readonly platform = inject(PLATFORM_ID);

  readonly loading = signal(true);
  readonly appointment = signal<Appointment | null>(null);
  readonly cancelled = signal(false);
  readonly cancelling = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platform)) {
      this.loading.set(false);
      return;
    }

    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.appointmentService.getByToken(token).subscribe({
      next: apt => {
        if (apt.status === 'cancelled') {
          this.cancelled.set(true);
        } else {
          this.appointment.set(apt);
        }
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.detail ?? 'No se encontró el turno.');
        this.loading.set(false);
      },
    });
  }

  confirm(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.cancelling.set(true);
    this.appointmentService.cancelByToken(token).subscribe({
      next: () => {
        this.cancelled.set(true);
        this.appointment.set(null);
        this.cancelling.set(false);
      },
      error: err => {
        this.error.set(err.error?.detail ?? 'Error al cancelar.');
        this.cancelling.set(false);
      },
    });
  }

  formatDate(dt: string): string {
    return this._parse(dt).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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
