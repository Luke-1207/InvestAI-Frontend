import { Routes } from '@angular/router';

export const RENDA_VARIAVEL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./renda-variavel.component').then((m) => m.RendaVariavelComponent),
  },
];
