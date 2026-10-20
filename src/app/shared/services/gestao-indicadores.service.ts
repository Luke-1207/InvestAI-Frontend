import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IndicadoresMercado } from '../models/dashboard';
import { SelicIpca } from '../models/gestao-usuarios';
import { DashboardService } from './dashboard.service';

@Injectable({ providedIn: 'root' })
export class GestaoIndicadoresService {
  private readonly http = inject(HttpClient);
  private readonly dashboardService = inject(DashboardService);

  atualizarSelicIpca(valores: SelicIpca): Observable<IndicadoresMercado> {
    return this.http
      .patch<IndicadoresMercado>(`${environment.apiUrl}/dashboard/indicadores/selic-ipca`, valores)
      .pipe(
        tap((indicadores) =>
          this.dashboardService.dashboard.update((atual) => (atual ? { ...atual, indicadoresMercado: indicadores } : atual)),
        ),
      );
  }
}
