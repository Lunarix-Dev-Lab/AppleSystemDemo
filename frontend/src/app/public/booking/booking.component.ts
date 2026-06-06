import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';

import {
  Appointment,
  BusinessInfo,
  CalendarDay,
  Slot,
} from '../../core/appointment.models';
import { AppointmentService } from '../../core/appointment.service';
import { Product } from '../../core/product.models';
import { ProductService } from '../../core/product.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-xl mx-auto px-4 py-16">

        <!-- Header -->
        <div class="mb-10">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-2">Reservas</p>
          <h1 class="text-4xl font-semibold tracking-tight text-gray-900">Reservar turno</h1>
          <p class="mt-2 text-gray-400">Elegí el día y horario, y te esperamos en el local.</p>

          <!-- QA-RES-002: indicador de cascada de pasos -->
          <div class="flex items-center gap-1.5 mt-5 flex-wrap">
            @for (step of steps; track step.label; let i = $index) {
              <span class="flex items-center gap-1.5">
                <span class="flex items-center gap-1.5 text-xs font-medium"
                      [class]="step.done() ? 'text-gray-900' : 'text-gray-300'">
                  <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        [class]="step.done() ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'">
                    {{ i + 1 }}
                  </span>
                  {{ step.label }}
                </span>
                @if (i < steps.length - 1) {
                  <svg class="w-3 h-3 text-gray-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                }
              </span>
            }
          </div>
        </div>

        @if (loadingData()) {
          <div class="space-y-4">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-32 rounded-2xl bg-gray-200 animate-pulse"></div>
            }
          </div>
        } @else if (loadingError()) {
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <svg class="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm font-medium text-gray-500 mb-1">No se pudo cargar la disponibilidad</p>
            <p class="text-xs text-gray-400 mb-5">Verificá tu conexión e intentá de nuevo.</p>
            <button (click)="_loadData()"
                    class="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl
                           hover:bg-gray-800 transition-colors min-h-[44px]">
              Reintentar
            </button>
          </div>
        } @else {

          <div class="space-y-6">

            <!-- Producto (opcional) -->
            <section class="bg-white rounded-2xl border border-gray-100 p-6">
              <label class="block text-sm font-semibold text-gray-700 mb-3">
                Producto de interés
                <span class="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
              </label>
              <select
                id="product_id"
                [ngModel]="selectedProductId()"
                (ngModelChange)="selectedProductId.set($event)"
                name="product_id"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                       text-gray-700 bg-white
                       focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                       transition appearance-none"
              >
                <option [ngValue]="null">Sin especificar</option>
                @for (p of products(); track p.id) {
                  <option [ngValue]="p.id">{{ p.name }}</option>
                }
              </select>
            </section>

            <!-- Calendario -->
            <section class="bg-white rounded-2xl border border-gray-100 p-6">
              <p class="text-sm font-semibold text-gray-700 mb-4">Fecha</p>

              <!-- Month nav -->
              <div class="flex items-center justify-between mb-4">
                <button type="button" (click)="prevMonth()"
                        [disabled]="!canGoPrev()"
                        class="p-2 rounded-lg hover:bg-gray-100 transition-colors
                               disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px] min-w-[36px]">
                  <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <span class="text-sm font-semibold text-gray-900 capitalize">{{ monthLabel() }}</span>
                <button type="button" (click)="nextMonth()"
                        class="p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[36px] min-w-[36px]">
                  <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              <!-- Day headers (Mon–Sun) -->
              <div class="grid grid-cols-7 mb-1">
                @for (d of ['Lu','Ma','Mi','Ju','Vi','Sá','Do']; track d) {
                  <div class="text-center text-xs font-medium text-gray-400 py-1.5">{{ d }}</div>
                }
              </div>

              <!-- Calendar grid -->
              <div class="grid grid-cols-7 gap-1">
                @for (day of calendarDays(); track day.date.getTime()) {
                  <button
                    type="button"
                    [disabled]="day.disabled || !day.current"
                    (click)="selectDate(day)"
                    class="aspect-square text-sm rounded-xl flex items-center justify-center"
                    [class]="dayClass(day)"
                  >
                    {{ day.current ? day.date.getDate() : '' }}
                  </button>
                }
              </div>

              @if (!schedule()) {
                <p class="mt-3 text-xs text-gray-400 text-center">Cargando horarios…</p>
              }
            </section>

            <!-- Horarios (visible tras elegir fecha) -->
            @if (selectedDate()) {
              <section class="bg-white rounded-2xl border border-gray-100 p-6">
                <p class="text-sm font-semibold text-gray-700 mb-1">Horario</p>
                <p class="text-xs text-gray-400 mb-4 capitalize">{{ formatDate(selectedDate()!) }}</p>

                @if (loadingSlots()) {
                  <div class="flex flex-wrap gap-2">
                    @for (_ of [1,2,3,4,5,6,7,8]; track $index) {
                      <div class="h-9 w-14 rounded-xl bg-gray-100 animate-pulse"></div>
                    }
                  </div>
                } @else if (slots().length === 0) {
                  <p class="text-sm text-gray-400">El local no atiende este día.</p>
                } @else if (allSlotsFull()) {
                  <p class="text-sm text-gray-400">Todos los horarios están completos para este día.</p>
                } @else {
                  <div class="flex flex-wrap gap-2">
                    @for (slot of slots(); track slot.slot_datetime) {
                      <button
                        type="button"
                        [disabled]="!slot.available"
                        (click)="selectSlot(slot)"
                        class="px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150 min-h-[36px]"
                        [class]="slotClass(slot)"
                      >
                        {{ slot.time }}
                      </button>
                    }
                  </div>
                }
              </section>
            }

            <!-- Datos personales -->
            <section class="bg-white rounded-2xl border border-gray-100 p-6">
              <p class="text-sm font-semibold text-gray-700 mb-4">Tus datos</p>

              <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">

                <div>
                  <label for="guest_name" class="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre <span class="text-red-400">*</span>
                  </label>
                  <input id="guest_name" name="guest_name" formControlName="guest_name" type="text"
                         autocomplete="name" placeholder="Juan García" maxlength="30"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                                placeholder:text-gray-300
                                focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"/>
                  @if (form.get('guest_name')?.invalid && form.get('guest_name')?.touched) {
                    <p class="mt-1.5 text-xs text-red-400">Nombre requerido (máx. 30 caracteres)</p>
                  }
                </div>

                <div>
                  <label for="guest_email" class="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span class="text-red-400">*</span>
                  </label>
                  <input id="guest_email" name="guest_email" formControlName="guest_email" type="email"
                         autocomplete="email" placeholder="juan@email.com" maxlength="254"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                                placeholder:text-gray-300
                                focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"/>
                  @if (form.get('guest_email')?.invalid && form.get('guest_email')?.touched) {
                    <p class="mt-1.5 text-xs text-red-400">Email inválido</p>
                  }
                </div>

                <div>
                  <label for="guest_phone" class="block text-sm font-medium text-gray-700 mb-1.5">
                    Teléfono <span class="text-red-400">*</span>
                  </label>
                  <input id="guest_phone" name="guest_phone" formControlName="guest_phone" type="tel"
                         autocomplete="tel" placeholder="ej. 1112345678" maxlength="20"
                         inputmode="numeric"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                                placeholder:text-gray-300
                                focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"/>
                  @if (form.get('guest_phone')?.invalid && form.get('guest_phone')?.touched) {
                    <p class="mt-1.5 text-xs text-red-400">
                      Solo dígitos, entre 7 y 20 números
                    </p>
                  }
                </div>

                <div>
                  <label for="notes" class="block text-sm font-medium text-gray-700 mb-1.5">
                    Notas <span class="text-gray-400 font-normal">(opcional, máx. 30 caracteres)</span>
                  </label>
                  <input id="notes" name="notes" formControlName="notes" type="text" maxlength="30"
                         placeholder="ej. Prefiero turno a la tarde"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                                placeholder:text-gray-300
                                focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"/>
                </div>

                <!-- Validation hint -->
                @if (showMissingHint()) {
                  <p class="text-sm text-amber-500">
                    {{ !selectedDate() ? 'Elegí una fecha.' : !selectedSlot() ? 'Elegí un horario.' : 'Completá los campos requeridos.' }}
                  </p>
                }

                @if (apiError()) {
                  <p class="text-sm text-red-400">{{ apiError() }}</p>
                }

                <button
                  type="submit"
                  [disabled]="submitting()"
                  class="w-full py-3 bg-black text-white text-sm font-medium rounded-xl
                         hover:bg-gray-800 disabled:opacity-40 transition-colors min-h-[48px]"
                >
                  {{ submitting() ? 'Reservando…' : 'Confirmar turno' }}
                </button>

              </form>
            </section>

          </div>
        }

        <!-- Pie: acceso a turno existente -->
        <div class="mt-12 pt-6 border-t border-gray-200 text-center">
          <a routerLink="/turnos/cancelar"
             class="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ¿Ya tenés un turno? Ver o cancelar →
          </a>
        </div>

      </div>
    </div>
  `,
})
export class BookingComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly products = signal<Product[]>([]);
  readonly schedule = signal<BusinessInfo | null>(null);
  readonly loadingData = signal(true);

  readonly viewMonth = signal((() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })());
  readonly selectedDate = signal<Date | null>(null);

  readonly slots = signal<Slot[]>([]);
  readonly loadingSlots = signal(false);
  readonly selectedSlot = signal<string | null>(null);

  readonly selectedProductId = signal<number | null>(null);

  readonly submitting = signal(false);
  readonly apiError = signal('');
  readonly showMissingHint = signal(false);
  readonly loadingError = signal(false);

  readonly form = this.fb.group({
    guest_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
    guest_email: ['', [Validators.required, Validators.email]],
    guest_phone: ['', [Validators.required, Validators.pattern(/^\d{7,20}$/)]],
    notes: ['', Validators.maxLength(30)],
  });

  // QA-RES-002: indicador de cascada de pasos
  readonly steps = [
    { label: 'Producto', done: computed(() => this.selectedProductId() !== null) },
    { label: 'Fecha', done: computed(() => this.selectedDate() !== null) },
    { label: 'Horario', done: computed(() => this.selectedSlot() !== null) },
    { label: 'Datos', done: computed(() => this.form.valid) },
  ];

  // ── Calendar computed ─────────────────────────────────────────────────────

  readonly monthLabel = computed(() =>
    this.viewMonth().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  );

  readonly allSlotsFull = computed(() =>
    this.slots().length > 0 && this.slots().every(s => !s.available)
  );

  readonly canGoPrev = computed(() => {
    const now = new Date();
    const v = this.viewMonth();
    return v.getFullYear() > now.getFullYear() || v.getMonth() > now.getMonth();
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const vm = this.viewMonth();
    const sch = this.schedule();
    const year = vm.getFullYear();
    const m = vm.getMonth();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pre-computar maxDate y Set de días activos una sola vez para toda la grilla
    const maxDate = new Date(today.getTime() + (sch?.config.max_advance_days ?? 0) * 86_400_000);
    const activeDows = new Set((sch?.schedules ?? []).filter(s => s.is_active).map(s => s.day_of_week));

    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7; // Mon=0

    const days: CalendarDay[] = [];

    for (let i = startPad; i > 0; i--) {
      days.push({ date: new Date(year, m, 1 - i), current: false, disabled: true, today: false });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, m, d);
      days.push({
        date,
        current: true,
        disabled: this._isDisabled(date, today, maxDate, activeDows),
        today: date.getTime() === today.getTime(),
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, m + 1, i), current: false, disabled: true, today: false });
    }

    return days;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    // afterNextRender garantiza que los HTTP calls sólo corran en el browser,
    // evitando problemas de SSR con URLs relativas y localStorage.
    afterNextRender(() => this._loadData());
  }

  ngOnInit(): void {
    const productParam = this.route.snapshot.queryParamMap.get('product');
    if (productParam) this.selectedProductId.set(parseInt(productParam, 10));
  }

  protected _loadData(): void {
    this.loadingData.set(true);
    this.loadingError.set(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = this._toDateISO(today);

    forkJoin({
      products: this.productService.list(),
      schedule: this.appointmentService.getSchedule(),
      todaySlots: this.appointmentService.getSlots(todayISO).pipe(catchError(() => of<Slot[]>([]))),
    }).subscribe({
      next: ({ products, schedule, todaySlots }) => {
        this.products.set(products);
        this.schedule.set(schedule);

        const maxDate = new Date(today.getTime() + schedule.config.max_advance_days * 86_400_000);
        const activeDows = new Set(schedule.schedules.filter(s => s.is_active).map(s => s.day_of_week));
        if (todaySlots.length > 0 && !this._isDisabled(today, today, maxDate, activeDows)) {
          this.selectedDate.set(today);
          this.slots.set(todaySlots);
        }

        this.loadingData.set(false);
      },
      error: () => {
        this.loadingData.set(false);
        this.loadingError.set(true);
      },
    });
  }

  // ── Calendar actions ──────────────────────────────────────────────────────

  prevMonth(): void {
    if (!this.canGoPrev()) return;
    const v = this.viewMonth();
    this.viewMonth.set(new Date(v.getFullYear(), v.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const v = this.viewMonth();
    this.viewMonth.set(new Date(v.getFullYear(), v.getMonth() + 1, 1));
  }

  selectDate(day: CalendarDay): void {
    if (day.disabled) return;
    this.selectedDate.set(day.date);
    this.selectedSlot.set(null);
    this.slots.set([]);
    this.loadingSlots.set(true);

    const iso = this._toDateISO(day.date);
    this.appointmentService.getSlots(iso).subscribe({
      next: s => { this.slots.set(s); this.loadingSlots.set(false); },
      error: () => this.loadingSlots.set(false),
    });
  }

  selectSlot(slot: Slot): void {
    if (!slot.available) return;
    this.selectedSlot.set(slot.slot_datetime);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submit(): void {
    this.showMissingHint.set(false);
    this.apiError.set('');
    this.form.markAllAsTouched();

    if (!this.selectedDate() || !this.selectedSlot() || this.form.invalid) {
      this.showMissingHint.set(true);
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      guest_name: raw.guest_name!,
      guest_email: raw.guest_email!,
      guest_phone: raw.guest_phone!,
      slot_datetime: this.selectedSlot()!,
      product_id: this.selectedProductId() ?? null,
      notes: raw.notes || null,
    };

    this.submitting.set(true);
    this.appointmentService.create(payload).subscribe({
      next: (apt: Appointment) => {
        this.router.navigate(['/reservar/confirmado'], { state: { appointment: apt } });
      },
      error: err => {
        this.apiError.set(err.error?.detail ?? 'Error al reservar el turno. Intentá de nuevo.');
        this.submitting.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  dayClass(day: CalendarDay): string {
    if (!day.current) return 'invisible';

    const sel = this.selectedDate();
    const isSelected =
      sel &&
      sel.getFullYear() === day.date.getFullYear() &&
      sel.getMonth() === day.date.getMonth() &&
      sel.getDate() === day.date.getDate();

    if (isSelected) return 'bg-black text-white font-semibold cursor-pointer';
    if (day.disabled) return 'text-gray-300 line-through cursor-not-allowed';
    if (day.today) return 'border-2 border-black text-black font-semibold hover:bg-gray-100 cursor-pointer';
    return 'text-gray-700 hover:bg-gray-100 cursor-pointer';
  }

  slotClass(slot: Slot): string {
    if (!slot.available) return 'bg-gray-100 text-gray-300 cursor-not-allowed';
    if (this.selectedSlot() === slot.slot_datetime) return 'bg-black text-white';
    return 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  private _toDateISO(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private _isDisabled(date: Date, today: Date, maxDate: Date, activeDows: Set<number>): boolean {
    if (date < today) return true;
    if (date > maxDate) return true;
    return !activeDows.has((date.getDay() + 6) % 7); // Mon=0 … Sun=6
  }
}
