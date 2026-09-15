import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  let fixture: ComponentFixture<DetalheAtivoComponent>;
  let acaoService: jasmine.SpyObj<AcaoService>;
  let toastService: ToastService;
  let router: Router;

  async function montar() {
    acaoService = jasmine.createSpyObj('AcaoService', ['obterDetalhe', 'obterSugestao']);
    acaoService.obterDetalhe.and.returnValue(of(detalheMock()));
    acaoService.obterSugestao.and.returnValue(of(sugestaoMock()));

    await TestBed.configureTestingModule({
      imports: [DetalheAtivoComponent],
      providers: [
        { provide: AcaoService, useValue: acaoService },
        provideRouter([]),
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
        provideRouter([]),
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

  it('deve navegar pra Comparação com o ativo pré-selecionado ao clicar em Comparar', async () => {
    await montar();
    const navSpy = spyOn(router, 'navigate');

    fixture.nativeElement.querySelector('.detalhe-ativo__comparar').click();

    expect(navSpy).toHaveBeenCalledWith(['/comparacao'], { queryParams: { ativo: 'PETR4' } });
  });
});
