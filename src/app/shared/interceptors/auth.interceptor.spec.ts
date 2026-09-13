import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let toastService: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => httpMock.verify());

  it('quando 401 e não há refresh token, deve encerrar a sessão com a mensagem de sessão expirada', () => {
    spyOn(authService, 'logout');

    http.get('http://localhost:8080/investai-api/v1/perfil').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('http://localhost:8080/investai-api/v1/perfil');
    req.flush({ mensagem: 'Não autorizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.logout).toHaveBeenCalledWith('Sua sessão expirou, faça login novamente.');
  });

  it('não deve mexer no token pra chamadas de rotas públicas de auth', () => {
    spyOn(authService, 'obterAccessToken').and.returnValue('token-qualquer');

    http.post('http://localhost:8080/investai-api/v1/auth/login', {}).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/investai-api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('deve injetar o Authorization em chamadas normais quando existe token', () => {
    spyOn(authService, 'obterAccessToken').and.returnValue('meu-token');

    http.get('http://localhost:8080/investai-api/v1/perfil').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/investai-api/v1/perfil');
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu-token');
    req.flush({});
  });
});
