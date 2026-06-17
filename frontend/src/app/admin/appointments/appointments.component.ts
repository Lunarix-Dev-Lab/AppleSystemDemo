import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Appointment, AppointmentStatus } from '../../core/appointment.models';
import { AppointmentService } from '../../core/appointment.service';

interface Tab {
  label: string;
  value: AppointmentStatus | null;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 sm:p-8 max-w-6xl mx-auto">

      <!-- Header -->
      <div class="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Turnos</h1>
          <p class="text-sm text-gray-400 mt-0.5">{{ appointments().length }} en total</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">

          <!-- orden por fecha -->
          <button (click)="toggleSort()"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                         border border-gray-200 text-gray-600 hover:bg-gray-50
                         transition-colors min-h-[40px]"
                  [attr.aria-label]="sortDir() === 'desc' ? 'Ordenar: más recientes primero' : 'Ordenar: más antiguos primero'">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M7 16V4m0 0L4 7m3-3l3 3M17 8v12m0 0l3-3m-3 3l-3-3"/>
            </svg>
            {{ sortDir() === 'desc' ? 'Más recientes' : 'Más antiguos' }}
          </button>

          <!-- limpiar cancelados -->
          @if (cancelledCount() > 0) {
            <button (click)="deleteCancelled()"
                    class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                           border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-500
                           transition-colors min-h-[40px]">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Limpiar cancelados ({{ cancelledCount() }})
            </button>
          }

          <!-- filtro activos / todos -->
          <button (click)="toggleActive()"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                         transition-colors min-h-[40px]"
                  [class]="onlyActive()
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
            </svg>
            {{ onlyActive() ? 'Ver todos' : 'Solo activos' }}
          </button>
        </div>
      </div>

      <!-- Status tabs -->
      <div class="flex flex-wrap gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit max-w-full">
        @for (tab of tabs; track tab.label) {
          <button
            (click)="filterStatus.set(tab.value)"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            [class]="filterStatus() === tab.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'"
          >
            {{ tab.label }}
            <span class="ml-1.5 text-xs text-gray-400">{{ tabCount(tab.value) }}</span>
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

        <!-- Mobile: tarjetas -->
        <div class="md:hidden space-y-3">
          @for (apt of filtered(); track apt.id) {
            <div class="bg-white rounded-2xl border border-gray-100 p-4">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ apt.guest_name }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ apt.guest_email }}</p>
                  <p class="text-xs text-gray-400">{{ apt.guest_phone }}</p>
                </div>
                <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                      [class]="statusClass(apt.status)">
                  <span class="w-1.5 h-1.5 rounded-full" [class]="statusDotClass(apt.status)"></span>
                  {{ statusLabel(apt.status) }}
                </span>
              </div>

              <div class="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span class="capitalize">{{ formatDate(apt.slot_datetime) }} · {{ formatTime(apt.slot_datetime) }}</span>
              </div>
              @if (apt.product) {
                <p class="mt-1.5 text-xs text-gray-500">Producto: {{ apt.product.name }}</p>
              }
              @if (apt.notes) {
                <p class="mt-1 text-xs text-gray-500 italic">"{{ apt.notes }}"</p>
              }

              @if (apt.status !== 'cancelled' && apt.status !== 'realizado') {
                <div class="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  @if (apt.status === 'pending_confirmation') {
                    <button (click)="updateStatus(apt, 'confirmed')" [disabled]="updating() === apt.id"
                            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                                   bg-green-50 text-green-600 hover:bg-green-100
                                   text-xs font-medium transition-colors disabled:opacity-40 min-h-[40px]">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      Confirmar
                    </button>
                  }
                  @if (apt.status === 'confirmed') {
                    <button (click)="updateStatus(apt, 'realizado')" [disabled]="updating() === apt.id"
                            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                                   bg-teal-50 text-teal-600 hover:bg-teal-100
                                   text-xs font-medium transition-colors disabled:opacity-40 min-h-[40px]">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Realizado
                    </button>
                  }
                  <button (click)="openCancelModal(apt)" [disabled]="updating() === apt.id"
                          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                                 bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500
                                 text-xs font-medium transition-colors disabled:opacity-40 min-h-[40px]">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    Cancelar
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Desktop: tabla -->
        <div class="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th class="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Producto</th>
                <th class="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha y hora</th>
                <th class="text-center px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th class="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              @for (apt of filtered(); track apt.id) {
                <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">

                  <!-- Cliente + notas inline -->
                  <td class="px-4 py-4">
                    <p class="text-sm font-medium text-gray-900">{{ apt.guest_name }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ apt.guest_email }}</p>
                    <p class="text-xs text-gray-400">{{ apt.guest_phone }}</p>
                    @if (apt.notes) {
                      <p class="text-xs text-gray-500 italic mt-1">{{ apt.notes }}</p>
                    }
                  </td>

                  <!-- Producto -->
                  <td class="px-4 py-4 hidden sm:table-cell">
                    <span class="text-sm text-gray-600">{{ apt.product?.name ?? '—' }}</span>
                  </td>

                  <!-- Fecha y hora -->
                  <td class="px-4 py-4">
                    <p class="text-sm font-medium text-gray-900 capitalize">{{ formatDate(apt.slot_datetime) }}</p>
                    <p class="text-xs text-gray-400">{{ formatTime(apt.slot_datetime) }}</p>
                  </td>

                  <!-- Estado -->
                  <td class="px-4 py-4 text-center">
                    <span class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                          [class]="statusClass(apt.status)">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="statusDotClass(apt.status)"></span>
                      {{ statusLabel(apt.status) }}
                    </span>
                  </td>

                  <!-- Acciones -->
                  <td class="px-4 py-4">
                    <div class="flex items-center justify-end gap-2 flex-wrap">

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

                      @if (apt.status === 'confirmed') {
                        <!-- QA-ADM-001: marcar como realizado -->
                        <button
                          (click)="updateStatus(apt, 'realizado')"
                          [disabled]="updating() === apt.id"
                          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                 bg-teal-50 text-teal-600 hover:bg-teal-100
                                 text-xs font-medium transition-colors disabled:opacity-40 min-h-[32px]"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Realizado
                        </button>
                      }

                      @if (apt.status !== 'cancelled' && apt.status !== 'realizado') {
                        <!-- QA-ADM-005: abre modal para ingresar motivo antes de cancelar -->
                        <button
                          (click)="openCancelModal(apt)"
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

    <!-- Toast de feedback -->
    @if (successMsg()) {
      <div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2
                  bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
        <svg class="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
        {{ successMsg() }}
      </div>
    }

    <!-- QA-ADM-005: modal de motivo de cancelación -->
    @if (cancelTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" (click)="closeCancelModal()"></div>
        <div class="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-1">Cancelar turno</h3>
          <p class="text-sm text-gray-400 mb-4">
            Podés incluir un motivo. El cliente lo recibirá en el email de cancelación.
          </p>
          <label for="cancel-reason" class="block text-sm font-medium text-gray-700 mb-1.5">
            Motivo <span class="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            id="cancel-reason"
            autocomplete="off"
            [ngModel]="cancelReason()"
            (ngModelChange)="cancelReason.set($event)"
            rows="3"
            maxlength="300"
            placeholder="Ej: Por inconvenientes del local, lamentamos el aviso..."
            class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none
                   focus:outline-none focus:ring-2 focus:ring-black transition mb-4"
          ></textarea>
          <div class="flex gap-3">
            <button (click)="closeCancelModal()"
                    class="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm
                           text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]">
              Volver
            </button>
            <button (click)="confirmCancel()"
                    [disabled]="updating() !== null"
                    class="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium
                           hover:bg-red-600 disabled:opacity-40 transition-colors min-h-[44px]">
              {{ updating() ? 'Cancelando…' : 'Cancelar turno' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AppointmentsComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly platform = inject(PLATFORM_ID);

  readonly appointments = signal<Appointment[]>([]);
  readonly loading = signal(true);
  readonly updating = signal<number | null>(null);
  readonly filterStatus = signal<AppointmentStatus | null>(null);

  // Filtro activos por defecto
  readonly onlyActive = signal(true);

  // Orden por fecha del turno: 'desc' = más recientes primero
  readonly sortDir = signal<'desc' | 'asc'>('desc');

  // Toast de feedback (cancelar/confirmar/realizado)
  readonly successMsg = signal('');

  // QA-ADM-005: modal de motivo de cancelación
  readonly cancelTarget = signal<Appointment | null>(null);
  readonly cancelReason = signal('');

  // QA-ADM-001 + QA-ADM-003: tabs con "Realizados" + QA-ADM-007: "Activos"
  readonly tabs: Tab[] = [
    { label: 'Todos', value: null },
    { label: 'Pendientes', value: 'pending_confirmation' },
    { label: 'Confirmados', value: 'confirmed' },
    { label: 'Realizados', value: 'realizado' },
    { label: 'Cancelados', value: 'cancelled' },
  ];

  readonly cancelledCount = computed(() =>
    this.appointments().filter(a => a.status === 'cancelled').length
  );

  readonly filtered = computed(() => {
    const status = this.filterStatus();
    const active = this.onlyActive();
    const dir = this.sortDir();
    let list = this.appointments();
    // Si hay una tab específica seleccionada, toma prioridad sobre el filtro activos
    if (status) list = list.filter(a => a.status === status);
    else if (active) list = list.filter(a =>
      a.status === 'pending_confirmation' || a.status === 'confirmed'
    );
    // Orden por fecha del turno (copia para no mutar la señal)
    return [...list].sort((a, b) => {
      const diff = this._parse(a.slot_datetime).getTime() - this._parse(b.slot_datetime).getTime();
      return dir === 'desc' ? -diff : diff;
    });
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platform)) return;
    this.appointmentService.list().subscribe({
      next: list => { this.appointments.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  deleteCancelled(): void {
    const count = this.cancelledCount();
    if (!confirm(`¿Eliminar definitivamente los ${count} turno(s) cancelado(s)? Esta acción no se puede deshacer.`)) return;
    this.appointmentService.deleteCancelled().subscribe({
      next: () => {
        this.appointments.update(list => list.filter(a => a.status !== 'cancelled'));
        if (this.filterStatus() === 'cancelled') this.filterStatus.set(null);
      },
    });
  }

  toggleActive(): void {
    const next = !this.onlyActive();
    this.onlyActive.set(next);
    if (next) this.filterStatus.set(null); // volver a "Todos" al activar el filtro
  }

  toggleSort(): void {
    this.sortDir.update(d => (d === 'desc' ? 'asc' : 'desc'));
  }

  private _notify(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  tabCount(status: AppointmentStatus | null): number {
    const all = this.appointments();
    if (!status) return all.length;
    return all.filter(a => a.status === status).length;
  }

  openCancelModal(apt: Appointment): void {
    this.cancelTarget.set(apt);
    this.cancelReason.set('');
  }

  closeCancelModal(): void {
    this.cancelTarget.set(null);
    this.cancelReason.set('');
  }

  confirmCancel(): void {
    const apt = this.cancelTarget();
    if (!apt) return;
    this.updating.set(apt.id);
    this.appointmentService.updateStatus(apt.id, 'cancelled', this.cancelReason() || undefined).subscribe({
      next: updated => {
        this.appointments.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.updating.set(null);
        this.closeCancelModal();
        this._notify('Turno cancelado exitosamente.');
      },
      error: () => this.updating.set(null),
    });
  }

  updateStatus(apt: Appointment, status: AppointmentStatus): void {
    this.updating.set(apt.id);
    this.appointmentService.updateStatus(apt.id, status).subscribe({
      next: updated => {
        this.appointments.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.updating.set(null);
        this._notify(
          status === 'confirmed' ? 'Turno confirmado exitosamente.'
          : status === 'realizado' ? 'Turno marcado como realizado.'
          : 'Turno actualizado.'
        );
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
      realizado: 'Realizado',
    };
    return labels[status] ?? status;
  }

  statusClass(status: AppointmentStatus): string {
    const classes: Record<AppointmentStatus, string> = {
      pending_confirmation: 'bg-amber-50 text-amber-600',
      confirmed: 'bg-green-50 text-green-600',
      cancelled: 'bg-gray-100 text-gray-400',
      rescheduled: 'bg-blue-50 text-blue-600',
      realizado: 'bg-teal-50 text-teal-600',
    };
    return classes[status] ?? 'bg-gray-100 text-gray-400';
  }

  statusDotClass(status: AppointmentStatus): string {
    const classes: Record<AppointmentStatus, string> = {
      pending_confirmation: 'bg-amber-400',
      confirmed: 'bg-green-500',
      cancelled: 'bg-gray-400',
      rescheduled: 'bg-blue-500',
      realizado: 'bg-teal-500',
    };
    return classes[status] ?? 'bg-gray-400';
  }
}
