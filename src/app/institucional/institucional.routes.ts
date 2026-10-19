import { Routes } from '@angular/router';

export const INSTITUCIONAL_ROUTES: Routes = [
  {
    path: 'termos-de-uso',
    loadComponent: () => import('./termos-de-uso/termos-de-uso.component').then((m) => m.TermosDeUsoComponent),
  },
  {
    path: 'privacidade',
    loadComponent: () => import('./privacidade/privacidade.component').then((m) => m.PrivacidadeComponent),
  },
  {
    path: 'conformidade',
    loadComponent: () => import('../conformidade/conformidade.component').then((m) => m.ConformidadeComponent),
  },
  {
    path: 'regras-cvm',
    loadComponent: () => import('./regras-cvm/regras-cvm.component').then((m) => m.RegrasCvmComponent),
  },
];
