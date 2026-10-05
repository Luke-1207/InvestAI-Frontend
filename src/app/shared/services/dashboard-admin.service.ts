import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardAdminResponse, StatusIa } from '../models/dashboard-admin';

@Injectable({ providedIn: 'root' })
export class DashboardAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard/admin`;

  obterMetricas(): Observable<DashboardAdminResponse> {
    return this.http.get<DashboardAdminResponse>(this.baseUrl);
  }

  obterStatusIa(): Observable<StatusIa> {
    return this.http.get<StatusIa>(`${this.baseUrl}/ia-status`);
  }
}
