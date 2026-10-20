import { Component, input } from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CORES_COMPATIBILIDADE } from '../../models/compatibilidade';
import { SugestaoAtivoItem } from '../../models/dashboard';

@Component({
  selector: 'app-cartao-sugestao-ativo',
  standalone: true,
  imports: [DecimalPipe, NgTemplateOutlet, RouterLink],
  templateUrl: './cartao-sugestao-ativo.component.html',
  styleUrl: './cartao-sugestao-ativo.component.scss',
})
export class CartaoSugestaoAtivoComponent {
  readonly item = input.required<SugestaoAtivoItem>();
  readonly nivelTitulo = input<2 | 3>(3);

  protected readonly corCompatibilidade = CORES_COMPATIBILIDADE;
}
