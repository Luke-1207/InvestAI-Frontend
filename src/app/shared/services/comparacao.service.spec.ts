import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ComparacaoService } from './comparacao.service';
import { AcaoService } from './acao.service';
import { RendaFixaService } from './renda-fixa.service';
import { environment } from '../../../environments/environment';
import { PageResponse, AcaoListagem, AcaoDetalhe } from '../models/acao';
import { RendaFixaListagem, TituloPrivadoDetalhe, TituloTesouroDetalhe } from '../models/renda-fixa';
import { SugestaoAtivoItem } from '../models/dashboard';

describe('ComparacaoService', () => {
  let service: ComparacaoService;
  let httpMock: HttpTestingController;
  let acaoService: jasmine.SpyObj<AcaoService>;
  let rendaFixaService: jasmine.SpyObj<RendaFixaService>;
  const baseUrl = `${environment.apiUrl}/comparacao`;

  beforeEach(() => {
    acaoService = jasmine.createSpyObj('AcaoService', ['listar', 'obterDetalhe', 'obterSugestao']);
    rendaFixaService = jasmine.createSpyObj('RendaFixaService', [
      'listar', 'obterDetalhePrivado', 'obterDetalheTesouro',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ComparacaoService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AcaoService, useValue: acaoService },
        { provide: RendaFixaService, useValue: rendaFixaService },
      ],
    });
    service = TestBed.inject(ComparacaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('obterVeredito deve chamar GET /comparacao/veredito com os 4 parâmetros', () => {
    service.obterVeredito('ACAO', 'PETR4', 'TESOURO', 'tesouro-selic-2029').subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${baseUrl}/veredito` &&
        r.params.get('tipoA') === 'ACAO' &&
        r.params.get('identificadorA') === 'PETR4' &&
        r.params.get('tipoB') === 'TESOURO' &&
        r.params.get('identificadorB') === 'tesouro-selic-2029',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ veredito: 'teste' });
  });

  it('listarItensSelecionaveis deve combinar ações e renda fixa numa lista só', (done) => {
    const paginaAcoes: PageResponse<AcaoListagem> = {
      content: [
        { id: '1', codigo: 'PETR4', nome: 'Petrobras', tipo: 'ACAO', setor: 'Energia', preco: 38, variacaoPercentual: 1, dividendYield: 8, precoValorPatrimonial: 1.2, volume: 100, cotacaoDisponivel: true },
      ],
      totalElements: 1, totalPages: 1, number: 0, size: 100, first: true, last: true,
    };
    const listaFixa: RendaFixaListagem[] = [
      { id: '2', codigo: 'tesouro-selic-2029', categoria: 'TESOURO', nome: 'Tesouro Selic 2029', indexador: 'SELIC', taxa: 11, vencimento: '2029-01-01', valorMinimo: 150, liquidez: 'DIARIA', isentoIr: false, garantidoFgc: false, score: null, compatibilidade: null, justificativa: null },
    ];

    acaoService.listar.and.returnValue(of(paginaAcoes));
    rendaFixaService.listar.and.returnValue(of(listaFixa));

    service.listarItensSelecionaveis().subscribe((itens) => {
      expect(itens.length).toBe(2);
      expect(itens[0].tipo).toBe('ACAO');
      expect(itens[0].identificador).toBe('PETR4');
      expect(itens[1].tipo).toBe('TESOURO');
      expect(itens[1].identificador).toBe('tesouro-selic-2029');
      expect(itens[1].subRotulo).toBe('Selic');
      done();
    });
  });

  it('carregarItemComparacao deve montar métricas de ação (preço, variação, DY, P/VP) e usar o score da sugestão', (done) => {
    const detalhe: Partial<AcaoDetalhe> = {
      codigo: 'PETR4', nome: 'Petrobras', tipo: 'ACAO', preco: 38, variacaoPercentual: 1.5,
      dividendYield: 8, precoValorPatrimonial: 1.2,
    };
    const sugestao: SugestaoAtivoItem = {
      codigo: 'PETR4', nome: 'Petrobras', tipo: 'ACAO', setor: 'Energia',
      preco: 38, variacaoDia: 1.5, dy: 8, score: 70, compatibilidade: 'ALTA', justificativa: 'teste',
    };

    acaoService.obterDetalhe.and.returnValue(of(detalhe as AcaoDetalhe));
    acaoService.obterSugestao.and.returnValue(of(sugestao));

    service.carregarItemComparacao('ACAO', 'PETR4').subscribe((item) => {
      expect(item.rotulo).toContain('PETR4');
      expect(item.metricas.length).toBe(4);
      expect(item.metricas.map((metrica) => metrica.valor)).toEqual(['R$ 38,00', '+1,50%', '8,00%', '1,20']);
      expect(item.score).toBe(70);
      expect(item.compatibilidade).toBe('ALTA');
      done();
    });
  });

  it('carregarItemComparacao (TESOURO) deve chamar obterDetalheTesouro e achar o score na listagem inteligente', (done) => {
    const detalheTesouro: TituloTesouroDetalhe = {
      codigo: 'tesouro-selic-2029', nome: 'Tesouro Selic 2029', tipo: { valor: 'SELIC', descricao: 'Tesouro Selic' },
      taxaAnual: 11, precoMinimo: 150, vencimento: '2029-01-01', pagaJurosSemestrais: false,
      liquidez: 'DIARIA', resumoIA: '',
    };
    rendaFixaService.obterDetalheTesouro.and.returnValue(of(detalheTesouro));
    rendaFixaService.listar.and.returnValue(of([
      { id: 'x', codigo: 'tesouro-selic-2029', categoria: 'TESOURO', nome: 'Tesouro Selic 2029', indexador: 'SELIC', taxa: 11, vencimento: '2029-01-01', valorMinimo: 150, liquidez: 'DIARIA', isentoIr: false, garantidoFgc: false, score: 60, compatibilidade: 'MEDIA', justificativa: 'ok' },
    ]));

    service.carregarItemComparacao('TESOURO', 'tesouro-selic-2029').subscribe((item) => {
      expect(rendaFixaService.obterDetalhePrivado).not.toHaveBeenCalled();
      expect(item.categoria).toBe('TESOURO');
      expect(item.metricas.map((metrica) => metrica.valor)).toEqual(['11,00% a.a.', '01/01/2029', 'R$ 150,00', 'Diária']);
      expect(item.score).toBe(60);
      done();
    });
  });

  it('carregarItemComparacao (CDB) deve chamar obterDetalhePrivado, não obterDetalheTesouro', (done) => {
    const detalhePrivado: TituloPrivadoDetalhe = {
      id: '123e4567-e89b-12d3-a456-426614174000', tipo: 'CDB', emissor: 'Banco Inter', indexador: 'CDI',
      taxaPercentual: 105, vencimento: '2027-01-01', investimentoMinimo: 500, liquidez: 'DIARIA',
      garantidoFgc: true, isentoIr: false,
      rentabilidadeEstimada: { taxaBrutaAnual: 10, aliquotaIR: 17.5, taxaLiquidaAnual: 8.25 }, resumoIA: '',
    };
    rendaFixaService.obterDetalhePrivado.and.returnValue(of(detalhePrivado));
    rendaFixaService.listar.and.returnValue(of([]));

    service.carregarItemComparacao('CDB', '123e4567-e89b-12d3-a456-426614174000').subscribe((item) => {
      expect(rendaFixaService.obterDetalheTesouro).not.toHaveBeenCalled();
      expect(item.rotulo).toBe('Banco Inter');
      expect(item.metricas.map((metrica) => metrica.valor)).toEqual(['10,00% a.a.', '01/01/2027', 'R$ 500,00', 'Diária']);
      expect(item.score).toBeNull();
      done();
    });
  });
});
