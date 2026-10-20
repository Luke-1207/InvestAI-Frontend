import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelatorioService } from '../../shared/services/relatorio.service';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { DetalheRendaFixaComponent } from './detalhe-renda-fixa.component';
import { RendaFixaService } from '../../shared/services/renda-fixa.service';
import { ToastService } from '../../shared/services/toast.service';
import { TituloPrivadoDetalhe, TituloTesouroDetalhe, RendaFixaListagem } from '../../shared/models/renda-fixa';

const PRIVADO_MOCK: TituloPrivadoDetalhe = {
  id: '123e4567-e89b-12d3-a456-426614174000', tipo: 'CDB', emissor: 'Banco Inter', indexador: 'CDI',
  taxaPercentual: 105, vencimento: '2027-01-01', investimentoMinimo: 500,
  liquidez: 'DIARIA', garantidoFgc: true, isentoIr: false,
  rentabilidadeEstimada: {
    taxaBrutaAnual: 105, aliquotaIR: 17.5, taxaLiquidaAnual: 86.63, taxaSomadaAoIndexador: false, percentualRendimentoLiquido: 82.5,
  },
  resumoIA: 'Contexto econômico do CDB.',
};

const TESOURO_MOCK: TituloTesouroDetalhe = {
  codigo: 'tesouro-selic-2029', nome: 'Tesouro Selic 2029',
  tipo: { valor: 'SELIC', descricao: 'Tesouro Selic' },
  taxaAnual: 0.05, precoMinimo: 150, vencimento: '2029-01-01',
  pagaJurosSemestrais: false, liquidez: 'DIARIA', resumoIA: 'Contexto econômico do Tesouro.',
  rentabilidadeEstimada: {
    taxaBrutaAnual: 0.05, aliquotaIR: 15, taxaLiquidaAnual: null, taxaSomadaAoIndexador: true, percentualRendimentoLiquido: 85,
  },
};

function itemListagemMock(overrides: Partial<RendaFixaListagem> = {}): RendaFixaListagem {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000', codigo: null, categoria: 'CDB', nome: 'CDB Banco Inter', indexador: 'CDI',
    taxa: 105, vencimento: '2027-01-01', valorMinimo: 500, liquidez: 'DIARIA',
    isentoIr: false, garantidoFgc: true, score: null, compatibilidade: null, justificativa: null,
    ...overrides,
  };
}

describe('DetalheRendaFixaComponent', () => {
  let relatorioService: jasmine.SpyObj<RelatorioService>;

  beforeEach(() => {
    relatorioService = jasmine.createSpyObj<RelatorioService>('RelatorioService', [
      'baixarRelatorioAtivo',
      'baixarRelatorioListagem',
      'baixarRelatorioPerfil',
    ]);
    relatorioService.baixarRelatorioAtivo.and.returnValue(of('relatorio.pdf'));
    relatorioService.baixarRelatorioListagem.and.returnValue(of('relatorio.pdf'));
    relatorioService.baixarRelatorioPerfil.and.returnValue(of('relatorio.pdf'));
  });

  let fixture: ComponentFixture<DetalheRendaFixaComponent>;
  let service: jasmine.SpyObj<RendaFixaService>;
  let toastService: ToastService;
  let router: Router;

  async function montar(identificador: string, privado: TituloPrivadoDetalhe = PRIVADO_MOCK) {
    service = jasmine.createSpyObj('RendaFixaService', [
      'obterDetalhePrivado', 'obterDetalheTesouro', 'listar', 'simular',
    ]);
    service.obterDetalhePrivado.and.returnValue(of(privado));
    service.obterDetalheTesouro.and.returnValue(of(TESOURO_MOCK));
    service.listar.and.returnValue(of([]));
    service.simular.and.returnValue(of({
      valorInvestido: 1000, prazoMeses: 2, prazoDias: 61, dataResgate: '2026-12-19', taxaAnualEstimada: 15,
      valorBruto: 1023.57, rendimentoBruto: 23.57, aliquotaIR: 22.5, impostoRenda: 5.3, valorLiquido: 1018.27,
      rendimentoLiquido: 18.27, taxaAnualPoupanca: 6.17, valorPoupanca: 1010.03, rendimentoPoupanca: 10.03,
      diferencaParaPoupanca: 8.24, premissas: [], avisos: [], indicadoresAtualizadosEm: null,
    }));

    await TestBed.configureTestingModule({
      imports: [DetalheRendaFixaComponent],
      providers: [
        { provide: RendaFixaService, useValue: service },
        provideRouter([]), { provide: RelatorioService, useValue: relatorioService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: identificador }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalheRendaFixaComponent);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  it('com um UUID na URL, deve chamar obterDetalhePrivado (não o do Tesouro)', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    expect(service.obterDetalhePrivado).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    expect(service.obterDetalheTesouro).not.toHaveBeenCalled();
  });

  it('com um codigo (não-UUID) na URL, deve chamar obterDetalheTesouro', async () => {
    await montar('tesouro-selic-2029');

    expect(service.obterDetalheTesouro).toHaveBeenCalledWith('tesouro-selic-2029');
    expect(service.obterDetalhePrivado).not.toHaveBeenCalled();
  });

  function valorDoCampo(seletor: string, rotuloCampo: string): string | undefined {
    const campos: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll(`${seletor} > div`));
    const campo = campos.find((c) => c.querySelector('span')?.textContent?.includes(rotuloCampo));
    return campo?.querySelector('strong')?.textContent?.trim();
  }

  it('deve normalizar o detalhe do Tesouro com a rentabilidade calculada pelo backend', async () => {
    await montar('tesouro-selic-2029');

    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Tesouro Nacional');
    expect(el.querySelector('h1').textContent).toContain('Tesouro Selic 2029');
    expect(valorDoCampo('.detalhe-rf__tributacao-grid', 'Alíquota de IR')).toMatch(/^15[.,]00%$/);
  });

  it('no CDB atrelado ao CDI, deve mostrar a taxa e a líquida em % do CDI', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    expect(valorDoCampo('.detalhe-rf__grid-dados', 'Rentabilidade')).toBe('105,00% do CDI');
    expect(valorDoCampo('.detalhe-rf__tributacao-grid', 'Rentabilidade líquida')).toBe('86,63% do CDI');
    expect(fixture.nativeElement.textContent).not.toContain('Parcela do rendimento');
  });

  it('no Tesouro Selic, deve mostrar a parcela do rendimento em vez de descontar o IR da taxa fixa', async () => {
    await montar('tesouro-selic-2029');

    expect(valorDoCampo('.detalhe-rf__grid-dados', 'Rentabilidade')).toBe('Selic + 0,05% a.a.');
    expect(valorDoCampo('.detalhe-rf__tributacao-grid', 'Parcela do rendimento')).toBe('85% do rendimento bruto');
    expect(fixture.nativeElement.textContent).not.toContain('Rentabilidade líquida estimada');

    const ajuda: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.detalhe-rf__tributacao-grid .ajuda__botao[aria-label="O que é Parcela do rendimento?"]',
    );
    ajuda.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(document.querySelector<HTMLElement>('.ajuda__balao')!.textContent).toContain('inclusive a parte que vem do índice');
  });

  it('no CDB IPCA+, deve escrever a taxa como IPCA + X% e mostrar a parcela do rendimento', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000', {
      ...PRIVADO_MOCK,
      indexador: 'IPCA',
      taxaPercentual: 6.5,
      rentabilidadeEstimada: {
        taxaBrutaAnual: 6.5, aliquotaIR: 20, taxaLiquidaAnual: null, taxaSomadaAoIndexador: true, percentualRendimentoLiquido: 80,
      },
    });

    expect(valorDoCampo('.detalhe-rf__grid-dados', 'Rentabilidade')).toBe('IPCA + 6,50% a.a.');
    expect(valorDoCampo('.detalhe-rf__tributacao-grid', 'Parcela do rendimento')).toBe('80% do rendimento bruto');
  });

  it('na LCI IPCA+ isenta, deve mostrar só o selo de isenção', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000', {
      ...PRIVADO_MOCK,
      tipo: 'LCI',
      indexador: 'IPCA',
      isentoIr: true,
      rentabilidadeEstimada: {
        taxaBrutaAnual: 5.2, aliquotaIR: 0, taxaLiquidaAnual: 5.2, taxaSomadaAoIndexador: true, percentualRendimentoLiquido: 100,
      },
    });

    expect(valorDoCampo('.detalhe-rf__grid-dados', 'Rentabilidade')).toBe('IPCA + 5,20% a.a.');
    expect(fixture.nativeElement.querySelector('.detalhe-rf__isento')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Parcela do rendimento');
  });

  it('deve mostrar o selo "Garantido pelo FGC" pro título privado com garantidoFgc=true', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    expect(fixture.nativeElement.textContent).toContain('Garantido pelo FGC');
  });

  it('deve oferecer ajuda contextual para liquidez e alíquota de IR', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    const botoes: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.detalhe-rf__grid-dados .ajuda__botao, .detalhe-rf__tributacao .ajuda__botao'),
    );
    expect(botoes.map((botao) => botao.getAttribute('aria-label'))).toEqual([
      'O que é Liquidez?',
      'O que é Alíquota de IR?',
    ]);

    botoes[1].dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(document.querySelector<HTMLElement>('.ajuda__balao')!.textContent).toContain('22,5% até 180 dias');
  });

  it('deve explicar a categoria e o indexador do título no cabeçalho', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    const rotulos = Array.from(fixture.nativeElement.querySelectorAll('.detalhe-rf__cabecalho .ajuda__botao')).map(
      (botao) => (botao as HTMLElement).getAttribute('aria-label'),
    );

    expect(rotulos).toEqual(['O que é CDB (Certificado de Depósito Bancário)?', 'O que é CDI?']);
  });

  it('no Tesouro, deve explicar o indexador a partir do tipo do título', async () => {
    await montar('tesouro-selic-2029');

    const rotulos = Array.from(fixture.nativeElement.querySelectorAll('.detalhe-rf__cabecalho .ajuda__botao')).map(
      (botao) => (botao as HTMLElement).getAttribute('aria-label'),
    );

    expect(rotulos).toEqual(['O que é Tesouro Direto?', 'O que é Selic?']);
  });

  it('não deve mostrar a ajuda de IR quando o título é isento', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');
    fixture.componentInstance['detalhe'].update((detalhe) => (detalhe ? { ...detalhe, isentoIr: true } : detalhe));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.detalhe-rf__tributacao app-ajuda').length).toBe(0);
  });

  it('deve mostrar o score quando encontra o identificador na listagem inteligente', async () => {
    service = jasmine.createSpyObj('RendaFixaService', ['obterDetalhePrivado', 'obterDetalheTesouro', 'listar', 'simular']);
    service.obterDetalhePrivado.and.returnValue(of(PRIVADO_MOCK));
    service.simular.and.returnValue(EMPTY);
    service.listar.and.returnValue(of([
      itemListagemMock({
        id: '123e4567-e89b-12d3-a456-426614174000', score: 78, compatibilidade: 'ALTA',
        criterios: [{ chave: 'garantia_fgc', descricao: 'Garantido pelo FGC', pontos: 5 }],
      }),
    ]));

    await TestBed.configureTestingModule({
      imports: [DetalheRendaFixaComponent],
      providers: [
        { provide: RendaFixaService, useValue: service },
        provideRouter([]), { provide: RelatorioService, useValue: relatorioService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '123e4567-e89b-12d3-a456-426614174000' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalheRendaFixaComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.detalhe-rf__score').textContent.trim()).toBe('78');
    const painel: HTMLElement = fixture.nativeElement.querySelector('.detalhe-rf__score-painel');
    expect(painel.textContent).toContain('Como chegamos a 78 pontos');
    expect(painel.textContent).toContain('Garantido pelo FGC');
    expect(painel.querySelector('app-aviso-educativo')).not.toBeNull();
  });

  it('não deve mostrar score quando o identificador não aparece na listagem inteligente', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000'); // service.listar mockado como [] no helper montar()

    expect(fixture.nativeElement.querySelector('.detalhe-rf__score')).toBeNull();
    expect(fixture.nativeElement.querySelector('.detalhe-rf__score-painel')).toBeNull();
  });

  it('deve alternar o favorito localmente e mostrar um toast', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    fixture.nativeElement.querySelector('.detalhe-rf__favorito').click();
    fixture.detectChanges();

    expect(toastService.toasts().length).toBe(1);
    expect(toastService.toasts()[0].mensagem).toContain('Adicionado aos favoritos');
  });

  it('deve navegar pra Comparação com o título pré-selecionado (tipo/categoria + identificador)', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');
    const navSpy = spyOn(router, 'navigate');

    fixture.nativeElement.querySelector('.detalhe-rf__comparar').click();

    expect(navSpy).toHaveBeenCalledWith(['/comparacao'], {
      queryParams: { tipo: 'CDB', identificador: '123e4567-e89b-12d3-a456-426614174000' },
    });
  });

  it('deve oferecer o simulador de rendimento com o título, o mínimo e o vencimento do detalhe', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    expect(fixture.nativeElement.querySelector('app-simulador-rendimento')).not.toBeNull();
    expect(service.simular).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 1000, jasmine.any(Number));
  });

  it('no Tesouro, o simulador deve usar o código do título', async () => {
    await montar('tesouro-selic-2029');

    expect(service.simular).toHaveBeenCalledWith('tesouro-selic-2029', 1000, 12);
  });

  it('botão "Baixar relatório" deve pedir o relatório de renda fixa com o identificador da URL', async () => {
    await montar('123e4567-e89b-12d3-a456-426614174000');

    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('app-botao-relatorio button');
    expect(botao.textContent).toContain('Baixar relatório');
    botao.click();

    expect(relatorioService.baixarRelatorioAtivo).toHaveBeenCalledOnceWith(
      '123e4567-e89b-12d3-a456-426614174000',
      'FIXA',
    );
  });
});
