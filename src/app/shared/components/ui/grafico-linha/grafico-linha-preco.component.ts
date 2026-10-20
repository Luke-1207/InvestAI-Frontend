import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PontoHistorico } from '../../../models/acao';

const ALTURA = 260;
const LARGURA_PADRAO = 600;
const LARGURA_MINIMA = 240;
const MARGEM_TOPO = 16;
const MARGEM_DIREITA = 16;
const MARGEM_BASE = 32;
const LARGURA_CARACTERE = 6.6;
const ESPACO_ROTULO_Y = 12;
const ESPACO_ENTRE_DATAS = 90;
const MAXIMO_DATAS = 6;
const QUANTIDADE_VALORES = 4;
const DIAS_PARA_MOSTRAR_MES = 120;
const LIMITE_BORDA_BALAO = 64;
const LIMITE_TOPO_BALAO = 60;
const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

let proximoId = 0;

interface MarcaEixo {
  posicao: number;
  rotulo: string;
}

interface MarcaData extends MarcaEixo {
  indice: number;
  ancora: 'start' | 'middle' | 'end';
}

const formatoPreco = (casas: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export function valoresDoEixo(minimo: number, maximo: number, quantidade = QUANTIDADE_VALORES): number[] {
  const amplitude = maximo - minimo || Math.abs(maximo) * 0.02 || 1;
  const passoBruto = amplitude / quantidade;
  const potencia = Math.pow(10, Math.floor(Math.log10(passoBruto)));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= passoBruto)!;

  const inicio = Math.floor(minimo / passo) * passo;
  const fim = Math.max(Math.ceil(maximo / passo) * passo, inicio + passo);
  const valores: number[] = [];
  for (let valor = inicio; valor <= fim + passo / 2; valor += passo) {
    valores.push(Math.round(valor * 1e6) / 1e6);
  }
  return valores;
}

function partesDaData(data: string): [number, number, number] {
  const [ano, mes, dia] = data.slice(0, 10).split('-').map(Number);
  return [ano, mes, dia];
}

function diaAbsoluto(data: string): number {
  const [ano, mes, dia] = partesDaData(data);
  return Date.UTC(ano, mes - 1, dia) / UM_DIA_EM_MS;
}

export function formatarDataCompleta(data: string): string {
  const [ano, mes, dia] = partesDaData(data);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
}

export function formatarDataEixo(data: string, intervaloEmDias: number): string {
  const [ano, mes, dia] = partesDaData(data);
  if (intervaloEmDias > DIAS_PARA_MOSTRAR_MES) {
    return `${MESES[mes - 1]}/${String(ano).slice(2)}`;
  }
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

@Component({
  selector: 'app-grafico-linha-preco',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './grafico-linha-preco.component.html',
  styleUrl: './grafico-linha-preco.component.scss',
})
export class GraficoLinhaPrecoComponent {
  readonly pontos = input.required<PontoHistorico[]>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly altura = ALTURA;
  protected readonly topo = MARGEM_TOPO;
  protected readonly base = ALTURA - MARGEM_BASE;
  protected readonly largura = signal(LARGURA_PADRAO);
  protected readonly indiceAtivo = signal<number | null>(null);

  protected readonly minimo = computed(() => {
    const p = this.pontos();
    return p.length ? Math.min(...p.map((pt) => pt.minima)) : 0;
  });

  protected readonly maximo = computed(() => {
    const p = this.pontos();
    return p.length ? Math.max(...p.map((pt) => pt.maxima)) : 0;
  });

  private readonly valoresY = computed(() => {
    const fechamentos = this.pontos().map((p) => p.fechamento);
    if (fechamentos.length === 0) return [0, 1];
    return valoresDoEixo(Math.min(...fechamentos), Math.max(...fechamentos));
  });

  private readonly formatoY = computed(() => {
    const valores = this.valoresY();
    const passo = valores[1] - valores[0];
    return formatoPreco(Number.isInteger(passo) && valores.every(Number.isInteger) ? 0 : 2);
  });

  protected readonly marcasY = computed<MarcaEixo[]>(() =>
    this.valoresY().map((valor) => ({ posicao: this.yDoValor(valor), rotulo: `R$ ${this.formatoY().format(valor)}` })),
  );

  protected readonly esquerda = computed(() => {
    const maiorRotulo = Math.max(...this.valoresY().map((v) => `R$ ${this.formatoY().format(v)}`.length));
    return Math.ceil(maiorRotulo * LARGURA_CARACTERE + ESPACO_ROTULO_Y);
  });

  protected readonly direita = computed(() => this.largura() - MARGEM_DIREITA);

  private readonly coordenadas = computed(() => {
    const pontos = this.pontos();
    const esquerda = this.esquerda();
    const larguraPlot = this.direita() - esquerda;
    const divisor = pontos.length - 1 || 1;
    return pontos.map((p, i) => ({ x: esquerda + (i / divisor) * larguraPlot, y: this.yDoValor(p.fechamento) }));
  });

  protected readonly caminhos = computed(() => {
    const coordenadas = this.coordenadas();
    if (coordenadas.length === 0) return { linha: '', area: '' };

    const linha = coordenadas.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const ultima = coordenadas[coordenadas.length - 1];
    const area = `${linha} L ${ultima.x} ${this.base} L ${coordenadas[0].x} ${this.base} Z`;
    return { linha, area };
  });

  private readonly intervaloEmDias = computed(() => {
    const pontos = this.pontos();
    if (pontos.length < 2) return 0;
    return diaAbsoluto(pontos[pontos.length - 1].data) - diaAbsoluto(pontos[0].data);
  });

  protected readonly marcasX = computed<MarcaData[]>(() => {
    const pontos = this.pontos();
    const coordenadas = this.coordenadas();
    if (pontos.length === 0) return [];

    const larguraPlot = this.direita() - this.esquerda();
    const quantidade = Math.min(MAXIMO_DATAS, pontos.length, Math.max(2, Math.floor(larguraPlot / ESPACO_ENTRE_DATAS) + 1));
    const indices = quantidade < 2 ? [0] : Array.from({ length: quantidade }, (_, j) => Math.round((j * (pontos.length - 1)) / (quantidade - 1)));

    return [...new Set(indices)].map((indice, posicao, lista) => ({
      indice,
      posicao: coordenadas[indice].x,
      rotulo: formatarDataEixo(pontos[indice].data, this.intervaloEmDias()),
      ancora: lista.length > 1 && posicao === 0 ? 'start' : lista.length > 1 && posicao === lista.length - 1 ? 'end' : 'middle',
    }));
  });

  protected readonly pontoAtivo = computed(() => {
    const indice = this.indiceAtivo();
    const ponto = indice === null ? undefined : this.pontos()[indice];
    if (indice === null || !ponto) return null;

    const { x, y } = this.coordenadas()[indice];
    return {
      x,
      y,
      data: formatarDataCompleta(ponto.data),
      preco: `R$ ${formatoPreco(2).format(ponto.fechamento)}`,
      noInicio: x < LIMITE_BORDA_BALAO,
      noFim: x > this.largura() - LIMITE_BORDA_BALAO,
      abaixo: y < LIMITE_TOPO_BALAO,
    };
  });

  protected readonly anuncio = computed(() => {
    const ponto = this.pontoAtivo();
    return ponto ? `${ponto.data}, fechamento de ${ponto.preco}` : '';
  });

  protected readonly rotuloAcessivel = computed(() => {
    const pontos = this.pontos();
    if (pontos.length === 0) return '';
    const primeira = formatarDataCompleta(pontos[0].data);
    const ultima = formatarDataCompleta(pontos[pontos.length - 1].data);
    return `Gráfico do preço de fechamento de ${primeira} a ${ultima}. Use as setas para percorrer os dias.`;
  });

  protected readonly idResumo = `grafico-linha-resumo-${proximoId++}`;

  protected readonly resumo = computed(() => {
    const pontos = this.pontos();
    if (pontos.length === 0) return '';
    const moeda = formatoPreco(2);
    const primeiro = pontos[0];
    const ultimo = pontos[pontos.length - 1];
    const menor = pontos.reduce((a, b) => (b.fechamento < a.fechamento ? b : a));
    const maior = pontos.reduce((a, b) => (b.fechamento > a.fechamento ? b : a));
    const variacao = primeiro.fechamento ? ((ultimo.fechamento - primeiro.fechamento) / primeiro.fechamento) * 100 : 0;
    const sentido = variacao > 0 ? 'alta' : variacao < 0 ? 'queda' : 'variação';
    return (
      `O fechamento foi de R$ ${moeda.format(primeiro.fechamento)} em ${formatarDataCompleta(primeiro.data)} ` +
      `para R$ ${moeda.format(ultimo.fechamento)} em ${formatarDataCompleta(ultimo.data)}, ` +
      `${sentido} de ${moeda.format(Math.abs(variacao))}%. ` +
      `O menor fechamento foi R$ ${moeda.format(menor.fechamento)}, em ${formatarDataCompleta(menor.data)}, ` +
      `e o maior foi R$ ${moeda.format(maior.fechamento)}, em ${formatarDataCompleta(maior.data)}.`
    );
  });

  constructor() {
    afterNextRender(() => {
      this.medir(this.host.nativeElement.clientWidth);
      if (typeof ResizeObserver === 'undefined') return;
      const observador = new ResizeObserver((entradas) => this.medir(entradas[0].contentRect.width));
      observador.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observador.disconnect());
    });
  }

  protected aoMoverPonteiro(evento: PointerEvent): void {
    const svg = evento.currentTarget as SVGSVGElement;
    const caixa = svg.getBoundingClientRect();
    if (caixa.width === 0) return;

    const x = ((evento.clientX - caixa.left) * this.largura()) / caixa.width;
    const larguraPlot = this.direita() - this.esquerda();
    const total = this.pontos().length;
    const indice = Math.round(((x - this.esquerda()) / larguraPlot) * (total - 1));
    this.indiceAtivo.set(Math.min(total - 1, Math.max(0, indice)));
  }

  protected aoSairPonteiro(evento: PointerEvent): void {
    if (evento.pointerType === 'mouse') this.indiceAtivo.set(null);
  }

  protected aoFocar(): void {
    if (this.indiceAtivo() === null) this.indiceAtivo.set(this.pontos().length - 1);
  }

  protected limpar(): void {
    this.indiceAtivo.set(null);
  }

  protected aoPressionarTecla(evento: KeyboardEvent): void {
    const ultimo = this.pontos().length - 1;
    const atual = this.indiceAtivo() ?? ultimo;
    const destinos: Record<string, number | null> = {
      ArrowLeft: Math.max(0, atual - 1),
      ArrowRight: Math.min(ultimo, atual + 1),
      Home: 0,
      End: ultimo,
      Escape: null,
    };
    if (!(evento.key in destinos)) return;

    evento.preventDefault();
    this.indiceAtivo.set(destinos[evento.key]);
  }

  private medir(largura: number): void {
    if (largura > 0) this.largura.set(Math.max(LARGURA_MINIMA, Math.round(largura)));
  }

  private yDoValor(valor: number): number {
    const valores = this.valoresY();
    const minimo = valores[0];
    const maximo = valores[valores.length - 1];
    return this.base - ((valor - minimo) / (maximo - minimo)) * (this.base - this.topo);
  }
}
