import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-tabela-gestao',
  standalone: true,
  template: '<ng-content />',
  styleUrl: './tabela-gestao.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TabelaGestaoComponent {}
