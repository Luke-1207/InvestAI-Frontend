import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { RendaVariavelComponent } from './renda-variavel.component';
import { AcaoService } from '../shared/services/acao.service';
import { PageResponse, AcaoListagem } from '../shared/models/acao';
import { SugestoesRendaVariavel } from '../shared/models/dashboard';

function paginaMock(overrides: Partial<PageResponse<AcaoListagem>> = {}): PageResponse<AcaoListagem> {
  return {
    content: [
      { id: '1', codigo: 'PETR4', nome: 'Petrobras', tipo: 'ACAO', setor: 'Energia', preco: 38, variacaoPercentual: 1, dividendYield: 8, precoValorPatrimonial: 1.2, volume: 1000, cotacaoDisponivel: true },
    ],
    totalElements: 1, totalPages: 1, number: 0, size: 12, first: true, last: true,
    ...overrides,
  };
}

function sugestoesMock(overrides: Partial<SugestoesRendaVariavel> = {}): SugestoesRendaVariavel {
  return {
    itens: [
      { codigo: 'VALE3', nome: 'Vale', tipo: 'ACAO', setor: 'Mineração', preco: 60, variacaoDia: 2, dy: 5, score: 80, compatibilidade: 'ALTA', justificativa: 'teste' },
    ],
    mensagem: null,
    ...overrides,
  };
}

describe('RendaVariavelComponent', () => {
  let fixture: ComponentFixture<RendaVariavelComponent>;
  let acaoService: jasmine.SpyObj<AcaoService>;
  let router: Router;

  beforeEach(async () => {
    acaoService = jasmine.createSpyObj('AcaoService', ['listar', 'listarSugestoes']);
    acaoService.listar.and.returnValue(of(paginaMock()));
    acaoService.listarSugestoes.and.returnValue(of(sugestoesMock()));

    await TestBed.configureTestingModule({
      imports: [RendaVariavelComponent],
      providers: [{ provide: AcaoService, useValue: acaoService }, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RendaVariavelComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('deve carregar em Modo Livre por padrão, sem chamar listarSugestoes', () => {
    expect(acaoService.listar).toHaveBeenCalled();
    expect(acaoService.listarSugestoes).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.rv__card')).toBeTruthy();
  });

  it('deve trocar pro Modo Inteligente e chamar listarSugestoes', () => {
    const botaoInteligente: HTMLButtonElement = Array.from(
      fixture.nativeElement.querySelectorAll('.rv__modo'),
    ).find((b: any) => b.textContent.includes('Modo Inteligente')) as HTMLButtonElement;

    botaoInteligente.click();
    fixture.detectChanges();

    expect(acaoService.listarSugestoes).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('app-cartao-sugestao-ativo')).toBeTruthy();
  });

  it('deve resetar pra página 1 ao trocar o filtro de tipo', () => {
    fixture.componentInstance['irParaPagina'](3);
    acaoService.listar.calls.reset();

    const botaoFii: HTMLButtonElement = Array.from(
      fixture.nativeElement.querySelectorAll('.rv__filtro'),
    ).find((b: any) => b.textContent.trim() === 'FIIs') as HTMLButtonElement;
    botaoFii.click();

    expect(acaoService.listar).toHaveBeenCalledWith(
      jasmine.objectContaining({ tipo: ['FII'], pagina: 1 }),
    );
  });

  it('deve mostrar a mensagem do backend quando o Modo Inteligente não tem itens (perfil incompleto)', () => {
    acaoService.listarSugestoes.and.returnValue(
      of(sugestoesMock({ itens: [], mensagem: 'Complete seu perfil para receber sugestões personalizadas.' })),
    );

    fixture.componentInstance['alternarModo']('inteligente');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rv__mensagem-vazia').textContent).toContain(
      'Complete seu perfil',
    );
  });

  it('deve navegar pro detalhe do ativo ao clicar num card do Modo Livre', () => {
    const navSpy = spyOn(router, 'navigateByUrl');

    fixture.nativeElement.querySelector('.rv__card').click();

    expect(navSpy).toHaveBeenCalledWith('/renda-variavel/PETR4');
  });

  it('não deve mostrar paginação quando só existe 1 página', () => {
    expect(fixture.nativeElement.querySelector('.rv__paginacao')).toBeNull();
  });

  it('deve mostrar paginação e navegar pra página clicada quando há mais de uma página', () => {
    acaoService.listar.and.returnValue(of(paginaMock({ totalPages: 3 })));
    fixture.componentInstance['carregar']();
    fixture.detectChanges();

    const botoes = fixture.nativeElement.querySelectorAll('.rv__pagina');
    expect(botoes.length).toBe(3);

    (botoes[1] as HTMLButtonElement).click();

    expect(acaoService.listar).toHaveBeenCalledWith(jasmine.objectContaining({ pagina: 2 }));
  });
});
