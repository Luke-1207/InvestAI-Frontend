import { Routes } from '@angular/router';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./quiz/quiz.component').then((m) => m.QuizComponent),
  },
];
