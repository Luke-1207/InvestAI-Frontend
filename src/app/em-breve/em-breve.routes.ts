import { Route } from '@angular/router';
import { DadosEmBreve } from './em-breve.component';

function rotaEmBreve(path: string, dados: DadosEmBreve): Route {
  return {
    path,
    data: dados,
    loadComponent: () => import('./em-breve.component').then((m) => m.EmBreveComponent),
  };
}

export const ROTAS_EM_BREVE: Route[] = [
  rotaEmBreve('favoritos', {
    icone: 'star',
    titulo: 'Favoritos',
    descricao: 'Em breve você vai poder salvar seus ativos preferidos e acompanhar todos eles por aqui.',
  }),
  rotaEmBreve('notificacoes', {
    icone: 'notifications',
    titulo: 'Notificações',
    descricao: 'Em breve você vai receber aqui alertas de preço e de vencimento dos seus ativos.',
  }),
];
