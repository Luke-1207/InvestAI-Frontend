import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RendaFixaService } from './renda-fixa.service';
import { environment } from '../../../environments/environment';

describe('RendaFixaService', () => {
  let service: RendaFixaService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/renda-fixa`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RendaFixaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RendaFixaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar deve enviar o modo escolhido como query param', () => {
    service.listar('inteligente').subscribe();

    const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('modo') === 'inteligente');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listar em modo livre também deve enviar o parâmetro explicitamente', () => {
    service.listar('livre').subscribe();

    const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('modo') === 'livre');
    req.flush([]);
  });

  it('obterDetalhePrivado deve chamar GET /renda-fixa/titulos/{id}', () => {
    service.obterDetalhePrivado('abc-123').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/titulos/abc-123`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('obterDetalheTesouro deve chamar GET /renda-fixa/tesouro/{codigo}', () => {
    service.obterDetalheTesouro('tesouro-selic-2029').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/tesouro/tesouro-selic-2029`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
