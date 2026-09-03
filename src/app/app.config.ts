import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // withInterceptors([]) fica pronto pro interceptor de autenticação do INVAI-82
    // (injeção do JWT e tratamento de 401) ser registrado aqui sem precisar
    // reestruturar esse arquivo depois.
    provideHttpClient(withInterceptors([])),
  ],
};
