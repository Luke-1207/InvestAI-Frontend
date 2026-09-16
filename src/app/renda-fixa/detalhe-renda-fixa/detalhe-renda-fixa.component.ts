import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { RendaFixaService } from '../../shared/services/renda-fixa.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  DetalheRendaFixaNormalizado,
  TituloPrivadoDetalhe,
  TituloTesouroDetalhe,
} from '../../shared/models/renda-fixa';
import { CORES_COMPATIBILIDADE, Compatibilidade } from '../../shared/models/compatibilidade';
import { ehUuid } from '../../shared/utils/uuid.util';
import { calcularAliquotaIR, calcularTaxaLiquida } from '../../shared/utils/ir-regressivo.util';
import { SkeletonDetalheComponent } from '../../shared/components/ui/skeleton-detalhe/skeleton-detalhe.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { GraficoBarrasComponent, BarraDado } from '../../shared/components/ui/grafico-barras/grafico-barras.component';

function normalizarPrivado(dto: TituloPrivadoDetalhe): DetalheRendaFixaNormalizado {
  return {
    identificador: dto.id,
    categoria: dto.tipo,
    nomeOuEmissor: dto.emissor,
    indexadorOuTipo: dto.indexador,
    taxaBrutaAnual: dto.rentabilidadeEstimada.taxaBrutaAnual,
    aliquotaIR: dto.rentabilidadeEstimada.aliquotaIR,
    taxaLiquidaAnual: dto.rentabilidadeEstimada.taxaLiquidaAnual,
    vencimento: dto.vencimento,
    investimentoMinimo: dto.investimentoMinimo,
    liquidez: dto.liquidez,
    isentoIr: dto.isentoIr,
    garantiaLabel: dto.garantidoFgc ? 'Garantido pelo FGC' : null,
    resumoIA: dto.resumoIA,
  };
}

function normalizarTesouro(dto: TituloTesouroDetalhe): DetalheRendaFixaNormalizado {
  const aliquotaIR = calcularAliquotaIR(dto.vencimento);
  return {
    identificador: dto.codigo,
    categoria: 'TESOURO',
    nomeOuEmissor: dto.nome,
    indexadorOuTipo: dto.tipo.descricao,
    taxaBrutaAnual: dto.taxaAnual,
    aliquotaIR,
    taxaLiquidaAnual: calcularTaxaLiquida(dto.taxaAnual, aliquotaIR),
    vencimento: dto.vencimento,
    investimentoMinimo: dto.precoMinimo,
    liquidez: dto.liquidez,
    isentoIr: false,
    garantiaLabel: 'Tesouro Nacional',
    resumoIA: dto.resumoIA,
  };
}

@Component({
  selector: 'app-detalhe-renda-fixa',
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    SkeletonDetalheComponent,
    ErroServidorComponent,
    GraficoBarrasComponent,
  ],
  templateUrl: './detalhe-renda-fixa.component.html',
  styleUrl: './detalhe-renda-fixa.component.scss',
})
export class DetalheRendaFixaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rendaFixaService = inject(RendaFixaService);
  private readonly toastService = inject(ToastService);

  protected readonly identificador = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly corCompatibilidade = CORES_COMPATIBILIDADE;

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly detalhe = signal<DetalheRendaFixaNormalizado | null>(null);

  protected readonly carregandoScore = signal(true);
  protected readonly score = signal<number | null>(null);
  protected readonly compatibilidade = signal<Compatibilidade | null>(null);

  protected readonly favoritado = signal(false);

  protected readonly barras = computed<BarraDado[]>(() => {
    const d = this.detalhe();
    if (!d) return [];

    const valorInicial = d.investimentoMinimo;
    const retornoBruto = valorInicial * (1 + d.taxaBrutaAnual / 100);
    const retornoLiquido = valorInicial * (1 + d.taxaLiquidaAnual / 100);

    return [
      { rotulo: 'Valor Inicial', valor: valorInicial, cor: 'var(--text-secondary)' },
      { rotulo: 'Retorno Bruto (1 ano)', valor: retornoBruto, cor: 'var(--accent)' },
      { rotulo: 'Retorno Líquido (1 ano)', valor: retornoLiquido, cor: 'var(--success-strong)' },
    ];
  });

  ngOnInit(): void {
    this.carregarDetalhe();
    this.carregarScore();
  }

  protected carregarDetalhe(): void {
    this.carregando.set(true);
    this.erro.set(false);

    const observable = ehUuid(this.identificador)
      ? this.rendaFixaService.obterDetalhePrivado(this.identificador).pipe(map(normalizarPrivado))
      : this.rendaFixaService.obterDetalheTesouro(this.identificador).pipe(map(normalizarTesouro));

    observable.subscribe({
      next: (normalizado) => {
        this.detalhe.set(normalizado);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set(true);
      },
    });
  }

  private carregarScore(): void {
    this.carregandoScore.set(true);

    this.rendaFixaService.listar('inteligente').subscribe({
      next: (itens) => {
        const item = itens.find(
          (i) => i.id === this.identificador || i.codigo === this.identificador,
        );
        if (item?.score != null) {
          this.score.set(item.score);
          this.compatibilidade.set(item.compatibilidade);
        }
        this.carregandoScore.set(false);
      },
      error: () => {
        this.carregandoScore.set(false);
      },
    });
  }

  protected alternarFavorito(): void {
    this.favoritado.update((atual) => !atual);
    this.toastService.sucesso(
      this.favoritado() ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.',
    );
  }

  protected compararAtivo(): void {
    this.router.navigate(['/comparacao'], { queryParams: { titulo: this.identificador } });
  }
}
