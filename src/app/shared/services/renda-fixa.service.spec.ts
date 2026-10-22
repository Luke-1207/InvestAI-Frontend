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

  it('simular deve usar o endpoint de título privado quando o identificador é um UUID', () => {
    service.simular('123e4567-e89b-12d3-a456-426614174000', 1000, 12).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/titulos/123e4567-e89b-12d3-a456-426614174000/simulacao`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('valor')).toBe('1000');
    expect(req.request.params.get('prazoMeses')).toBe('12');
    req.flush({});
  });

  it('simular deve usar o endpoint do Tesouro quando o identificador é um código', () => {
    service.simular('IPCA2035', 250.5, 24).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/tesouro/IPCA2035/simulacao`);
    expect(req.request.params.get('valor')).toBe('250.5');
    expect(req.request.params.get('prazoMeses')).toBe('24');
    req.flush({});
  });
});
