import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from './dashboard.service';
import { environment } from '../../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve começar com o dashboard nulo', () => {
    expect(service.dashboard()).toBeNull();
  });

  it('carregar() deve fazer GET em /dashboard e popular o signal', () => {
    const mock = { indicadoresMercado: {}, sugestoesRendaVariavel: { itens: [], mensagem: null }, sugestoesRendaFixa: { itens: [], mensagem: null }, perfil: {}, geradoEm: '' };

    service.carregar().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(service.dashboard()).toEqual(mock as any);
  });
});
