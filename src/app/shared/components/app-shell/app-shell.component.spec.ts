import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppShellComponent } from './app-shell.component';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

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

  it('deve exibir o carrossel de indicadores de mercado no topo', () => {
    expect(fixture.nativeElement.querySelector('.header app-ticker-mercado')).not.toBeNull();
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
      'button.header__icone-botao[aria-label^="Usar tema"]',
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

  it('deve ter o link do Glossário na navegação', () => {
    const glossario = Array.from(fixture.nativeElement.querySelectorAll('.sidebar__nav-item')).find((link) =>
      (link as HTMLElement).textContent!.includes('Glossário'),
    ) as HTMLAnchorElement;

    expect(glossario.getAttribute('href')).toBe('/glossario');
  });

  it('os quatro links do rodapé devem abrir as páginas institucionais', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('.footer__links a')).map((a) => [
      (a as HTMLElement).textContent!.trim(),
      (a as HTMLAnchorElement).getAttribute('href'),
    ]);

    expect(links).toEqual([
      ['Termos de Uso', '/termos-de-uso'],
      ['Privacidade', '/privacidade'],
      ['Conformidade', '/conformidade'],
      ['Regras da CVM', '/regras-cvm'],
    ]);
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

  describe('acessibilidade', () => {
    it('o link "Pular para o conteúdo" deve ser o primeiro item e levar o foco ao conteúdo principal', () => {
      const pular: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
      expect(pular.textContent!.trim()).toBe('Pular para o conteúdo');

      pular.click();

      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('main#conteudo-principal'));
    });

    it('ao trocar de página, o foco deve ir para o conteúdo novo', async () => {
      const router = TestBed.inject(Router);
      router.resetConfig([{ path: 'a', children: [] }, { path: 'b', children: [] }]);
      await router.navigateByUrl('/a');
      await router.navigateByUrl('/b');

      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('main'));
    });

    it('o avatar deve ter nome e informar se o menu está aberto', () => {
      expect(avatar().getAttribute('aria-label')).toBe('Menu da sua conta');
      expect(avatar().getAttribute('aria-expanded')).toBe('false');

      avatar().click();
      fixture.detectChanges();

      expect(avatar().getAttribute('aria-expanded')).toBe('true');
      expect(avatar().getAttribute('aria-controls')).toBe('menu-usuario');
    });

    it('Esc deve fechar o menu da conta e devolver o foco ao avatar', () => {
      avatar().click();
      fixture.detectChanges();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(dropdown()).toBeNull();
      expect(document.activeElement).toBe(avatar());
    });

    it('Sair no menu da conta deve ser um botão, para funcionar pelo teclado', () => {
      avatar().click();
      fixture.detectChanges();

      const sair = Array.from(dropdown()!.querySelectorAll('a, button')).find((e) => e.textContent!.includes('Sair'))!;
      expect(sair.tagName).toBe('BUTTON');
    });

    it('o botão de tema deve dizer o que vai acontecer ao clicar', () => {
      themeService.tema.set('dark');
      fixture.detectChanges();
      const botao = (): HTMLButtonElement => fixture.nativeElement.querySelector('button.header__icone-botao');
      expect(botao().getAttribute('aria-label')).toBe('Usar tema claro');

      themeService.tema.set('light');
      fixture.detectChanges();
      expect(botao().getAttribute('aria-label')).toBe('Usar tema escuro');
    });

    it('a busca e as notificações devem ter nome para leitores de tela', () => {
      expect(fixture.nativeElement.querySelector('.header__busca input').getAttribute('aria-label')).toContain('Buscar ativos');
      expect(fixture.nativeElement.querySelector('a.header__icone-botao').getAttribute('aria-label')).toBe('Notificações');
    });

    it('a página atual deve ser anunciada no menu e os ícones não devem ser lidos', async () => {
      const router = TestBed.inject(Router);
      router.resetConfig([{ path: 'dashboard', children: [] }]);
      await router.navigateByUrl('/dashboard');
      fixture.detectChanges();

      const atual = fixture.nativeElement.querySelector('.sidebar__nav-item[aria-current="page"]');
      expect(atual.textContent).toContain('Dashboard');
      const icones: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.material-symbols-outlined'));
      expect(icones.every((i) => i.getAttribute('aria-hidden') === 'true')).toBeTrue();
    });

    it('a logo não deve repetir o nome nem criar um título extra na página', () => {
      expect(fixture.nativeElement.querySelector('.sidebar__logo img').getAttribute('alt')).toBe('');
      expect(fixture.nativeElement.querySelector('.sidebar h1')).toBeNull();
    });
  });
});
