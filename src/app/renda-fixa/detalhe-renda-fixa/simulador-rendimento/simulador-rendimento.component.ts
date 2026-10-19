import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RendaFixaService } from '../../../shared/services/renda-fixa.service';
import { SimulacaoRendimento } from '../../../shared/models/renda-fixa';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BarraDado, GraficoBarrasComponent } from '../../../shared/components/ui/grafico-barras/grafico-barras.component';

const VALOR_PADRAO = 1000;
const PRAZO_PADRAO = 12;
const ATALHOS_PRAZO = [
  { meses: 6, rotulo: '6 meses' },
  { meses: 12, rotulo: '1 ano' },
  { meses: 24, rotulo: '2 anos' },
  { meses: 60, rotulo: '5 anos' },
];

export function mesesAteVencimento(vencimento: string, hoje = new Date()): number {
  const [ano, mes, dia] = vencimento.slice(0, 10).split('-').map(Number);
  const meses = (ano - hoje.getFullYear()) * 12 + (mes - 1 - hoje.getMonth());
  return Math.max(0, dia < hoje.getDate() ? meses - 1 : meses);
}

@Component({
  selector: 'app-simulador-rendimento',
  standalone: true,
  imports: [DecimalPipe, DatePipe, ButtonComponent, GraficoBarrasComponent],
  templateUrl: './simulador-rendimento.component.html',
  styleUrl: './simulador-rendimento.component.scss',
})
export class SimuladorRendimentoComponent implements OnInit {
  readonly identificador = input.required<string>();
  readonly investimentoMinimo = input.required<number>();
  readonly vencimento = input.required<string>();

  private readonly rendaFixaService = inject(RendaFixaService);

  protected readonly valor = signal<number | null>(null);
  protected readonly prazoMeses = signal<number | null>(null);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly resultado = signal<SimulacaoRendimento | null>(null);

  protected readonly prazoMaximo = computed(() => mesesAteVencimento(this.vencimento()));

  protected readonly atalhos = computed(() => {
    const maximo = this.prazoMaximo();
    const atalhos = ATALHOS_PRAZO.filter((a) => a.meses < maximo);
    return maximo > 0 ? [...atalhos, { meses: maximo, rotulo: 'Até o vencimento' }] : atalhos;
  });

  protected readonly erroValor = computed(() => {
    const valor = this.valor();
    if (valor === null || Number.isNaN(valor)) return 'Informe quanto você quer investir.';
    if (valor < this.investimentoMinimo()) return `O mínimo para este título é R$ ${this.formatarDinheiro(this.investimentoMinimo())}.`;
    return null;
  });

  protected readonly erroPrazo = computed(() => {
    const prazo = this.prazoMeses();
    const maximo = this.prazoMaximo();
    if (prazo === null || Number.isNaN(prazo) || !Number.isInteger(prazo) || prazo < 1) return 'Informe um prazo de pelo menos 1 mês.';
    if (prazo > maximo) return `O título vence antes disso. Escolha até ${maximo} ${maximo === 1 ? 'mês' : 'meses'}.`;
    return null;
  });

  protected readonly barras = computed<BarraDado[]>(() => {
    const r = this.resultado();
    if (!r) return [];
    return [
      { rotulo: 'Valor investido', valor: r.valorInvestido, cor: 'var(--text-secondary)' },
      { rotulo: 'Neste título, líquido', valor: r.valorLiquido, cor: 'var(--accent)' },
      { rotulo: 'Na poupança', valor: r.valorPoupanca, cor: 'var(--warning)' },
    ];
  });

  ngOnInit(): void {
    const maximo = this.prazoMaximo();
    this.valor.set(Math.max(VALOR_PADRAO, this.investimentoMinimo()));
    this.prazoMeses.set(Math.min(PRAZO_PADRAO, maximo));
    if (maximo >= 1) this.simular();
  }

  protected aoEnviar(evento: Event): void {
    evento.preventDefault();
    this.simular();
  }

  protected escolherPrazo(meses: number): void {
    this.prazoMeses.set(meses);
    this.simular();
  }

  protected lerNumero(evento: Event): number | null {
    const texto = (evento.target as HTMLInputElement).value;
    return texto === '' ? null : Number(texto);
  }

  private simular(): void {
    if (this.erroValor() || this.erroPrazo()) return;

    this.carregando.set(true);
    this.erro.set(null);
    this.rendaFixaService.simular(this.identificador(), this.valor()!, this.prazoMeses()!).subscribe({
      next: (resultado) => {
        this.resultado.set(resultado);
        this.carregando.set(false);
      },
      error: (erro: HttpErrorResponse) => {
        this.erro.set(this.extrairMensagem(erro));
        this.carregando.set(false);
      },
    });
  }

  private extrairMensagem(erro: HttpErrorResponse): string {
    const detalhes = erro.error?.detalhes as Record<string, string> | undefined;
    if (detalhes && Object.keys(detalhes).length) return Object.values(detalhes)[0];
    if (erro.status !== 500 && typeof erro.error?.erro === 'string') return erro.error.erro;
    return 'Não foi possível fazer a simulação agora. Tente novamente em instantes.';
  }

  private formatarDinheiro(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
  }
}
