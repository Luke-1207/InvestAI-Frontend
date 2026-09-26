import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('carregarUsuarioAtual deve popular usuarioAtual a partir de /usuarios/me', () => {
    service.carregarUsuarioAtual();
    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me`);
    req.flush({ id: '1', nome: 'Lucas Silva', email: 'lucas@teste.com', role: 'USUARIO' });

    expect(service.usuarioAtual()?.nome).toBe('Lucas Silva');
  });

  it('iniciais deve calcular as duas primeiras iniciais do nome', () => {
    service.carregarUsuarioAtual();
    httpMock.expectOne(`${environment.apiUrl}/usuarios/me`).flush({
      id: '1', nome: 'Lucas Fabiano Peres Silva', email: 'lucas@teste.com', role: 'USUARIO',
    });

    expect(service.iniciais()).toBe('LF');
  });

  it('iniciais deve ser "?" quando ainda não há usuário carregado', () => {
    expect(service.iniciais()).toBe('?');
  });
});
