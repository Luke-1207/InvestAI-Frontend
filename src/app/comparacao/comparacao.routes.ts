import { Routes } from '@angular/router';

export const COMPARACAO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./comparacao.component').then((m) => m.ComparacaoComponent),
  },
];
