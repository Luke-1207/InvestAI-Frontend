import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div
      class="app-spinner"
      [class.app-spinner--pequeno]="tamanho() === 'pequeno'"
      [class.app-spinner--grande]="tamanho() === 'grande'"
      role="status"
      [attr.aria-label]="rotulo()"
    ></div>
  `,
  styleUrl: './spinner.component.scss',
})
export class SpinnerComponent {
  readonly tamanho = input<'pequeno' | 'medio' | 'grande'>('medio');
  readonly rotulo = input('Carregando');
}
