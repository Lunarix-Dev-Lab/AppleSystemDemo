import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Appointment,
  AppointmentCreate,
  AppointmentStatus,
  BusinessInfo,
  Slot,
} from './appointment.models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);

  getSchedule(): Observable<BusinessInfo> {
    return this.http.get<BusinessInfo>('/api/v1/slots/schedule');
  }

  getSlots(date: string): Observable<Slot[]> {
    return this.http.get<Slot[]>(`/api/v1/slots?date=${date}`);
  }

  create(data: AppointmentCreate): Observable<Appointment> {
    return this.http.post<Appointment>('/api/v1/appointments', data);
  }

  getByToken(token: string): Observable<Appointment> {
    return this.http.get<Appointment>(`/api/v1/appointments/by-token/${token}`);
  }

  cancelByToken(token: string): Observable<Appointment> {
    return this.http.post<Appointment>(`/api/v1/appointments/cancel/${token}`, {});
  }

  list(status?: AppointmentStatus): Observable<Appointment[]> {
    const qs = status ? `?status=${status}` : '';
    return this.http.get<Appointment[]>(`/api/v1/appointments${qs}`);
  }

  updateStatus(id: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.put<Appointment>(`/api/v1/appointments/${id}/status`, { status });
  }
}
