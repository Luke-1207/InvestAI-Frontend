import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GestaoIndicadoresService } from './gestao-indicadores.service';
import { DashboardService } from './dashboard.service';
import { environment } from '../../../environments/environment';
import { DashboardResponse, IndicadoresMercado } from '../models/dashboard';

const INDICADORES: IndicadoresMercado = {
  ibovespaPontos: 131245, ibovespaVariacaoDia: 0.5, dolarValor: 5.42, dolarVariacaoDia: 0.1, euroValor: 5.91,
  euroVariacaoDia: 0.2, selicAtual: 14.25, ipcaAcumulado12m: 4.6, sincronizadoEm: '2026-10-20T10:00:00',
  selicIpcaSincronizadoEm: '2026-10-20T20:00:00',
};

describe('GestaoIndicadoresService', () => {
  let service: GestaoIndicadoresService;
  let dashboard: DashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(GestaoIndicadoresService);
    dashboard = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deve mandar Selic e IPCA no PATCH e já atualizar os indicadores do topo da tela', () => {
    dashboard.dashboard.set({ indicadoresMercado: { ...INDICADORES, selicAtual: 15 } } as DashboardResponse);

    service.atualizarSelicIpca({ selicAtual: 14.25, ipcaAcumulado12m: 4.6 }).subscribe();
    const req = http.expectOne({ method: 'PATCH', url: `${environment.apiUrl}/dashboard/indicadores/selic-ipca` });
    expect(req.request.body).toEqual({ selicAtual: 14.25, ipcaAcumulado12m: 4.6 });
    req.flush(INDICADORES);

    expect(dashboard.dashboard()!.indicadoresMercado.selicAtual).toBe(14.25);
  });

  it('sem dashboard carregado não deve criar um dashboard vazio', () => {
    service.atualizarSelicIpca({ selicAtual: 14.25, ipcaAcumulado12m: 4.6 }).subscribe();
    http.expectOne(`${environment.apiUrl}/dashboard/indicadores/selic-ipca`).flush(INDICADORES);

    expect(dashboard.dashboard()).toBeNull();
  });
});
