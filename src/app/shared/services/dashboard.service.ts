import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardResponse } from '../models/dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  readonly dashboard = signal<DashboardResponse | null>(null);

  carregar() {
    return this.http
      .get<DashboardResponse>(`${environment.apiUrl}/dashboard`)
      .pipe(tap((resposta) => this.dashboard.set(resposta)));
  }
}
