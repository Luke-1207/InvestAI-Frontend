import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AcaoService } from '../../shared/services/acao.service';
import { ToastService } from '../../shared/services/toast.service';
import { AcaoDetalhe } from '../../shared/models/acao';
import { SugestaoAtivoItem } from '../../shared/models/dashboard';
import { CORES_COMPATIBILIDADE, Compatibilidade } from '../../shared/models/compatibilidade';
import { SkeletonDetalheComponent } from '../../shared/components/ui/skeleton-detalhe/skeleton-detalhe.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import {GraficoLinhaPrecoComponent} from '../../shared/components/ui/grafico-linha/grafico-linha-preco.component';

interface OpcaoPeriodo {
  valor: string;
  rotulo: string;
}

const PERIODOS: OpcaoPeriodo[] = [
  { valor: '1S', rotulo: '1S' },
  { valor: '1M', rotulo: '1M' },
  { valor: '3M', rotulo: '3M' },
  { valor: '6M', rotulo: '6M' },
  { valor: '1A', rotulo: '1A' },
];

const NOTA_RISCO: Record<Compatibilidade, string> = {
  ALTA: 'Alinhado ao seu perfil de risco.',
  MEDIA: 'Parcialmente alinhado ao seu perfil — avalie com atenção.',
  BAIXA: 'Fora do que costuma combinar com seu perfil — atenção ao risco.',
};

@Component({
  selector: 'app-detalhe-ativo',
  standalone: true,
  imports: [
    DecimalPipe,
    SkeletonDetalheComponent,
    ErroServidorComponent,
    GraficoLinhaPrecoComponent,
  ],
  templateUrl: './detalhe-ativo.component.html',
  styleUrl: './detalhe-ativo.component.scss',
})
export class DetalheAtivoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly acaoService = inject(AcaoService);
  private readonly toastService = inject(ToastService);

  protected readonly PERIODOS = PERIODOS;
  protected readonly corCompatibilidade = CORES_COMPATIBILIDADE;
  protected readonly notaRisco = NOTA_RISCO;

  protected readonly codigo = this.route.snapshot.paramMap.get('codigo') ?? '';

  protected readonly periodoSelecionado = signal('1A');
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly detalhe = signal<AcaoDetalhe | null>(null);

  protected readonly carregandoIA = signal(true);
  protected readonly sugestaoIA = signal<SugestaoAtivoItem | null>(null);

  protected readonly favoritado = signal(false);

  ngOnInit(): void {
    this.carregarDetalhe();
    this.carregarAnaliseIA();
  }

  protected selecionarPeriodo(periodo: string): void {
    if (this.periodoSelecionado() === periodo) return;
    this.periodoSelecionado.set(periodo);
    this.carregarDetalhe();
  }

  protected carregarDetalhe(): void {
    this.carregando.set(true);
    this.erro.set(false);

    this.acaoService.obterDetalhe(this.codigo, this.periodoSelecionado()).subscribe({
      next: (resposta) => {
        this.detalhe.set(resposta);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set(true);
      },
    });
  }

  private carregarAnaliseIA(): void {
    this.carregandoIA.set(true);

    this.acaoService.obterSugestao(this.codigo).subscribe({
      next: (resposta) => {
        this.sugestaoIA.set(resposta);
        this.carregandoIA.set(false);
      },
      error: () => {
        this.carregandoIA.set(false);
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
    this.router.navigate(['/comparacao'], { queryParams: { ativo: this.codigo } });
  }
}
