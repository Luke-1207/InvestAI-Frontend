import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FavoritoService } from './favorito.service';
import { environment } from '../../../environments/environment';

describe('FavoritoService', () => {
  let service: FavoritoService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/favoritos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FavoritoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FavoritoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar deve fazer GET na raiz', () => {
    service.listar().subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('adicionar deve enviar a referência do ativo', () => {
    service.adicionar({ tipoAtivo: 'ACAO_FII_ETF', codigo: 'PETR4' }).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ tipoAtivo: 'ACAO_FII_ETF', codigo: 'PETR4' });
    req.flush({});
  });

  it('status deve mandar só os parâmetros informados', () => {
    service.status({ tipoAtivo: 'TITULO_PRIVADO', ativoId: 'abc' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/status`);
    expect(req.request.params.get('tipoAtivo')).toBe('TITULO_PRIVADO');
    expect(req.request.params.get('ativoId')).toBe('abc');
    expect(req.request.params.has('codigo')).toBeFalse();
    req.flush({ favoritado: false, favoritoId: null });
  });

  it('remover deve fazer DELETE pelo id', () => {
    service.remover('f1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/f1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('configurarAlertas deve fazer PUT com a configuração', () => {
    const configuracao = { alertasAtivos: true, tiposAlertaAtivos: null, limiarVariacao: 3 };
    service.configurarAlertas('f1', configuracao).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/f1/alertas`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(configuracao);
    req.flush({});
  });
});
