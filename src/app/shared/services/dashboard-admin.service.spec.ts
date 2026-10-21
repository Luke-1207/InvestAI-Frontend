import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardAdminService } from './dashboard-admin.service';
import { environment } from '../../../environments/environment';

describe('DashboardAdminService', () => {
  let service: DashboardAdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardAdminService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('obterMetricas() deve fazer GET em /dashboard/admin', () => {
    const mock = { totalUsuarios: 10, titulosVencendo: [] };
    let resposta: unknown;

    service.obterMetricas().subscribe((dados) => (resposta = dados));

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/admin`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(resposta).toEqual(mock);
  });

  it('obterIntegracoes() deve fazer GET em /dashboard/admin/integracoes', () => {
    const mock = { integracoes: [], verificadoEm: '2026-10-21T19:00:00' };
    let resposta: unknown;

    service.obterIntegracoes().subscribe((dados) => (resposta = dados));

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/admin/integracoes`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(resposta).toEqual(mock);
  });

  it('verificarIntegracoes() deve fazer POST em /dashboard/admin/integracoes/verificar', () => {
    const mock = { integracoes: [], verificadoEm: '2026-10-21T19:00:00' };
    let resposta: unknown;

    service.verificarIntegracoes().subscribe((dados) => (resposta = dados));

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/admin/integracoes/verificar`);
    expect(req.request.method).toBe('POST');
    req.flush(mock);

    expect(resposta).toEqual(mock);
  });

  it('verificarIntegracao() deve fazer POST na rota da integração pedida', () => {
    const mock = { chave: 'LLM', nome: 'LLM (Groq)', situacao: 'OPERACIONAL' };
    let resposta: unknown;

    service.verificarIntegracao('LLM').subscribe((dados) => (resposta = dados));

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/admin/integracoes/LLM/verificar`);
    expect(req.request.method).toBe('POST');
    req.flush(mock);

    expect(resposta).toEqual(mock);
  });
});
