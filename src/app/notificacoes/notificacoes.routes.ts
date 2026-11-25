import { Routes } from '@angular/router';

export const NOTIFICACOES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./notificacoes.component').then((m) => m.NotificacoesComponent),
  },
];
