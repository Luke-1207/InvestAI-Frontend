import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const ROTAS_SEM_TOKEN = ['/auth/login', '/auth/cadastro', '/auth/refresh', '/auth/esqueci-senha', '/auth/redefinir-senha'];

let renovandoToken = false;
const tokenRenovado$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  requisicao: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  const ehRotaPublica = ROTAS_SEM_TOKEN.some((rota) => requisicao.url.includes(rota));
  const token = authService.obterAccessToken();

  const requisicaoComToken =
    !ehRotaPublica && token
      ? requisicao.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : requisicao;

  return next(requisicaoComToken).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status !== 401 || ehRotaPublica) {
        return throwError(() => erro);
      }
      return tratar401(requisicao, next, authService);
    }),
  );
};

function tratar401(
  requisicaoOriginal: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<HttpEvent<unknown>> {
  if (!authService.obterRefreshToken()) {
    authService.logout();
    return throwError(() => new Error('Sessão expirada — faça login novamente.'));
  }

  if (!renovandoToken) {
    renovandoToken = true;
    tokenRenovado$.next(null);

    return authService.renovarToken().pipe(
      switchMap((resposta) => {
        renovandoToken = false;
        tokenRenovado$.next(resposta.accessToken);
        return next(
          requisicaoOriginal.clone({ setHeaders: { Authorization: `Bearer ${resposta.accessToken}` } }),
        );
      }),
      catchError((erroRefresh) => {
        renovandoToken = false;
        authService.logout();
        return throwError(() => erroRefresh);
      }),
    );
  }

  return tokenRenovado$.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) =>
      next(requisicaoOriginal.clone({ setHeaders: { Authorization: `Bearer ${token}` } })),
    ),
  );
}
