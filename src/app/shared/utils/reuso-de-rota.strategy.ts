import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy, Params } from '@angular/router';

function mesmosParametros(a: Params, b: Params): boolean {
  const chavesA = Object.keys(a);
  const chavesB = Object.keys(b);
  return chavesA.length === chavesB.length && chavesA.every((chave) => a[chave] === b[chave]);
}

@Injectable()
export class ReusoDeRotaPorParametrosStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(futura: ActivatedRouteSnapshot, atual: ActivatedRouteSnapshot): boolean {
    return futura.routeConfig === atual.routeConfig && mesmosParametros(futura.params, atual.params);
  }
}
