import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./cadastro/cadastro.component').then((m) => m.CadastroComponent),
  },
  {
    path: 'recuperar-senha',
    loadComponent: () =>
      import('./recuperar-senha/recuperar-senha.component').then((m) => m.RecuperarSenhaComponent),
  },
  {
    path: 'redefinir-senha',
    loadComponent: () =>
      import('./redefinir-senha/redefinir-senha.component').then((m) => m.RedefinirSenhaComponent),
  },
];
