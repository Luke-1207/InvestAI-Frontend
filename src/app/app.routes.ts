import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';
import { authGuard } from './shared/guards/auth.guard';
import { gestorGuard } from './shared/guards/gestor.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadChildren: () => import('./onboarding/onboarding.routes').then((m) => m.ONBOARDING_ROUTES),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
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
        loadChildren: () =>
          import('./renda-fixa/renda-fixa.routes').then((m) => m.RENDA_FIXA_ROUTES),
      },
      {
        path: 'comparacao',
        loadChildren: () =>
          import('./comparacao/comparacao.routes').then((m) => m.COMPARACAO_ROUTES),
      },
      {
        path: 'perfil',
        loadChildren: () => import('./perfil/perfil.routes').then((m) => m.PERFIL_ROUTES),
      },
      {
        path: 'gestor',
        canActivate: [gestorGuard],
        loadChildren: () => import('./gestor/gestor.routes').then((m) => m.GESTOR_ROUTES),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./pagina-nao-encontrada/pagina-nao-encontrada.component').then(
            (m) => m.PaginaNaoEncontradaComponent,
          ),
      },
    ],
  },
];
