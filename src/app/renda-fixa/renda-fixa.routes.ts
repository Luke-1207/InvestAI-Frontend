import { Routes } from '@angular/router';

export const RENDA_FIXA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./renda-fixa.component').then((m) => m.RendaFixaComponent),
  },
];
