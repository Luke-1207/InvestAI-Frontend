import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ComparacaoService } from '../shared/services/comparacao.service';
import { ItemComparacao, ItemSelecionavel, TipoItemComparacao } from '../shared/models/comparacao';
import { CORES_COMPATIBILIDADE } from '../shared/models/compatibilidade';
import { SkeletonCardComponent } from '../shared/components/ui/skeleton-card/skeleton-card.component';
import { ErroServidorComponent } from '../shared/components/erro-servidor/erro-servidor.component';

type Etapa = 'selecao' | 'resultado';
type Slot = 'A' | 'B';

@Component({
  selector: 'app-comparacao',
  standalone: true,
  imports: [SkeletonCardComponent, ErroServidorComponent],
  templateUrl: './comparacao.component.html',
  styleUrl: './comparacao.component.scss',
})
export class ComparacaoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly comparacaoService = inject(ComparacaoService);

  protected readonly corCompatibilidade = CORES_COMPATIBILIDADE;
  protected readonly skeletonsPlaceholder = [0, 1, 2, 3, 4, 5];

  protected readonly etapa = signal<Etapa>('selecao');
  protected readonly termoBusca = signal('');
  protected readonly carregandoLista = signal(true);
  protected readonly itensDisponiveis = signal<ItemSelecionavel[]>([]);

  protected readonly slotA = signal<ItemSelecionavel | null>(null);
  protected readonly slotB = signal<ItemSelecionavel | null>(null);

  protected readonly itensFiltrados = computed(() => {
    const termo = this.termoBusca().toLowerCase().trim();
    const disponiveis = this.itensDisponiveis().filter((item) => !this.jaSelecionado(item));
    if (!termo) return disponiveis;
    return disponiveis.filter(
      (item) =>
        item.rotulo.toLowerCase().includes(termo) ||
        item.identificador.toLowerCase().includes(termo),
    );
  });

  protected readonly podeComparar = computed(() => this.slotA() !== null && this.slotB() !== null);

  protected readonly carregandoResultado = signal(false);
  protected readonly erroResultado = signal(false);
  protected readonly itemResultadoA = signal<ItemComparacao | null>(null);
  protected readonly itemResultadoB = signal<ItemComparacao | null>(null);

  protected readonly carregandoVeredito = signal(false);
  protected readonly veredito = signal<string | null>(null);

  ngOnInit(): void {
    this.carregarLista();
  }

  private carregarLista(): void {
    this.carregandoLista.set(true);

    this.comparacaoService.listarItensSelecionaveis().subscribe({
      next: (itens) => {
        this.itensDisponiveis.set(itens);
        this.carregandoLista.set(false);
        this.preencherSlotDaQuery(itens);
      },
      error: () => {
        this.carregandoLista.set(false);
      },
    });
  }

  private preencherSlotDaQuery(itens: ItemSelecionavel[]): void {
    const tipo = this.route.snapshot.queryParamMap.get('tipo') as TipoItemComparacao | null;
    const identificador = this.route.snapshot.queryParamMap.get('identificador');
    if (!tipo || !identificador) return;

    const encontrado = itens.find((i) => i.tipo === tipo && i.identificador === identificador);
    this.slotA.set(encontrado ?? { tipo, identificador, rotulo: identificador, subRotulo: '' });
  }

  private jaSelecionado(item: ItemSelecionavel): boolean {
    const iguais = (a: ItemSelecionavel | null) =>
      !!a && a.tipo === item.tipo && a.identificador === item.identificador;
    return iguais(this.slotA()) || iguais(this.slotB());
  }

  protected selecionarItem(item: ItemSelecionavel): void {
    if (!this.slotA()) {
      this.slotA.set(item);
    } else if (!this.slotB()) {
      this.slotB.set(item);
    }
  }

  protected removerSlot(slot: Slot): void {
    if (slot === 'A') this.slotA.set(null);
    else this.slotB.set(null);
  }

  protected avancarParaResultado(): void {
    if (!this.podeComparar()) return;
    this.etapa.set('resultado');
    this.carregarResultado();
  }

  protected voltarParaSelecao(): void {
    this.etapa.set('selecao');
    this.veredito.set(null);
    this.itemResultadoA.set(null);
    this.itemResultadoB.set(null);
  }

  private carregarResultado(): void {
    const a = this.slotA();
    const b = this.slotB();
    if (!a || !b) return;

    this.carregandoResultado.set(true);
    this.erroResultado.set(false);

    forkJoin({
      itemA: this.comparacaoService.carregarItemComparacao(a.tipo, a.identificador),
      itemB: this.comparacaoService.carregarItemComparacao(b.tipo, b.identificador),
    }).subscribe({
      next: ({ itemA, itemB }) => {
        this.itemResultadoA.set(itemA);
        this.itemResultadoB.set(itemB);
        this.carregandoResultado.set(false);
      },
      error: () => {
        this.carregandoResultado.set(false);
        this.erroResultado.set(true);
      },
    });

    this.carregarVeredito(a, b);
  }

  private carregarVeredito(a: ItemSelecionavel, b: ItemSelecionavel): void {
    this.carregandoVeredito.set(true);

    this.comparacaoService.obterVeredito(a.tipo, a.identificador, b.tipo, b.identificador).subscribe({
      next: (resposta) => {
        this.veredito.set(resposta.veredito);
        this.carregandoVeredito.set(false);
      },
      error: () => {
        this.carregandoVeredito.set(false);
      },
    });
  }
}
