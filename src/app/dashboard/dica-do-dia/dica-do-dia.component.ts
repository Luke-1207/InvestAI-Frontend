import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SugestaoAtivoItem } from '../../shared/models/dashboard';
import { dicaEducativaDoDia } from './dicas-educativas';

@Component({
  selector: 'app-dica-do-dia',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './dica-do-dia.component.html',
  styleUrl: './dica-do-dia.component.scss',
})
export class DicaDoDiaComponent {
  readonly destaque = input<SugestaoAtivoItem | null>(null);

  protected readonly dica = dicaEducativaDoDia(new Date());
}
