import { Component, computed, input, signal } from '@angular/core';

export interface SegmentoDonut {
  rotulo: string;
  valor: number;
  cor: string;
}

interface ArcoCalculado extends SegmentoDonut {
  comprimento: number;
  dashoffset: number;
  percentual: number;
}

const AUMENTO_DESTAQUE = 6;

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
})
export class DonutChartComponent {
  readonly segmentos = input.required<SegmentoDonut[]>();
  readonly raio = input(70);
  readonly espessura = input(20);

  protected readonly ativo = signal<number | null>(null);

  protected readonly tamanhoSvg = computed(() => (this.raio() + this.espessura()) * 2);
  protected readonly centro = computed(() => this.tamanhoSvg() / 2);
  protected readonly circunferencia = computed(() => 2 * Math.PI * this.raio());
  protected readonly espessuraDestaque = computed(() => this.espessura() + AUMENTO_DESTAQUE);

  protected readonly arcos = computed<ArcoCalculado[]>(() => {
    const total = this.segmentos().reduce((soma, s) => soma + s.valor, 0);
    if (total <= 0) return [];

    let acumulado = 0;
    const circunferencia = this.circunferencia();

    return this.segmentos().map((segmento) => {
      const fracao = segmento.valor / total;
      const comprimento = fracao * circunferencia;
      const arco: ArcoCalculado = {
        ...segmento,
        percentual: Math.round(fracao * 100),
        comprimento,
        dashoffset: -acumulado,
      };
      acumulado += comprimento;
      return arco;
    });
  });

  protected readonly arcoAtivo = computed(() => {
    const indice = this.ativo();
    return indice === null ? null : (this.arcos()[indice] ?? null);
  });

  protected readonly descricao = computed(() =>
    this.arcos()
      .map((arco) => `${arco.rotulo}: ${arco.percentual}%`)
      .join(', '),
  );

  protected destacar(indice: number | null): void {
    this.ativo.set(indice);
  }
}
