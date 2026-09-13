import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      class="app-skeleton"
      [style.width]="largura()"
      [style.height]="altura()"
      [style.border-radius]="raio()"
    ></div>
  `,
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  readonly largura = input('100%');
  readonly altura = input('16px');
  readonly raio = input('8px');
}
