import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CORES_COMPATIBILIDADE } from '../../models/compatibilidade';
import { SugestaoAtivoItem } from '../../models/dashboard';

@Component({
  selector: 'app-cartao-sugestao-ativo',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './cartao-sugestao-ativo.component.html',
  styleUrl: './cartao-sugestao-ativo.component.scss',
})
export class CartaoSugestaoAtivoComponent {
  readonly item = input.required<SugestaoAtivoItem>();
  readonly clique = output<void>();

  protected readonly corCompatibilidade = CORES_COMPATIBILIDADE;
}
