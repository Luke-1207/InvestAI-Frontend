import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PontoHistorico } from '../../../models/acao';

const LARGURA = 600;
const ALTURA = 220;

@Component({
  selector: 'app-grafico-linha-preco',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './grafico-linha-preco.component.html',
  styleUrl: './grafico-linha-preco.component.scss',
})
export class GraficoLinhaPrecoComponent {
  readonly pontos = input.required<PontoHistorico[]>();

  protected readonly largura = LARGURA;
  protected readonly altura = ALTURA;

  protected readonly minimo = computed(() => {
    const p = this.pontos();
    return p.length ? Math.min(...p.map((pt) => pt.minima)) : 0;
  });

  protected readonly maximo = computed(() => {
    const p = this.pontos();
    return p.length ? Math.max(...p.map((pt) => pt.maxima)) : 0;
  });

  protected readonly caminhos = computed(() => {
    const pontos = this.pontos();
    if (pontos.length === 0) return { linha: '', area: '' };

    const min = Math.min(...pontos.map((p) => p.fechamento));
    const max = Math.max(...pontos.map((p) => p.fechamento));
    const amplitude = max - min || 1;

    const coordenadas = pontos.map((p, i) => {
      const x = (i / (pontos.length - 1 || 1)) * LARGURA;
      const y = ALTURA - ((p.fechamento - min) / amplitude) * ALTURA;
      return { x, y };
    });

    const linha = coordenadas.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const area = `${linha} L ${LARGURA} ${ALTURA} L 0 ${ALTURA} Z`;

    return { linha, area };
  });
}
