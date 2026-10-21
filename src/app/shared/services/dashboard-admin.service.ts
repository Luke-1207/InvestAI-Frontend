import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChaveIntegracao, DashboardAdminResponse, SaudeIntegracoes, StatusIntegracao } from '../models/dashboard-admin';

@Injectable({ providedIn: 'root' })
export class DashboardAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard/admin`;

  obterMetricas(): Observable<DashboardAdminResponse> {
    return this.http.get<DashboardAdminResponse>(this.baseUrl);
  }

  obterIntegracoes(): Observable<SaudeIntegracoes> {
    return this.http.get<SaudeIntegracoes>(`${this.baseUrl}/integracoes`);
  }

  verificarIntegracoes(): Observable<SaudeIntegracoes> {
    return this.http.post<SaudeIntegracoes>(`${this.baseUrl}/integracoes/verificar`, null);
  }

  verificarIntegracao(chave: ChaveIntegracao): Observable<StatusIntegracao> {
    return this.http.post<StatusIntegracao>(`${this.baseUrl}/integracoes/${chave}/verificar`, null);
  }
}
