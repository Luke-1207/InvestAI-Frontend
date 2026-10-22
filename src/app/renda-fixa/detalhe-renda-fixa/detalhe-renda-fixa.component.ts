import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { RendaFixaService } from '../../shared/services/renda-fixa.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  DetalheRendaFixaNormalizado,
  RentabilidadeEstimada,
  TituloPrivadoDetalhe,
  TituloTesouroDetalhe,
} from '../../shared/models/renda-fixa';
import { CORES_COMPATIBILIDADE, Compatibilidade, CriterioScore } from '../../shared/models/compatibilidade';
import { ehUuid } from '../../shared/utils/uuid.util';
import { formatarTaxaComIndexador } from '../../shared/utils/formatacao.util';
import { SkeletonDetalheComponent } from '../../shared/components/ui/skeleton-detalhe/skeleton-detalhe.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { RelatorioService } from '../../shared/services/relatorio.service';
import { BotaoRelatorioComponent } from '../../shared/components/botao-relatorio/botao-relatorio.component';
import { RotuloPipe } from '../../shared/pipes/rotulo.pipe';
import { AjudaContextualComponent } from '../../shared/components/ajuda-contextual/ajuda-contextual.component';
import { AjudaGlossarioComponent } from '../../shared/components/ajuda-glossario/ajuda-glossario.component';
import { AvisoEducativoComponent } from '../../shared/components/aviso-educativo/aviso-educativo.component';
import { CriteriosScoreComponent } from '../../shared/components/criterios-score/criterios-score.component';
import { rotulo } from '../../shared/utils/rotulos.util';
import { SimuladorRendimentoComponent } from './simulador-rendimento/simulador-rendimento.component';

function rentabilidadeNormalizada(indexador: string, estimativa: RentabilidadeEstimada) {
  return {
    rentabilidade: formatarTaxaComIndexador(indexador, estimativa.taxaBrutaAnual, estimativa.taxaSomadaAoIndexador),
    aliquotaIR: estimativa.aliquotaIR,
    rentabilidadeLiquida:
      estimativa.taxaLiquidaAnual === null
        ? null
        : formatarTaxaComIndexador(indexador, estimativa.taxaLiquidaAnual, estimativa.taxaSomadaAoIndexador),
    percentualRendimentoLiquido: estimativa.percentualRendimentoLiquido,
  };
}

function normalizarPrivado(dto: TituloPrivadoDetalhe): DetalheRendaFixaNormalizado {
  return {
    identificador: dto.id,
    categoria: dto.tipo,
    nomeOuEmissor: dto.emissor,
    indexadorOuTipo: rotulo(dto.indexador),
    indexador: dto.indexador,
    ...rentabilidadeNormalizada(dto.indexador, dto.rentabilidadeEstimada),
    vencimento: dto.vencimento,
    investimentoMinimo: dto.investimentoMinimo,
    liquidez: dto.liquidez,
    isentoIr: dto.isentoIr,
    garantiaLabel: dto.garantidoFgc ? 'Garantido pelo FGC' : null,
    resumoIA: dto.resumoIA,
  };
}

function normalizarTesouro(dto: TituloTesouroDetalhe): DetalheRendaFixaNormalizado {
  return {
    identificador: dto.codigo,
    categoria: 'TESOURO',
    nomeOuEmissor: dto.nome,
    indexadorOuTipo: dto.tipo.descricao,
    indexador: dto.tipo.valor,
    ...rentabilidadeNormalizada(dto.tipo.valor, dto.rentabilidadeEstimada),
    vencimento: dto.vencimento,
    investimentoMinimo: dto.precoMinimo,
    liquidez: dto.liquidez,
    isentoIr: false,
    garantiaLabel: 'Tesouro Nacional',
    resumoIA: dto.resumoIA,
  };
}

export const AJUDA_RENDA_FIXA = {
  liquidez:
    'É a facilidade de transformar o investimento de volta em dinheiro. Com liquidez diária você pode resgatar em qualquer dia útil. No vencimento, o dinheiro fica aplicado até a data final do título.',
  aliquotaIR:
    'O Imposto de Renda é cobrado só sobre o que o investimento rendeu, não sobre o valor aplicado. Na renda fixa a alíquota cai com o tempo: 22,5% até 180 dias, 20% até 360 dias, 17,5% até 720 dias e 15% acima disso.',
  parcelaRendimento:
    'Neste título a taxa é somada a um índice (IPCA ou Selic), e o Imposto de Renda incide sobre todo o rendimento, inclusive a parte que vem do índice. Por isso não dá para descontar o IR só da taxa fixa: o que fica com você é essa parcela do que o título render. Para ver o valor em reais, use o simulador acima.',
};

@Component({
  selector: 'app-detalhe-renda-fixa',
  standalone: true,
  imports: [
    RotuloPipe,
    DecimalPipe,
    DatePipe,
    SkeletonDetalheComponent,
    ErroServidorComponent,
    BotaoRelatorioComponent,
    AjudaContextualComponent,
    AjudaGlossarioComponent,
    AvisoEducativoComponent,
    CriteriosScoreComponent,
    SimuladorRendimentoComponent,
  ],
  templateUrl: './detalhe-renda-fixa.component.html',
  styleUrl: './detalhe-renda-fixa.component.scss',
})
export class DetalheRendaFixaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rendaFixaService = inject(RendaFixaService);
  private readonly toastService = inject(ToastService);
  private readonly relatorioService = inject(RelatorioService);

  protected readonly identificador = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly corCompatibilidade = CORES_COMPATIBILIDADE;
  protected readonly ajuda = AJUDA_RENDA_FIXA;

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly detalhe = signal<DetalheRendaFixaNormalizado | null>(null);

  protected readonly carregandoScore = signal(true);
  protected readonly score = signal<number | null>(null);
  protected readonly criterios = signal<CriterioScore[]>([]);
  protected readonly compatibilidade = signal<Compatibilidade | null>(null);

  protected readonly favoritado = signal(false);

  protected readonly baixarRelatorio = () => this.relatorioService.baixarRelatorioAtivo(this.identificador, 'FIXA');

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
          this.criterios.set(item.criterios ?? []);
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
    this.router.navigate(['/comparacao'], {
      queryParams: { tipo: this.detalhe()?.categoria, identificador: this.identificador },
    });
  }
}
