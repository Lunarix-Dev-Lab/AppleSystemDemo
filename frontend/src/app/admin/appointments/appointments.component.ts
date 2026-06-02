import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { Appointment, AppointmentStatus } from '../../core/appointment.models';
import { AppointmentService } from '../../core/appointment.service';

interface Tab {
  label: string;
  value: AppointmentStatus | null;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8 max-w-6xl mx-auto">

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">Turnos</h1>
        <p class="text-sm text-gray-400 mt-0.5">{{ appointments().length }} en total</p>
      </div>

      <!-- Status tabs -->
      <div class="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
        @for (tab of tabs; track tab.label) {
          <button
            (click)="filterStatus.set(tab.value)"
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            [class]="filterStatus() === tab.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'"
          >
            {{ tab.label }}
            <span class="ml-1.5 text-xs text-gray-400">
              {{ tabCount(tab.value) }}
            </span>
          </button>
        }
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-16 rounded-xl bg-gray-100 animate-pulse"></div>
          }
        </div>
      } @else if (filtered().length === 0) {
        <div class="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-2xl text-center">
          <svg class="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p class="text-sm font-medium text-gray-400">Sin turnos en esta categoría.</p>
        </div>
      } @else {
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th class="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Producto</th>
                <th class="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha y hora</th>
                <th class="text-center px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th class="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              @for (apt of filtered(); track apt.id) {
                <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">

                  <!-- Cliente -->
                  <td class="px-5 py-4">
                    <p class="text-sm font-medium text-gray-900">{{ apt.guest_name }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ apt.guest_email }}</p>
                    @if (apt.guest_phone) {
                      <p class="text-xs text-gray-400">{{ apt.guest_phone }}</p>
                    }
                  </td>

                  <!-- Producto -->
                  <td class="px-5 py-4 hidden sm:table-cell">
                    <span class="text-sm text-gray-600">{{ apt.product?.name ?? '—' }}</span>
                  </td>

                  <!-- Fecha y hora -->
                  <td class="px-5 py-4">
                    <p class="text-sm font-medium text-gray-900 capitalize">{{ formatDate(apt.slot_datetime) }}</p>
                    <p class="text-xs text-gray-400">{{ formatTime(apt.slot_datetime) }}</p>
                  </td>

                  <!-- Estado -->
                  <td class="px-5 py-4 text-center">
                    <span class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                          [class]="statusClass(apt.status)">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="statusDotClass(apt.status)"></span>
                      {{ statusLabel(apt.status) }}
                    </span>
                  </td>

                  <!-- Acciones -->
                  <td class="px-5 py-4">
                    <div class="flex items-center justify-end gap-2">
                      @if (apt.status === 'pending_confirmation') {
                        <button
                          (click)="updateStatus(apt, 'confirmed')"
                          [disabled]="updating() === apt.id"
                          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                 bg-green-50 text-green-600 hover:bg-green-100
                                 text-xs font-medium transition-colors disabled:opacity-40 min-h-[32px]"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          Confirmar
                        </button>
                      }
                      @if (apt.status !== 'cancelled') {
                        <button
                          (click)="updateStatus(apt, 'cancelled')"
                          [disabled]="updating() === apt.id"
                          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                 bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500
                                 text-xs font-medium transition-colors disabled:opacity-40 min-h-[32px]"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                          Cancelar
                        </button>
                      }
                    </div>
                  </td>

                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AppointmentsComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);

  readonly appointments = signal<Appointment[]>([]);
  readonly loading = signal(true);
  readonly updating = signal<number | null>(null);
  readonly filterStatus = signal<AppointmentStatus | null>(null);

  readonly tabs: Tab[] = [
    { label: 'Todos', value: null },
    { label: 'Pendientes', value: 'pending_confirmation' },
    { label: 'Confirmados', value: 'confirmed' },
    { label: 'Cancelados', value: 'cancelled' },
  ];

  readonly filtered = computed(() => {
    const status = this.filterStatus();
    const all = this.appointments();
    return status ? all.filter(a => a.status === status) : all;
  });

  ngOnInit(): void {
    this.appointmentService.list().subscribe({
      next: list => { this.appointments.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  tabCount(status: AppointmentStatus | null): number {
    const all = this.appointments();
    return status ? all.filter(a => a.status === status).length : all.length;
  }

  updateStatus(apt: Appointment, status: AppointmentStatus): void {
    if (status === 'cancelled' && !confirm(`¿Cancelar el turno de ${apt.guest_name}?`)) return;
    this.updating.set(apt.id);
    this.appointmentService.updateStatus(apt.id, status).subscribe({
      next: updated => {
        this.appointments.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.updating.set(null);
      },
      error: () => this.updating.set(null),
    });
  }

  // ── Formatting ────────────────────────────────────────────────────────────

  formatDate(dt: string): string {
    return this._parse(dt).toLocaleDateString('es-AR', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
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

  statusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      pending_confirmation: 'Pendiente',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
      rescheduled: 'Reprogramado',
    };
    return labels[status];
  }

  statusClass(status: AppointmentStatus): string {
    const classes: Record<AppointmentStatus, string> = {
      pending_confirmation: 'bg-amber-50 text-amber-600',
      confirmed: 'bg-green-50 text-green-600',
      cancelled: 'bg-gray-100 text-gray-400',
      rescheduled: 'bg-blue-50 text-blue-600',
    };
    return classes[status];
  }

  statusDotClass(status: AppointmentStatus): string {
    const classes: Record<AppointmentStatus, string> = {
      pending_confirmation: 'bg-amber-400',
      confirmed: 'bg-green-500',
      cancelled: 'bg-gray-400',
      rescheduled: 'bg-blue-500',
    };
    return classes[status];
  }
}
