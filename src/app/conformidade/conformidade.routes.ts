import { Routes } from '@angular/router';

export const CONFORMIDADE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./conformidade.component').then((m) => m.ConformidadeComponent),
  },
];
