import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { ExcluirContaComponent } from './excluir-conta.component';
import { UsuarioService } from '../../shared/services/usuario.service';
import { AuthService } from '../../shared/services/auth.service';
import { FotoPerfilService } from '../../shared/services/foto-perfil.service';
import { ToastService } from '../../shared/services/toast.service';

describe('ExcluirContaComponent', () => {
  let fixture: ComponentFixture<ExcluirContaComponent>;
  let usuarioService: jasmine.SpyObj<UsuarioService>;
  let authService: jasmine.SpyObj<AuthService>;
  let fotoService: jasmine.SpyObj<FotoPerfilService>;
  let toast: ToastService;

  beforeEach(async () => {
    usuarioService = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['excluirConta']);
    usuarioService.excluirConta.and.returnValue(of(undefined));
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    fotoService = jasmine.createSpyObj<FotoPerfilService>('FotoPerfilService', ['limpar']);

    await TestBed.configureTestingModule({
      imports: [ExcluirContaComponent],
      providers: [
        provideRouter([]),
        { provide: UsuarioService, useValue: usuarioService },
        { provide: AuthService, useValue: authService },
        { provide: FotoPerfilService, useValue: fotoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExcluirContaComponent);
    toast = TestBed.inject(ToastService);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement;
  }

  async function abrir(): Promise<void> {
    el().querySelector<HTMLButtonElement>('.excluir-conta__botao')!.click();
    await fixture.whenStable();
  }

  async function digitar(senha: string): Promise<void> {
    const input = el().querySelector<HTMLInputElement>('#excluir-conta-senha')!;
    input.value = senha;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function confirmar(): Promise<void> {
    el().querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  it('deve explicar as consequências e levar para a página de Privacidade', () => {
    expect(el().textContent).toContain('perde o acesso ao InvestAI na hora');
    expect(el().querySelector('a')!.getAttribute('href')).toBe('/privacidade');
    expect(el().querySelector('form')).toBeNull();
  });

  it('ao pedir para excluir, deve pedir a senha e levar o foco para ela', async () => {
    await abrir();

    expect(el().querySelector('label')!.textContent).toContain('Digite sua senha para confirmar');
    expect(document.activeElement).toBe(el().querySelector('#excluir-conta-senha'));
  });

  it('sem senha, não deve chamar o backend', async () => {
    await abrir();
    await confirmar();

    expect(el().querySelector('.excluir-conta__erro')!.textContent!.trim()).toBe('Digite a sua senha para confirmar.');
    expect(usuarioService.excluirConta).not.toHaveBeenCalled();
  });

  it('com a senha certa, deve excluir, encerrar a sessão e avisar', async () => {
    spyOn(toast, 'sucesso');
    await abrir();
    await digitar('senha1234');
    await confirmar();

    expect(usuarioService.excluirConta).toHaveBeenCalledOnceWith('senha1234');
    expect(fotoService.limpar).toHaveBeenCalled();
    expect(authService.logout).toHaveBeenCalled();
    expect(toast.sucesso).toHaveBeenCalledOnceWith('Sua conta foi excluída.');
  });

  it('enquanto exclui, deve travar os botões', async () => {
    usuarioService.excluirConta.and.returnValue(new Subject<void>());
    await abrir();
    await digitar('senha1234');
    await confirmar();

    const botoes = Array.from(el().querySelectorAll<HTMLButtonElement>('.excluir-conta__acoes button'));
    expect(botoes[0].textContent!.trim()).toBe('Excluindo...');
    expect(botoes.every((b) => b.disabled)).toBeTrue();
  });

  it('com a senha errada, deve avisar e manter a sessão', async () => {
    usuarioService.excluirConta.and.returnValue(throwError(() => new HttpErrorResponse({ status: 422, error: { erro: 'Senha incorreta' } })));
    await abrir();
    await digitar('errada');
    await confirmar();

    const erro = el().querySelector('.excluir-conta__erro')!;
    expect(erro.textContent!.trim()).toBe('Senha incorreta. Confira e tente de novo.');
    expect(erro.getAttribute('role')).toBe('alert');
    expect(el().querySelector('#excluir-conta-senha')!.getAttribute('aria-describedby')).toBe('excluir-conta-erro');
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('erro inesperado deve mostrar uma mensagem genérica', async () => {
    usuarioService.excluirConta.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await abrir();
    await digitar('senha1234');
    await confirmar();

    expect(el().querySelector('.excluir-conta__erro')!.textContent!.trim()).toBe('Não foi possível excluir a conta agora. Tente novamente.');
  });

  it('cancelar ou Esc devem fechar a confirmação e apagar a senha digitada', async () => {
    await abrir();
    await digitar('senha1234');
    el().querySelector('form')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(el().querySelector('form')).toBeNull();
    await abrir();
    expect(el().querySelector<HTMLInputElement>('#excluir-conta-senha')!.value).toBe('');
  });
});
