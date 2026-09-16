import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { RendaFixaService } from '../shared/services/renda-fixa.service';
import { RendaFixaListagem, CategoriaRendaFixa } from '../shared/models/renda-fixa';
import { CORES_COMPATIBILIDADE } from '../shared/models/compatibilidade';
import { SkeletonCardComponent } from '../shared/components/ui/skeleton-card/skeleton-card.component';
import { ErroServidorComponent } from '../shared/components/erro-servidor/erro-servidor.component';

type Modo = 'livre' | 'inteligente';
type FiltroCategoria = 'TODOS' | 'TESOURO' | 'CDB';

interface OpcaoCategoria {
  valor: FiltroCategoria;
  rotulo: string;
}

const SKELETONS_PLACEHOLDER = [0, 1, 2, 3, 4, 5];

@Component({
  selector: 'app-renda-fixa',
  standalone: true,
  imports: [DecimalPipe, DatePipe, SkeletonCardComponent, ErroServidorComponent],
  templateUrl: './renda-fixa.component.html',
  styleUrl: './renda-fixa.component.scss',
})
export class RendaFixaComponent implements OnInit {
  private readonly rendaFixaService = inject(RendaFixaService);
  private readonly router = inject(Router);

  protected readonly OPCOES_CATEGORIA: OpcaoCategoria[] = [
    { valor: 'TODOS', rotulo: 'Tudo' },
    { valor: 'TESOURO', rotulo: 'Tesouro Direto' },
    { valor: 'CDB', rotulo: 'CDBs' },
  ];

  protected readonly skeletonsPlaceholder = SKELETONS_PLACEHOLDER;
  protected readonly corCompatibilidade = CORES_COMPATIBILIDADE;

  protected readonly modo = signal<Modo>('livre');
  protected readonly filtroCategoria = signal<FiltroCategoria>('TODOS');

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly itens = signal<RendaFixaListagem[]>([]);

  protected readonly itensFiltrados = computed(() => {
    const categoria = this.filtroCategoria();
    if (categoria === 'TODOS') return this.itens();
    return this.itens().filter((item) => item.categoria === categoria);
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected alternarModo(novoModo: Modo): void {
    if (this.modo() === novoModo) return;
    this.modo.set(novoModo);
    this.carregar();
  }

  protected selecionarCategoria(categoria: FiltroCategoria): void {
    this.filtroCategoria.set(categoria);
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);

    this.rendaFixaService.listar(this.modo()).subscribe({
      next: (resposta) => {
        this.itens.set(resposta);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set(true);
      },
    });
  }

  protected abrirDetalhe(item: RendaFixaListagem): void {
    this.router.navigateByUrl(`/renda-fixa/${item.codigo ?? item.id}`);
  }

  protected seloGarantia(item: RendaFixaListagem): string | null {
    if (item.categoria === 'TESOURO') return 'Tesouro Nacional';
    if (item.garantidoFgc) return 'Garantido pelo FGC';
    return null;
  }
}
