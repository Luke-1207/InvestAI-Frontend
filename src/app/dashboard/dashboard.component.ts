import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../shared/services/dashboard.service';
import { SpinnerComponent } from '../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../shared/components/erro-servidor/erro-servidor.component';
import { DonutChartComponent, SegmentoDonut } from '../shared/components/ui/donut-chart/donut-chart.component';
import { CORES_COMPATIBILIDADE } from '../shared/models/compatibilidade';
import { SugestaoAtivoItem } from '../shared/models/dashboard';

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
  imports: [CommonModule, RouterLink, SpinnerComponent, ErroServidorComponent, DonutChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  protected readonly dashboardService = inject(DashboardService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  protected readonly corCompatibilidade = CORES_COMPATIBILIDADE;
  protected readonly tresEtapas = [0, 1, 2];

  protected readonly dicaDoDia = computed<SugestaoAtivoItem | null>(() => {
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

  protected indiceRisco(valor: string): number {
    return ORDEM_RISCO.indexOf(valor);
  }

  protected indiceHorizonte(valor: string): number {
    return ORDEM_HORIZONTE.indexOf(valor);
  }
}
