import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GestaoCatalogoService } from './gestao-catalogo.service';
import { environment } from '../../../environments/environment';
import { DadosTitulo } from '../models/gestao-catalogo';

describe('GestaoCatalogoService', () => {
  let service: GestaoCatalogoService;
  let http: HttpTestingController;
  const api = environment.apiUrl;
  const dadosTitulo: DadosTitulo = {
    tipo: 'CDB', emissor: 'Banco Inter', indexador: 'CDI', taxaPercentual: 110, vencimento: '2028-05-10',
    investimentoMinimo: 500, liquidez: 'DIARIA', garantidoFgc: true, isentoIr: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(GestaoCatalogoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('ativos: deve usar a listagem do gestor e os endpoints de cadastro, edição e desativação', () => {
    service.listarAtivos().subscribe();
    http.expectOne({ method: 'GET', url: `${api}/acoes/gestao` }).flush([]);

    service.obterAtivo('id-1').subscribe();
    http.expectOne({ method: 'GET', url: `${api}/acoes/id-1` }).flush({});

    service.cadastrarAtivo({ codigo: 'PETR4', nome: 'Petrobras PN', tipo: 'ACAO', setor: null }).subscribe();
    const cadastro = http.expectOne({ method: 'POST', url: `${api}/acoes` });
    expect(cadastro.request.body.codigo).toBe('PETR4');
    cadastro.flush({});

    service.atualizarAtivo('id-1', { nome: 'Petrobras', tipo: 'ACAO', setor: 'Petróleo', ativo: true }).subscribe();
    expect(http.expectOne({ method: 'PUT', url: `${api}/acoes/id-1` }).request.body.ativo).toBeTrue();

    service.desativarAtivo('id-1').subscribe();
    http.expectOne({ method: 'DELETE', url: `${api}/acoes/id-1` }).flush(null);
  });

  it('títulos: deve usar a listagem do gestor, o PATCH de status e o DELETE para remover', () => {
    service.listarTitulos().subscribe();
    http.expectOne({ method: 'GET', url: `${api}/renda-fixa/titulos/gestao` }).flush([]);

    service.cadastrarTitulo(dadosTitulo).subscribe();
    expect(http.expectOne({ method: 'POST', url: `${api}/renda-fixa/titulos` }).request.body).toEqual(dadosTitulo);

    service.atualizarTitulo('t1', dadosTitulo).subscribe();
    http.expectOne({ method: 'PUT', url: `${api}/renda-fixa/titulos/t1` }).flush({});

    service.alterarStatusTitulo('t1', false).subscribe();
    expect(http.expectOne({ method: 'PATCH', url: `${api}/renda-fixa/titulos/t1/status` }).request.body).toEqual({ ativo: false });

    service.removerTitulo('t1').subscribe();
    http.expectOne({ method: 'DELETE', url: `${api}/renda-fixa/titulos/t1` }).flush(null);
  });
});
