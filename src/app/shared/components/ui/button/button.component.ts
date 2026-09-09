import { Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variante = input<'primaria' | 'secundaria'>('primaria');
  readonly tipoHtml = input<'button' | 'submit'>('button');
  readonly desabilitado = input(false);
  readonly carregando = input(false);
}
