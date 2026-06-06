import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Schedule {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8 max-w-3xl">

      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">Horarios de atención</h1>
        <p class="text-sm text-gray-400 mt-1">
          Los cambios se aplican a los nuevos turnos inmediatamente.
        </p>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3,4,5,6,7]; track $index) {
            <div class="h-16 rounded-2xl bg-gray-100 animate-pulse"></div>
          }
        </div>

      } @else if (loadError()) {
        <div class="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl text-center">
          <svg class="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm font-medium text-gray-500 mb-1">No se pudieron cargar los horarios</p>
          <p class="text-xs text-gray-400 mb-5">Verificá que tenés sesión activa e intentá de nuevo.</p>
          <button (click)="loadSchedules()"
                  class="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl
                         hover:bg-gray-800 transition-colors min-h-[44px]">
            Reintentar
          </button>
        </div>

      } @else if (schedules().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl text-center">
          <p class="text-sm text-gray-400">Sin datos de horarios. Reintentá o recargá la página.</p>
          <button (click)="loadSchedules()" class="mt-4 px-5 py-2.5 bg-black text-white text-sm
                 font-medium rounded-xl hover:bg-gray-800 transition-colors min-h-[44px]">
            Reintentar
          </button>
        </div>

      } @else {
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          @for (sch of schedules(); track sch.id; let last = $last) {
            <div class="flex items-center gap-4 px-5 py-4"
                 [class.border-b]="!last"
                 [class.border-gray-50]="!last">

              <!-- Día + toggle -->
              <div class="w-36 flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  (click)="toggleDay(sch)"
                  [disabled]="saving() === sch.id"
                  class="relative inline-flex h-5 w-9 rounded-full transition-colors duration-200
                         focus:outline-none disabled:opacity-50 shrink-0"
                  [class]="sch.is_active ? 'bg-black' : 'bg-gray-200'"
                >
                  <span class="inline-block h-4 w-4 rounded-full bg-white shadow
                               transform transition-transform duration-200 mt-0.5"
                        [class]="sch.is_active ? 'translate-x-4' : 'translate-x-0.5'"></span>
                </button>
                <span class="text-sm font-medium"
                      [class]="sch.is_active ? 'text-gray-900' : 'text-gray-400'">
                  {{ dayName(sch.day_of_week) }}
                </span>
              </div>

              <!-- Horario -->
              @if (sch.is_active) {
                <div class="flex items-center gap-2 flex-1 flex-wrap">
                  <div class="flex items-center gap-1.5">
                    <label [for]="'open_' + sch.id" class="text-xs text-gray-400 w-14">Apertura</label>
                    <input
                      [id]="'open_' + sch.id"
                      type="time"
                      [(ngModel)]="sch.open_time"
                      class="px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-black transition"
                    />
                  </div>
                  <span class="text-gray-300">—</span>
                  <div class="flex items-center gap-1.5">
                    <label [for]="'close_' + sch.id" class="text-xs text-gray-400 w-10">Cierre</label>
                    <input
                      [id]="'close_' + sch.id"
                      type="time"
                      [(ngModel)]="sch.close_time"
                      class="px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-black transition"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  (click)="save(sch)"
                  [disabled]="saving() === sch.id"
                  class="px-4 py-1.5 rounded-lg bg-black text-white text-xs font-medium
                         hover:bg-gray-800 disabled:opacity-40 transition-colors min-h-[32px]"
                >
                  {{ saving() === sch.id ? 'Guardando…' : 'Guardar' }}
                </button>
              } @else {
                <span class="text-sm text-gray-300 flex-1">Cerrado</span>
              }

            </div>
          }
        </div>

        @if (successMsg()) {
          <div class="mt-4 flex items-center gap-2 text-sm text-green-600
                      bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            {{ successMsg() }}
          </div>
        }

        @if (errorMsg()) {
          <div class="mt-4 text-sm text-red-400 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {{ errorMsg() }}
          </div>
        }
      }
    </div>
  `,
})
export class SchedulesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly platform = inject(PLATFORM_ID);

  readonly schedules = signal<Schedule[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal<number | null>(null);
  readonly successMsg = signal('');
  readonly errorMsg = signal('');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platform)) return;
    this.loadSchedules();
  }

  protected loadSchedules(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.http.get<Schedule[]>('/api/v1/schedules').subscribe({
      next: s => { this.schedules.set(s); this.loading.set(false); },
      error: () => { this.loading.set(false); this.loadError.set(true); },
    });
  }

  dayName(dow: number): string {
    return DAY_NAMES[dow] ?? '—';
  }

  toggleDay(sch: Schedule): void {
    const updated = { ...sch, is_active: !sch.is_active };
    this.saveSchedule(updated);
  }

  save(sch: Schedule): void {
    this.saveSchedule(sch);
  }

  private saveSchedule(sch: Schedule): void {
    this.saving.set(sch.id);
    this.successMsg.set('');
    this.errorMsg.set('');

    this.http
      .put<Schedule>(`/api/v1/schedules/${sch.id}`, {
        open_time: sch.open_time,
        close_time: sch.close_time,
        is_active: sch.is_active,
      })
      .subscribe({
        next: updated => {
          this.schedules.update(list =>
            list.map(s => s.id === updated.id ? updated : s)
          );
          this.saving.set(null);
          this.successMsg.set(`${this.dayName(updated.day_of_week)} actualizado correctamente.`);
          setTimeout(() => this.successMsg.set(''), 3000);
        },
        error: err => {
          this.saving.set(null);
          this.errorMsg.set(err.error?.detail ?? 'Error al guardar');
          setTimeout(() => this.errorMsg.set(''), 4000);
        },
      });
  }
}
