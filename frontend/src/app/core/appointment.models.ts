export type AppointmentStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'cancelled'
  | 'rescheduled';

export interface ProductMinimal {
  id: number;
  name: string;
}

export interface Appointment {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  slot_datetime: string;  // ISO naive string: "2025-01-23T09:00:00"
  product_id: number | null;
  status: AppointmentStatus;
  management_token: string;
  notes: string | null;
  created_at: string;
  product: ProductMinimal | null;
}

export interface AppointmentCreate {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  slot_datetime: string;
  product_id?: number | null;
  notes?: string | null;
}

export interface Slot {
  time: string;           // "09:00"
  slot_datetime: string;  // "2025-01-23T09:00:00"
  available: boolean;
  booked: number;
  max: number;
}

export interface ScheduleItem {
  day_of_week: number;  // 0=Mon … 6=Sun
  open_time: string;    // "09:00"
  close_time: string;   // "18:00"
  is_active: boolean;
}

export interface SlotConfig {
  slot_duration_minutes: number;
  max_per_slot: number;
  max_advance_days: number;
}

export interface BusinessInfo {
  schedules: ScheduleItem[];
  config: SlotConfig;
}

export interface CalendarDay {
  date: Date;
  current: boolean;   // belongs to displayed month
  disabled: boolean;
  today: boolean;
}
