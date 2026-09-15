import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AcaoService } from './acao.service';
import { environment } from '../../../environments/environment';

describe('AcaoService', () => {
  let service: AcaoService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/acoes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AcaoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AcaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar deve enviar pagina/tamanho padrão quando nada é informado', () => {
    service.listar({}).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === baseUrl && r.params.get('pagina') === '1' && r.params.get('tamanho') === '20',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true });
  });

  it('listar deve repetir o parâmetro tipo uma vez por valor selecionado', () => {
    service.listar({ tipo: ['ACAO', 'FII'], pagina: 2, tamanho: 12 }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === baseUrl && r.params.getAll('tipo')?.join(',') === 'ACAO,FII',
    );
    expect(req.request.params.get('pagina')).toBe('2');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 1, size: 12, first: true, last: true });
  });

  it('listarSugestoes deve chamar GET /acoes/sugestoes', () => {
    service.listarSugestoes(['FII']).subscribe();

    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/sugestoes`);
    expect(req.request.params.getAll('tipo')).toEqual(['FII']);
    req.flush({ itens: [], mensagem: null });
  });

  it('listarSugestoes sem filtro não deve enviar o parâmetro tipo', () => {
    service.listarSugestoes().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/sugestoes`);
    expect(req.request.params.has('tipo')).toBe(false);
    req.flush({ itens: [], mensagem: null });
  });
});
