import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../shared/services/dashboard.service';
import { SpinnerComponent } from '../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../shared/components/erro-servidor/erro-servidor.component';
import { DonutChartComponent, SegmentoDonut } from '../shared/components/ui/donut-chart/donut-chart.component';
import { CORES_COMPATIBILIDADE } from '../shared/models/compatibilidade';
import { SugestaoAtivoItem, SugestaoRendaFixaItem } from '../shared/models/dashboard';
import { CartaoSugestaoAtivoComponent } from '../shared/components/cartao-sugestao-ativo/cartao-sugestao-ativo.component';
import { RotuloPipe } from '../shared/pipes/rotulo.pipe';
import { AvisoEducativoComponent } from '../shared/components/aviso-educativo/aviso-educativo.component';
import { AjudaGlossarioComponent } from '../shared/components/ajuda-glossario/ajuda-glossario.component';
import { DicaDoDiaComponent } from './dica-do-dia/dica-do-dia.component';

const ORDEM_RISCO = ['CONSERVADOR', 'MODERADO', 'ARROJADO'];
const ORDEM_HORIZONTE = ['CURTO_PRAZO', 'MEDIO_PRAZO', 'LONGO_PRAZO'];

const ALOCACAO_POR_RISCO: Record<string, { rv: number; rf: number }> = {
  CONSERVADOR: { rv: 30, rf: 70 },
  MODERADO: { rv: 50, rf: 50 },
  ARROJADO: { rv: 70, rf: 30 },
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RotuloPipe,
    AjudaGlossarioComponent,
    AvisoEducativoComponent,
    CommonModule,
    RouterLink,
    SpinnerComponent,
    ErroServidorComponent,
    DonutChartComponent,
    CartaoSugestaoAtivoComponent,
    DicaDoDiaComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  protected readonly dashboardService = inject(DashboardService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  protected readonly corCompatibilidade = CORES_COMPATIBILIDADE;
  protected readonly tresEtapas = [0, 1, 2];

  protected readonly ativoEmDestaque = computed<SugestaoAtivoItem | null>(() => {
    const itens = this.dashboardService.dashboard()?.sugestoesRendaVariavel.itens ?? [];
    if (itens.length === 0) return null;
    return itens.reduce((melhor, atual) => (atual.score > melhor.score ? atual : melhor));
  });

  protected readonly segmentosAlocacao = computed<SegmentoDonut[]>(() => {
    const perfil = this.dashboardService.dashboard()?.perfil;
    if (!perfil?.perfilPreenchido) return [];

    const alocacao = ALOCACAO_POR_RISCO[perfil.perfilRisco.valor] ?? { rv: 50, rf: 50 };
    return [
      { rotulo: 'Renda Variável', valor: alocacao.rv, cor: 'var(--accent)' },
      { rotulo: 'Renda Fixa', valor: alocacao.rf, cor: 'var(--success-strong)' },
    ];
  });

  ngOnInit(): void {
    this.carregarDashboard();
  }

  protected carregarDashboard(): void {
    this.carregando.set(true);
    this.erro.set(false);

    this.dashboardService.carregar().subscribe({
      next: () => this.carregando.set(false),
      error: () => {
        this.carregando.set(false);
        this.erro.set(true);
      },
    });
  }

  protected rotaTitulo(item: SugestaoRendaFixaItem): string[] {
    return ['/renda-fixa', item.codigo ?? item.id];
  }

  protected indiceRisco(valor: string): number {
    return ORDEM_RISCO.indexOf(valor);
  }

  protected indiceHorizonte(valor: string): number {
    return ORDEM_HORIZONTE.indexOf(valor);
  }
}
