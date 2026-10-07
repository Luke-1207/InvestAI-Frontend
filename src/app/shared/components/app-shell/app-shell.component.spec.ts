import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppShellComponent } from './app-shell.component';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardResponse } from '../../models/dashboard';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let themeService: ThemeService;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    themeService = TestBed.inject(ThemeService);
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  function avatar(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.header__avatar');
  }

  function dropdown(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.header__dropdown');
  }

  it('deve mostrar os indicadores de mercado no padrão brasileiro', () => {
    TestBed.inject(DashboardService).dashboard.set({
      indicadoresMercado: {
        ibovespaPontos: 134820.5, ibovespaVariacaoDia: 0.4,
        dolarValor: 5.14, dolarVariacaoDia: -0.2,
        euroValor: 6.02, euroVariacaoDia: 0.1,
        selicAtual: 13.75, ipcaAcumulado12m: 4.22,
      },
    } as DashboardResponse);
    fixture.detectChanges();

    const valores = Array.from(fixture.nativeElement.querySelectorAll('.header__ticker-valor'))
      .map((elemento) => (elemento as HTMLElement).textContent!.trim());

    expect(valores).toEqual(['134.821', 'R$ 5,14', 'R$ 6,02', '13,75%', '4,22%']);
  });

  it('deve abrir o menu de usuário ao clicar no avatar', () => {
    expect(dropdown()).toBeNull();
    avatar().click();
    fixture.detectChanges();
    expect(dropdown()).toBeTruthy();
  });

  it('deve fechar o menu ao clicar fora dele', () => {
    avatar().click();
    fixture.detectChanges();
    expect(dropdown()).toBeTruthy();

    document.body.click();
    fixture.detectChanges();
    expect(dropdown()).toBeNull();
  });

  it('deve chamar themeService.alternarTema ao clicar no botão de tema', () => {
    const spy = spyOn(themeService, 'alternarTema');
    const botaoTema: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.header__icone-botao[title="Alternar tema"]',
    );
    botaoTema.click();
    expect(spy).toHaveBeenCalled();
  });

  it('deve chamar authService.logout ao clicar em Sair', () => {
    const spy = spyOn(authService, 'logout');
    fixture.componentInstance.sair();
    expect(spy).toHaveBeenCalled();
  });

  it('tecla "/" fora de um campo de texto deve focar o campo de busca', () => {
    fixture.detectChanges();
    const campoBusca: HTMLInputElement = fixture.nativeElement.querySelector('.header__busca input');
    const focoSpy = spyOn(campoBusca, 'focus');

    const evento = new KeyboardEvent('keydown', { key: '/', cancelable: true, bubbles: true });
    document.body.dispatchEvent(evento);

    expect(focoSpy).toHaveBeenCalled();
  });

  it('tecla "/" digitada dentro de um input não deve interferir (não temos como testar digitação real, só confirmamos que preventDefault não trava campos de formulário)', () => {
    const inputQualquer = document.createElement('input');
    document.body.appendChild(inputQualquer);
    inputQualquer.focus();

    const evento = new KeyboardEvent('keydown', { key: '/', cancelable: true, bubbles: true });
    const prevenido = !inputQualquer.dispatchEvent(evento);

    expect(prevenido).toBe(false); // não deve ter chamado preventDefault nesse caso
    document.body.removeChild(inputQualquer);
  });

  it('deve renderizar todos os itens de navegação configurados', () => {
    const links = fixture.nativeElement.querySelectorAll('.sidebar__nav-item');
    expect(links.length).toBe(fixture.componentInstance.itensNav.length);
  });

  function sidebar(): HTMLElement {
    return fixture.nativeElement.querySelector('.sidebar');
  }

  function botaoMenu(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.header__menu');
  }

  function abrirMenuNavegacao(): void {
    botaoMenu().click();
    fixture.detectChanges();
  }

  it('usuário comum não deve ver a seção de administração', () => {
    expect(fixture.nativeElement.querySelector('.sidebar__nav-secao')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sidebar__nav-item--gestor')).toBeNull();
  });

  it('gestor deve ver o link do Painel do Gestor apontando pra /gestor', () => {
    Object.defineProperty(authService, 'role', { value: signal('GESTOR') });
    const fixtureGestor = TestBed.createComponent(AppShellComponent);
    fixtureGestor.detectChanges();

    const link: HTMLAnchorElement = fixtureGestor.nativeElement.querySelector('.sidebar__nav-item--gestor');
    expect(fixtureGestor.nativeElement.querySelector('.sidebar__nav-secao')?.textContent?.trim()).toBe('Administração');
    expect(link.textContent).toContain('Painel do Gestor');
    expect(link.getAttribute('href')).toBe('/gestor');
    fixtureGestor.destroy();
  });

  it('menu de navegação deve começar fechado', () => {
    expect(sidebar().classList).not.toContain('sidebar--aberta');
    expect(fixture.nativeElement.querySelector('.shell__fundo')).toBeNull();
    expect(botaoMenu().getAttribute('aria-expanded')).toBe('false');
  });

  it('botão de menu deve abrir a navegação e mostrar o fundo escuro', () => {
    abrirMenuNavegacao();

    expect(sidebar().classList).toContain('sidebar--aberta');
    expect(fixture.nativeElement.querySelector('.shell__fundo')).toBeTruthy();
    expect(botaoMenu().getAttribute('aria-expanded')).toBe('true');
  });

  it('botão de menu deve fechar a navegação quando ela já está aberta', () => {
    abrirMenuNavegacao();
    abrirMenuNavegacao();

    expect(sidebar().classList).not.toContain('sidebar--aberta');
  });

  it('clicar no fundo escuro deve fechar a navegação', () => {
    abrirMenuNavegacao();

    fixture.nativeElement.querySelector('.shell__fundo').click();
    fixture.detectChanges();

    expect(sidebar().classList).not.toContain('sidebar--aberta');
    expect(fixture.nativeElement.querySelector('.shell__fundo')).toBeNull();
  });

  it('botão de fechar da sidebar deve fechar a navegação', () => {
    abrirMenuNavegacao();

    fixture.nativeElement.querySelector('.sidebar__fechar').click();
    fixture.detectChanges();

    expect(sidebar().classList).not.toContain('sidebar--aberta');
  });

  it('tecla Escape deve fechar a navegação', () => {
    abrirMenuNavegacao();

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(sidebar().classList).not.toContain('sidebar--aberta');
  });

  it('clicar em um item de navegação deve fechar o menu', () => {
    abrirMenuNavegacao();

    fixture.nativeElement.querySelector('.sidebar__nav-item').click();
    fixture.detectChanges();

    expect(sidebar().classList).not.toContain('sidebar--aberta');
  });

  it('trocar de rota deve fechar o menu de navegação', async () => {
    abrirMenuNavegacao();

    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();

    expect(sidebar().classList).not.toContain('sidebar--aberta');
  });
});
