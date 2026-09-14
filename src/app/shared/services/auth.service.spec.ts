import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import {ToastService} from './toast.service';

function criarTokenFalso(payload: Record<string, unknown>): string {
  const base64 = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64({ alg: 'HS256', typ: 'JWT' })}.${base64(payload)}.assinatura-fake`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const baseUrl = `${environment.apiUrl}/auth`;
  const usuariosUrl = `${environment.apiUrl}/usuarios`;

  const exp = Math.floor(Date.now() / 1000) + 3600; // 1h no futuro
  const tokenValido = criarTokenFalso({
    sub: 'gestor@gmail.com',
    userId: 'abc-123',
    role: 'GESTOR',
    iat: Math.floor(Date.now() / 1000),
    exp,
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deve começar não autenticado quando não há token salvo', () => {
    expect(service.autenticado()).toBe(false);
    expect(service.role()).toBeNull();
  });

  it('login deve armazenar tokens e refletir autenticado + role decodificada do JWT', () => {
    service.login({ email: 'gestor@gmail.com', senha: 'gestor123#' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: tokenValido, refreshToken: 'refresh-xyz', expiresIn: 900 });

    httpMock.expectOne(`${usuariosUrl}/me`).flush({
      id: 'abc-123', nome: 'Lucas Gestor', email: 'gestor@gmail.com',
      role: 'GESTOR', ativo: true, criadoEm: '', atualizadoEm: '',
    });

    expect(service.autenticado()).toBe(true);
    expect(service.role()).toBe('GESTOR');
    expect(localStorage.getItem('investai-access-token')).toBe(tokenValido);
  });

  it('cadastro deve encadear um login automático (cadastro não devolve token)', () => {
    service
      .cadastrar({
        nome: 'Novo', email: 'novo@email.com', senha: 'senha123', confirmarSenha: 'senha123',
      })
      .subscribe();

    const reqCadastro = httpMock.expectOne(`${baseUrl}/cadastro`);
    expect(reqCadastro.request.method).toBe('POST');
    reqCadastro.flush({ id: 'novo-1', nome: 'Novo', email: 'novo@email.com', role: 'USUARIO' });

    const reqLogin = httpMock.expectOne(`${baseUrl}/login`);
    expect(reqLogin.request.body).toEqual({ email: 'novo@email.com', senha: 'senha123' });
    reqLogin.flush({ accessToken: tokenValido, refreshToken: 'refresh-xyz', expiresIn: 900 });

    httpMock.expectOne(`${usuariosUrl}/me`).flush({
      id: 'novo-1', nome: 'Novo', email: 'novo@email.com',
      role: 'USUARIO', ativo: true, criadoEm: '', atualizadoEm: '',
    });

    expect(service.autenticado()).toBe(true);
  });

  it('logout deve limpar a sessão, navegar pro /auth e avisar o backend', () => {
    localStorage.setItem('investai-access-token', tokenValido);
    localStorage.setItem('investai-refresh-token', 'refresh-xyz');
    const navSpy = spyOn(router, 'navigateByUrl');

    service.logout();

    expect(localStorage.getItem('investai-access-token')).toBeNull();
    expect(service.autenticado()).toBe(false);
    expect(navSpy).toHaveBeenCalledWith('/auth');

    const req = httpMock.expectOne(`${baseUrl}/logout`);
    expect(req.request.body).toEqual({ refreshToken: 'refresh-xyz' });
    req.flush(null);
  });

  it('logout(mensagem) deve exibir um toast de erro — usado só na sessão expirada forçada', () => {
    localStorage.setItem('investai-access-token', tokenValido);
    localStorage.setItem('investai-refresh-token', 'refresh-xyz');
    spyOn(router, 'navigateByUrl');
    const toastService = TestBed.inject(ToastService);

    service.logout('Sua sessão expirou, faça login novamente.');

    expect(toastService.toasts().length).toBe(1);
    expect(toastService.toasts()[0].tipo).toBe('erro');
    expect(toastService.toasts()[0].mensagem).toBe('Sua sessão expirou, faça login novamente.');

    httpMock.expectOne(`${baseUrl}/logout`).flush(null);
  });

  it('logout() sem mensagem (clique manual em Sair) não deve exibir nenhum toast', () => {
    localStorage.setItem('investai-access-token', tokenValido);
    localStorage.setItem('investai-refresh-token', 'refresh-xyz');
    spyOn(router, 'navigateByUrl');
    const toastService = TestBed.inject(ToastService);

    service.logout();

    expect(toastService.toasts().length).toBe(0);
    httpMock.expectOne(`${baseUrl}/logout`).flush(null);
  });

  it('logout() deve disparar a chamada ao backend ANTES de limpar a sessão local (evita o bug do 401 auto-provocado)', () => {
    localStorage.setItem('investai-access-token', tokenValido);
    localStorage.setItem('investai-refresh-token', 'refresh-xyz');
    spyOn(router, 'navigateByUrl');

    service.logout();

    const req = httpMock.expectOne(`${baseUrl}/logout`);
    expect(req.request.body).toEqual({ refreshToken: 'refresh-xyz' });
    expect(localStorage.getItem('investai-access-token')).toBeNull();
    expect(localStorage.getItem('investai-refresh-token')).toBeNull();

    req.flush(null);
  });
});
