import { Routes } from '@angular/router';

export const FAVORITOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./favoritos.component').then((m) => m.FavoritosComponent),
  },
];
