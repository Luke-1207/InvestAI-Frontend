import { Routes } from '@angular/router';

export const GESTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard-admin/dashboard-admin.component').then((m) => m.DashboardAdminComponent),
  },
];
