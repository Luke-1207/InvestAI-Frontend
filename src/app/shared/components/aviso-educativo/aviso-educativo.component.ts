import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-aviso-educativo',
  standalone: true,
  imports: [RouterLink],
  template: `
    <p class="aviso-educativo">
      <span class="material-symbols-outlined" aria-hidden="true">info</span>
      <span>
        Conteúdo educativo, gerado automaticamente a partir do seu perfil. Não é recomendação de investimento.
        <a routerLink="/conformidade">Saiba mais</a>
      </span>
    </p>
  `,
  styleUrl: './aviso-educativo.component.scss',
})
export class AvisoEducativoComponent {}
