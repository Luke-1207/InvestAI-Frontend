import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
