import { TestBed } from '@angular/core/testing';
import { Route, UrlSegment } from '@angular/router';
import { visitanteGuard } from './visitante.guard';
import { AuthService } from '../services/auth.service';

describe('visitanteGuard', () => {
  function executar(autenticado: boolean): unknown {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { autenticado: () => autenticado } }],
    });
    return TestBed.runInInjectionContext(() => visitanteGuard({} as Route, [] as UrlSegment[]));
  }

  it('deve deixar o visitante usar o layout público', () => {
    expect(executar(false)).toBeTrue();
  });

  it('com login, deve deixar a rota cair no layout do app', () => {
    expect(executar(true)).toBeFalse();
  });
});
