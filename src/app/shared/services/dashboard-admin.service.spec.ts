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

  it('obterStatusIa() deve fazer GET em /dashboard/admin/ia-status', () => {
    const mock = { disponivel: true, rabbitmqConectado: true, verificadoEm: '2026-10-06T14:00:00' };
    let resposta: unknown;

    service.obterStatusIa().subscribe((dados) => (resposta = dados));

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/admin/ia-status`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(resposta).toEqual(mock);
  });
});
