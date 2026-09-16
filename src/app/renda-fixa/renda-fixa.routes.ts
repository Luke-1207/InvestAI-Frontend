import { Routes } from '@angular/router';

export const RENDA_FIXA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./renda-fixa.component').then((m) => m.RendaFixaComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detalhe-renda-fixa/detalhe-renda-fixa.component').then(
        (m) => m.DetalheRendaFixaComponent,
      ),
  },
];
