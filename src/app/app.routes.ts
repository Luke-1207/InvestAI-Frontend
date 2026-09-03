import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'renda-variavel',
    loadChildren: () =>
      import('./renda-variavel/renda-variavel.routes').then((m) => m.RENDA_VARIAVEL_ROUTES),
  },
  {
    path: 'renda-fixa',
    loadChildren: () => import('./renda-fixa/renda-fixa.routes').then((m) => m.RENDA_FIXA_ROUTES),
  },
  {
    path: 'perfil',
    loadChildren: () => import('./perfil/perfil.routes').then((m) => m.PERFIL_ROUTES),
  },
  {
    path: 'gestor',
    loadChildren: () => import('./gestor/gestor.routes').then((m) => m.GESTOR_ROUTES),
  },
  {
    // Provisório: vira uma tela de 404 de verdade no INVAI-97.
    path: '**',
    redirectTo: 'dashboard',
  },
];
