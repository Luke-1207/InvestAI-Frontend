import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface BarraDado {
  rotulo: string;
  valor: number;
  cor: string;
}

const ALTURA_MAXIMA = 180;

@Component({
  selector: 'app-grafico-barras',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './grafico-barras.component.html',
  styleUrl: './grafico-barras.component.scss',
})
export class GraficoBarrasComponent {
  readonly barras = input.required<BarraDado[]>();

  protected readonly barrasComAltura = computed(() => {
    const dados = this.barras();
    const maximo = Math.max(...dados.map((b) => b.valor), 1);

    return dados.map((b) => ({
      ...b,
      alturaPx: Math.max(4, (b.valor / maximo) * ALTURA_MAXIMA),
    }));
  });
}
