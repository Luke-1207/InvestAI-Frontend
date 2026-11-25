import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FavoritosComponent } from './favoritos.component';
import { FavoritoService } from '../shared/services/favorito.service';
import { ToastService } from '../shared/services/toast.service';
import { Favorito } from '../shared/models/favorito';

function favoritoMock(overrides: Partial<Favorito> = {}): Favorito {
  return {
    id: 'f1',
    tipoAtivo: 'ACAO_FII_ETF',
    ativoId: 'a1',
    codigo: 'PETR4',
    nome: 'Petrobras PN',
    alertasAtivos: true,
    tiposAlertaAtivos: null,
    tiposAlertaDisponiveis: ['VARIACAO_ALTA', 'VARIACAO_BAIXA'],
    limiarVariacao: 5,
    criadoEm: '2026-11-25T10:00:00',
    ...overrides,
  };
}

const TESOURO = favoritoMock({
  id: 'f2', tipoAtivo: 'TITULO_TESOURO', ativoId: 't1', codigo: 'LTN2029', nome: 'Tesouro Prefixado 2029',
  tiposAlertaDisponiveis: ['TITULO_VENCENDO'],
});

describe('FavoritosComponent', () => {
  let fixture: ComponentFixture<FavoritosComponent>;
  let favoritoService: jasmine.SpyObj<FavoritoService>;
  let toastService: ToastService;

  async function montar(favoritos: Favorito[] = [favoritoMock(), TESOURO]) {
    favoritoService = jasmine.createSpyObj<FavoritoService>('FavoritoService', ['listar', 'remover', 'configurarAlertas']);
    favoritoService.listar.and.returnValue(of(favoritos));

    await TestBed.configureTestingModule({
      imports: [FavoritosComponent],
      providers: [provideRouter([]), { provide: FavoritoService, useValue: favoritoService }],
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritosComponent);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  function elemento(): HTMLElement {
    return fixture.nativeElement;
  }

  it('deve listar os favoritos com link para o detalhe e o resumo dos alertas', async () => {
    await montar();

    const itens = elemento().querySelectorAll('.favoritos__item');
    expect(itens.length).toBe(2);
    expect(itens[0].querySelector('a')!.getAttribute('href')).toBe('/renda-variavel/PETR4');
    expect(itens[0].textContent).toContain('Alta no dia e Queda no dia a partir de 5%');
    expect(itens[1].querySelector('a')!.getAttribute('href')).toBe('/renda-fixa/LTN2029');
    expect(itens[1].textContent).toContain('Vencimento em até 30 dias');
    expect(elemento().querySelector('.favoritos__total')!.textContent).toContain('2 de 50');
  });

  it('deve mostrar o estado vazio com atalho para Renda Variável', async () => {
    await montar([]);
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl');

    expect(elemento().textContent).toContain('Você ainda não tem favoritos');
    (elemento().querySelector('app-estado-erro button') as HTMLButtonElement).click();

    expect(navSpy).toHaveBeenCalledWith('/renda-variavel');
  });

  it('deve mostrar erro com opção de tentar de novo', async () => {
    favoritoService = jasmine.createSpyObj<FavoritoService>('FavoritoService', ['listar']);
    await montar();
    favoritoService.listar.and.returnValue(throwError(() => new Error('falha')));
    (fixture.componentInstance as unknown as { carregar(): void }).carregar();
    fixture.detectChanges();

    expect(elemento().querySelector('app-erro-servidor')).not.toBeNull();
  });

  it('deve remover um favorito e avisar', async () => {
    await montar();
    favoritoService.remover.and.returnValue(of(undefined));

    (elemento().querySelector('.favoritos__botao--remover') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(favoritoService.remover).toHaveBeenCalledWith('f1');
    expect(elemento().querySelectorAll('.favoritos__item').length).toBe(1);
    expect(toastService.toasts()[0].mensagem).toContain('PETR4 saiu dos seus favoritos');
  });

  it('deve salvar alertas com tipos e limiar escolhidos', async () => {
    await montar();
    favoritoService.configurarAlertas.and.returnValue(
      of(favoritoMock({ tiposAlertaAtivos: ['VARIACAO_BAIXA'], limiarVariacao: 3 })),
    );

    (elemento().querySelector('.favoritos__botao') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const caixas = elemento().querySelectorAll<HTMLInputElement>('.favoritos__tipos input[type="checkbox"]');
    caixas[0].click();
    const limiar = elemento().querySelector<HTMLInputElement>('.favoritos__campo input')!;
    limiar.value = '3';
    limiar.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    const botoesSalvar = elemento().querySelectorAll<HTMLButtonElement>('.favoritos__salvar button');
    botoesSalvar[1].click();
    fixture.detectChanges();

    expect(favoritoService.configurarAlertas).toHaveBeenCalledWith('f1', {
      alertasAtivos: true,
      tiposAlertaAtivos: ['VARIACAO_BAIXA'],
      limiarVariacao: 3,
    });
    expect(elemento().querySelector('.favoritos__alertas')).toBeNull();
    expect(elemento().querySelector('.favoritos__item')!.textContent).toContain('Queda no dia a partir de 3%');
  });

  it('não deve salvar com limiar fora da faixa', async () => {
    await montar();
    (elemento().querySelector('.favoritos__botao') as HTMLButtonElement).click();
    fixture.detectChanges();

    const limiar = elemento().querySelector<HTMLInputElement>('.favoritos__campo input')!;
    limiar.value = '150';
    limiar.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(elemento().querySelector('.favoritos__campo--erro')).not.toBeNull();
    const botaoSalvar = elemento().querySelectorAll<HTMLButtonElement>('.favoritos__salvar button')[1];
    expect(botaoSalvar.disabled).toBeTrue();
  });

  it('não deve mandar limiar para títulos de renda fixa', async () => {
    await montar([TESOURO]);
    favoritoService.configurarAlertas.and.returnValue(of(TESOURO));

    (elemento().querySelector('.favoritos__botao') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(elemento().querySelector('.favoritos__campo')).toBeNull();

    elemento().querySelectorAll<HTMLButtonElement>('.favoritos__salvar button')[1].click();

    expect(favoritoService.configurarAlertas).toHaveBeenCalledWith('f2', {
      alertasAtivos: true,
      tiposAlertaAtivos: ['TITULO_VENCENDO'],
    });
  });

  it('deve mostrar a mensagem do servidor quando salvar falha', async () => {
    await montar();
    favoritoService.configurarAlertas.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { erro: 'Tipo de alerta não disponível' } })),
    );

    (elemento().querySelector('.favoritos__botao') as HTMLButtonElement).click();
    fixture.detectChanges();
    elemento().querySelectorAll<HTMLButtonElement>('.favoritos__salvar button')[1].click();
    fixture.detectChanges();

    expect(toastService.toasts()[0].mensagem).toContain('Tipo de alerta não disponível');
    expect(elemento().querySelector('.favoritos__alertas')).not.toBeNull();
  });
});
