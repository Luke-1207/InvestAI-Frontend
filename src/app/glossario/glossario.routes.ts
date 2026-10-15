import { Routes } from '@angular/router';

export const GLOSSARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./glossario.component').then((m) => m.GlossarioComponent),
  },
];
