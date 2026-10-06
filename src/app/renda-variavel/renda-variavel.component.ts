import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AcaoService } from '../shared/services/acao.service';
import { AcaoListagem, PageResponse, TipoAtivo } from '../shared/models/acao';
import { SugestoesRendaVariavel } from '../shared/models/dashboard';
import { SkeletonCardComponent } from '../shared/components/ui/skeleton-card/skeleton-card.component';
import { ErroServidorComponent } from '../shared/components/erro-servidor/erro-servidor.component';
import { CartaoSugestaoAtivoComponent } from '../shared/components/cartao-sugestao-ativo/cartao-sugestao-ativo.component';
import { RelatorioService } from '../shared/services/relatorio.service';
import { BotaoRelatorioComponent } from '../shared/components/botao-relatorio/botao-relatorio.component';
import { LIMITE_ATIVOS_RELATORIO } from '../shared/models/relatorio';

type Modo = 'livre' | 'inteligente';
type FiltroTipo = 'TODOS' | TipoAtivo;

interface OpcaoTipo {
  valor: FiltroTipo;
  rotulo: string;
}

const TAMANHO_PAGINA = 12;
const SKELETONS_PLACEHOLDER = [0, 1, 2, 3, 4, 5];

@Component({
  selector: 'app-renda-variavel',
  standalone: true,
  imports: [
    DecimalPipe,
    SkeletonCardComponent,
    ErroServidorComponent,
    CartaoSugestaoAtivoComponent,
    BotaoRelatorioComponent,
  ],
  templateUrl: './renda-variavel.component.html',
  styleUrl: './renda-variavel.component.scss',
})
export class RendaVariavelComponent implements OnInit {
  private readonly acaoService = inject(AcaoService);
  private readonly router = inject(Router);
  private readonly relatorioService = inject(RelatorioService);

  protected readonly OPCOES_TIPO: OpcaoTipo[] = [
    { valor: 'TODOS', rotulo: 'Tudo' },
    { valor: 'ACAO', rotulo: 'Ações' },
    { valor: 'FII', rotulo: 'FIIs' },
    { valor: 'ETF', rotulo: 'ETFs' },
  ];

  protected readonly skeletonsPlaceholder = SKELETONS_PLACEHOLDER;

  protected readonly modo = signal<Modo>('livre');
  protected readonly filtroTipo = signal<FiltroTipo>('TODOS');
  protected readonly paginaAtual = signal(1);

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  protected readonly pagina = signal<PageResponse<AcaoListagem> | null>(null);
  protected readonly sugestoes = signal<SugestoesRendaVariavel | null>(null);

  protected readonly podeExportar = computed(
    () => this.modo() === 'inteligente' && !this.carregando() && (this.sugestoes()?.itens.length ?? 0) > 0,
  );

  protected readonly exportarPdf = () =>
    this.relatorioService.baixarRelatorioListagem({
      modulo: 'VARIAVEL',
      filtros: {
        Modo: 'Inteligente',
        Tipo: this.OPCOES_TIPO.find((opcao) => opcao.valor === this.filtroTipo())?.rotulo ?? 'Tudo',
      },
      ativos: (this.sugestoes()?.itens ?? []).slice(0, LIMITE_ATIVOS_RELATORIO).map((item) => item.codigo),
    });

  ngOnInit(): void {
    this.carregar();
  }

  protected alternarModo(novoModo: Modo): void {
    if (this.modo() === novoModo) return;
    this.modo.set(novoModo);
    this.paginaAtual.set(1);
    this.carregar();
  }

  protected selecionarFiltroTipo(tipo: FiltroTipo): void {
    if (this.filtroTipo() === tipo) return;
    this.filtroTipo.set(tipo);
    this.paginaAtual.set(1);
    this.carregar();
  }

  protected irParaPagina(pagina: number): void {
    this.paginaAtual.set(pagina);
    this.carregar();
  }

  protected abrirDetalhe(codigo: string): void {
    this.router.navigateByUrl(`/renda-variavel/${codigo}`);
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);

    const tipoSelecionado = this.filtroTipo();
    const tiposFiltro: TipoAtivo[] | undefined =
      tipoSelecionado === 'TODOS' ? undefined : [tipoSelecionado];

    if (this.modo() === 'livre') {
      this.acaoService
        .listar({ tipo: tiposFiltro, pagina: this.paginaAtual(), tamanho: TAMANHO_PAGINA })
        .subscribe({
          next: (resposta) => {
            this.pagina.set(resposta);
            this.carregando.set(false);
          },
          error: () => {
            this.carregando.set(false);
            this.erro.set(true);
          },
        });
    } else {
      this.acaoService.listarSugestoes(tiposFiltro).subscribe({
        next: (resposta) => {
          this.sugestoes.set(resposta);
          this.carregando.set(false);
        },
        error: () => {
          this.carregando.set(false);
          this.erro.set(true);
        },
      });
    }
  }

  protected numerosDePagina(totalPaginas: number): number[] {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }
}
