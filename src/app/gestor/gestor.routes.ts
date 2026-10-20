import { Routes } from '@angular/router';
import { GestorLayoutComponent } from './gestor-layout/gestor-layout.component';

export const GESTOR_ROUTES: Routes = [
  {
    path: '',
    component: GestorLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard-admin/dashboard-admin.component').then((m) => m.DashboardAdminComponent),
      },
      {
        path: 'ativos',
        loadComponent: () => import('./ativos/lista-ativos.component').then((m) => m.ListaAtivosComponent),
      },
      {
        path: 'ativos/novo',
        loadComponent: () => import('./ativos/formulario-ativo.component').then((m) => m.FormularioAtivoComponent),
      },
      {
        path: 'ativos/:id',
        loadComponent: () => import('./ativos/formulario-ativo.component').then((m) => m.FormularioAtivoComponent),
      },
      {
        path: 'titulos',
        loadComponent: () => import('./titulos/lista-titulos.component').then((m) => m.ListaTitulosComponent),
      },
      {
        path: 'titulos/novo',
        loadComponent: () => import('./titulos/formulario-titulo.component').then((m) => m.FormularioTituloComponent),
      },
      {
        path: 'titulos/:id',
        loadComponent: () => import('./titulos/formulario-titulo.component').then((m) => m.FormularioTituloComponent),
      },
    ],
  },
];
