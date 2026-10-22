import { Component, input, model } from '@angular/core';
import { FiltroStatus, OPCOES_FILTRO_STATUS } from '../../shared/models/gestao-catalogo';

export interface OpcaoFiltro {
  valor: string;
  rotulo: string;
}

@Component({
  selector: 'app-filtros-gestao',
  standalone: true,
  templateUrl: './filtros-gestao.component.html',
  styleUrl: './filtros-gestao.component.scss',
})
export class FiltrosGestaoComponent {
  readonly rotuloBusca = input.required<string>();
  readonly placeholder = input('');
  readonly opcoesTipo = input.required<OpcaoFiltro[]>();
  readonly rotuloTipo = input('Filtrar por tipo');
  readonly termo = model('');
  readonly tipo = model('TODOS');
  readonly status = model<FiltroStatus>('TODOS');

  protected readonly opcoesStatus = OPCOES_FILTRO_STATUS;
}
