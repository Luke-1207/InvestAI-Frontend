import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelatorioService } from '../../shared/services/relatorio.service';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DetalheAtivoComponent } from './detalhe-ativo.component';
import { AcaoService } from '../../shared/services/acao.service';
import { ToastService } from '../../shared/services/toast.service';
import { AcaoDetalhe } from '../../shared/models/acao';
import { SugestaoAtivoItem } from '../../shared/models/dashboard';

function detalheMock(overrides: Partial<AcaoDetalhe> = {}): AcaoDetalhe {
  return {
    id: '1', codigo: 'PETR4', nome: 'Petrobras', tipo: 'ACAO', setor: 'Energia', ativo: true,
    cotacaoDisponivel: true, preco: 38, variacaoPercentual: 1.5, variacaoPreco: 0.5,
    dividendYield: 8, precoValorPatrimonial: 1.2, precoLucro: null, volume: 1000,
    cotacaoAtualizadaEm: '', fonteCotacao: '', minimo52Semanas: 30, maximo52Semanas: 45,
    periodoGrafico: '1A', pontosGrafico: [], glossario: {},
    ...overrides,
  };
}

function sugestaoMock(): SugestaoAtivoItem {
  return {
    codigo: 'PETR4', nome: 'Petrobras', tipo: 'ACAO', setor: 'Energia',
    preco: 38, variacaoDia: 1.5, dy: 8, score: 65, compatibilidade: 'MEDIA', justificativa: 'teste',
  };
}

describe('DetalheAtivoComponent', () => {
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

  let fixture: ComponentFixture<DetalheAtivoComponent>;
  let acaoService: jasmine.SpyObj<AcaoService>;
  let toastService: ToastService;
  let router: Router;

  async function montar(detalhe: AcaoDetalhe = detalheMock()) {
    acaoService = jasmine.createSpyObj('AcaoService', ['obterDetalhe', 'obterSugestao']);
    acaoService.obterDetalhe.and.returnValue(of(detalhe));
    acaoService.obterSugestao.and.returnValue(of(sugestaoMock()));

    await TestBed.configureTestingModule({
      imports: [DetalheAtivoComponent],
      providers: [
        { provide: AcaoService, useValue: acaoService },
        provideRouter([]), { provide: RelatorioService, useValue: relatorioService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ codigo: 'PETR4' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalheAtivoComponent);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  it('deve carregar o detalhe com o período padrão 1A', async () => {
    await montar();
    expect(acaoService.obterDetalhe).toHaveBeenCalledWith('PETR4', '1A');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('PETR4');
  });

  function metricas(): Record<string, HTMLElement> {
    const blocos: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.detalhe-ativo__metricas-secundarias > div'),
    );
    return Object.fromEntries(
      blocos.map((bloco) => [bloco.querySelector('span')!.firstChild!.textContent!.trim(), bloco]),
    );
  }

  it('deve explicar cada indicador com a ajuda do glossário', async () => {
    await montar();

    const rotulos = Object.keys(metricas());
    expect(rotulos).toEqual(['DY', 'P/L', 'P/VP', 'Mín. 52 sem.', 'Máx. 52 sem.', 'Volume']);
    for (const bloco of Object.values(metricas())) {
      expect(bloco.querySelector('app-ajuda .ajuda__botao')).withContext(bloco.textContent!).not.toBeNull();
    }
  });

  it('deve usar o texto do glossário que vem da API no detalhe da ação', async () => {
    await montar(detalheMock({ glossario: { DY: 'Texto do DY vindo da API.' } }));

    metricas()['DY'].querySelector('.ajuda__botao')!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    const balao: HTMLElement = fixture.nativeElement.querySelector('.ajuda__balao');
    expect(balao.textContent).toContain('Texto do DY vindo da API.');
    expect(balao.textContent).toContain('Por que importa:');
  });

  it('deve mostrar P/L como indisponível quando a fonte não traz o dado, e o volume formatado', async () => {
    await montar(detalheMock({ precoLucro: null, volume: 1234567 }));

    expect(metricas()['P/L'].querySelector('strong')!.textContent!.trim()).toBe('Indisponível');
    expect(metricas()['Volume'].querySelector('strong')!.textContent!.trim()).toMatch(/^1[.,]234[.,]567$/);
  });

  it('deve mostrar o P/L quando ele vem preenchido', async () => {
    await montar(detalheMock({ precoLucro: 9.5 }));

    expect(metricas()['P/L'].querySelector('strong')!.textContent!.trim()).toMatch(/^9[.,]50$/);
  });

  it('deve recarregar o detalhe com o novo período ao clicar num seletor', async () => {
    await montar();
    acaoService.obterDetalhe.calls.reset();

    const botao6M: HTMLButtonElement = Array.from(
      fixture.nativeElement.querySelectorAll('.detalhe-ativo__periodo'),
    ).find((b: any) => b.textContent.trim() === '6M') as HTMLButtonElement;
    botao6M.click();

    expect(acaoService.obterDetalhe).toHaveBeenCalledWith('PETR4', '6M');
  });

  it('deve mostrar o painel de Análise da IA quando a sugestão vem preenchida', async () => {
    await montar();
    expect(fixture.nativeElement.querySelector('.detalhe-ativo__ia')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.detalhe-ativo__ia-score').textContent.trim()).toBe('65');
  });

  it('não deve mostrar o painel de IA quando a sugestão vem nula (perfil incompleto)', async () => {
    acaoService = jasmine.createSpyObj('AcaoService', ['obterDetalhe', 'obterSugestao']);
    acaoService.obterDetalhe.and.returnValue(of(detalheMock()));
    acaoService.obterSugestao.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [DetalheAtivoComponent],
      providers: [
        { provide: AcaoService, useValue: acaoService },
        provideRouter([]), { provide: RelatorioService, useValue: relatorioService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ codigo: 'PETR4' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalheAtivoComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.detalhe-ativo__ia')).toBeNull();
  });

  it('deve alternar o favorito localmente e mostrar um toast, sem chamar nenhum serviço de backend', async () => {
    await montar();

    const botaoFavorito: HTMLButtonElement = fixture.nativeElement.querySelector('.detalhe-ativo__favorito');
    botaoFavorito.click();
    fixture.detectChanges();

    expect(botaoFavorito.classList).toContain('detalhe-ativo__favorito--ativo');
    expect(toastService.toasts().length).toBe(1);
    expect(toastService.toasts()[0].mensagem).toContain('Adicionado aos favoritos');
  });

  it('deve navegar pra Comparação com o ativo pré-selecionado (tipo + identificador)', async () => {
    await montar();
    const navSpy = spyOn(router, 'navigate');

    fixture.nativeElement.querySelector('.detalhe-ativo__comparar').click();

    expect(navSpy).toHaveBeenCalledWith(['/comparacao'], {
      queryParams: { tipo: 'ACAO', identificador: 'PETR4' },
    });
  });

  it('botão "Baixar relatório" deve pedir o relatório de renda variável do ativo aberto', async () => {
    await montar();

    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('app-botao-relatorio button');
    expect(botao.textContent).toContain('Baixar relatório');
    botao.click();

    expect(relatorioService.baixarRelatorioAtivo).toHaveBeenCalledOnceWith('PETR4', 'VARIAVEL');
  });
});
