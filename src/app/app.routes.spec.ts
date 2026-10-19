import { Route } from '@angular/router';
import { routes } from './app.routes';
import { visitanteGuard } from './shared/guards/visitante.guard';
import { authGuard } from './shared/guards/auth.guard';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';

const PAGINAS = ['termos-de-uso', 'privacidade', 'conformidade', 'regras-cvm'];

function caminhos(rota: Route): (string | undefined)[] {
  return (rota.children ?? []).map((filha) => filha.path);
}

describe('rotas das páginas institucionais', () => {
  it('sem login, as quatro páginas devem abrir no layout público, sem exigir autenticação', () => {
    const publica = routes.find((r) => r.canMatch?.includes(visitanteGuard))!;

    expect(publica.canActivate).toBeUndefined();
    expect(caminhos(publica)).toEqual(PAGINAS);
  });

  it('com login, as mesmas páginas devem abrir dentro do app, com o menu', () => {
    const shell = routes.find((r) => r.component === AppShellComponent)!;

    expect(shell.canActivate).toEqual([authGuard]);
    expect(caminhos(shell)).toEqual(jasmine.arrayContaining(PAGINAS));
  });

  it('o layout público deve vir antes do app, para o visitante não ser mandado ao login', () => {
    const indicePublico = routes.findIndex((r) => r.canMatch?.includes(visitanteGuard));
    const indiceShell = routes.findIndex((r) => r.component === AppShellComponent);

    expect(indicePublico).toBeLessThan(indiceShell);
  });
});
