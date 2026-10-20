import { ActivatedRouteSnapshot, Route } from '@angular/router';
import { ReusoDeRotaPorParametrosStrategy } from './reuso-de-rota.strategy';

function snapshot(routeConfig: Route | null, params: Record<string, string>): ActivatedRouteSnapshot {
  return { routeConfig, params } as unknown as ActivatedRouteSnapshot;
}

describe('ReusoDeRotaPorParametrosStrategy', () => {
  const estrategia = new ReusoDeRotaPorParametrosStrategy();
  const detalhe: Route = { path: ':codigo' };
  const listagem: Route = { path: '' };

  it('deve reaproveitar a tela quando a rota e os parâmetros são os mesmos', () => {
    expect(estrategia.shouldReuseRoute(snapshot(detalhe, { codigo: 'PETR4' }), snapshot(detalhe, { codigo: 'PETR4' }))).toBeTrue();
    expect(estrategia.shouldReuseRoute(snapshot(listagem, {}), snapshot(listagem, {}))).toBeTrue();
  });

  it('deve recriar a tela de detalhe quando só o parâmetro muda, para carregar o outro ativo', () => {
    expect(estrategia.shouldReuseRoute(snapshot(detalhe, { codigo: 'VALE3' }), snapshot(detalhe, { codigo: 'PETR4' }))).toBeFalse();
  });

  it('não deve reaproveitar telas de rotas diferentes', () => {
    expect(estrategia.shouldReuseRoute(snapshot(detalhe, {}), snapshot(listagem, {}))).toBeFalse();
  });
});
