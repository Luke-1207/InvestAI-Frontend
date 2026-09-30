import { Routes } from '@angular/router';

export const PERFIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./perfil.component').then((m) => m.PerfilComponent),
  },
  {
    path: 'editar',
    loadComponent: () =>
      import('./editar-dados/editar-dados.component').then((m) => m.EditarDadosComponent),
  },
];
