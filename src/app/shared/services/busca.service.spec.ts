import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BuscaService } from './busca.service';
import { environment } from '../../../environments/environment';
import { ResultadoBusca, rotaDoResultado } from '../models/busca';

describe('BuscaService', () => {
  let service: BuscaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BuscaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('buscar deve chamar GET /busca com o termo e o limite padrão de 8', () => {
    const resultados: ResultadoBusca[] = [
      { grupo: 'RENDA_VARIAVEL', categoria: 'ACAO', identificador: 'PETR4', codigo: 'PETR4', nome: 'Petrobras PN', detalhe: null },
    ];
    let recebido: ResultadoBusca[] = [];
    service.buscar('petr').subscribe((r) => (recebido = r));

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/busca` && r.params.get('termo') === 'petr' && r.params.get('limite') === '8',
    );
    expect(req.request.method).toBe('GET');
    req.flush(resultados);

    expect(recebido).toEqual(resultados);
  });

  it('buscar deve repassar o limite informado', () => {
    service.buscar('tesouro', 3).subscribe();

    httpMock.expectOne((r) => r.params.get('limite') === '3').flush([]);
  });

  it('rotaDoResultado deve levar renda variável pelo código e renda fixa pelo identificador', () => {
    expect(
      rotaDoResultado({ grupo: 'RENDA_VARIAVEL', categoria: 'FII', identificador: 'HGLG11', codigo: 'HGLG11', nome: 'CSHG', detalhe: null }),
    ).toEqual(['/renda-variavel', 'HGLG11']);
    expect(
      rotaDoResultado({ grupo: 'RENDA_FIXA', categoria: 'TESOURO', identificador: 'tesouro-ipca-2035', codigo: null, nome: 'Tesouro IPCA+ 2035', detalhe: null }),
    ).toEqual(['/renda-fixa', 'tesouro-ipca-2035']);
  });
});
