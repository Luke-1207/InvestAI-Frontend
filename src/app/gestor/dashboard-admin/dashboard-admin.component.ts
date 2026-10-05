import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, timer } from 'rxjs';
import { DashboardAdminService } from '../../shared/services/dashboard-admin.service';
import {
  CategoriaAtivoAdmin,
  DashboardAdminResponse,
  NivelUrgencia,
  PerfilRiscoChave,
  StatusIa,
  TituloVencendo,
} from '../../shared/models/dashboard-admin';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { DonutChartComponent, SegmentoDonut } from '../../shared/components/ui/donut-chart/donut-chart.component';

export const INTERVALO_STATUS_IA_MS = 30_000;

const RISCOS: { chave: PerfilRiscoChave; rotulo: string; cor: string }[] = [
  { chave: 'CONSERVADOR', rotulo: 'Conservador', cor: 'var(--success-strong)' },
  { chave: 'MODERADO', rotulo: 'Moderado', cor: 'var(--accent-strong)' },
  { chave: 'ARROJADO', rotulo: 'Arrojado', cor: 'var(--warning)' },
];

const CATEGORIAS: { chave: CategoriaAtivoAdmin; rotulo: string; grupo: 'rv' | 'rf' }[] = [
  { chave: 'ACAO', rotulo: 'Ações', grupo: 'rv' },
  { chave: 'FII', rotulo: 'FIIs', grupo: 'rv' },
  { chave: 'ETF', rotulo: 'ETFs', grupo: 'rv' },
  { chave: 'TESOURO', rotulo: 'Tesouro Direto', grupo: 'rf' },
  { chave: 'CDB', rotulo: 'CDBs', grupo: 'rf' },
  { chave: 'LCI', rotulo: 'LCIs', grupo: 'rf' },
  { chave: 'LCA', rotulo: 'LCAs', grupo: 'rf' },
];

const ROTULO_URGENCIA: Record<NivelUrgencia, string> = {
  ALTA: 'Urgente',
  MEDIA: 'Atenção',
  BAIXA: 'No prazo',
};

interface CategoriaContagem {
  rotulo: string;
  grupo: 'rv' | 'rf';
  quantidade: number;
  larguraBarra: number;
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [DatePipe, SpinnerComponent, ErroServidorComponent, DonutChartComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.scss',
})
export class DashboardAdminComponent implements OnInit {
  private readonly dashboardAdminService = inject(DashboardAdminService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly metricas = signal<DashboardAdminResponse | null>(null);
  protected readonly statusIa = signal<StatusIa | null>(null);

  protected readonly rotuloUrgencia = ROTULO_URGENCIA;

  protected readonly variacaoUsuarios = computed<number | null>(() => {
    const dados = this.metricas();
    if (!dados) return null;
    const base = dados.totalUsuarios - dados.novosUsuariosUltimos30Dias;
    if (base <= 0) return null;
    return (dados.novosUsuariosUltimos30Dias / base) * 100;
  });

  protected readonly percentualPerfis = computed(() => {
    const dados = this.metricas();
    if (!dados || dados.totalUsuarios === 0) return 0;
    return Math.round((dados.usuariosComPerfilPreenchido / dados.totalUsuarios) * 100);
  });

  protected readonly segmentosRisco = computed<SegmentoDonut[]>(() => {
    const distribuicao = this.metricas()?.distribuicaoRisco;
    if (!distribuicao) return [];
    return RISCOS.map((risco) => ({
      rotulo: risco.rotulo,
      valor: distribuicao[risco.chave] ?? 0,
      cor: risco.cor,
    }));
  });

  protected readonly possuiPerfis = computed(() => this.segmentosRisco().some((s) => s.valor > 0));

  protected readonly categorias = computed<CategoriaContagem[]>(() => {
    const distribuicao = this.metricas()?.distribuicaoAtivosPorCategoria;
    if (!distribuicao) return [];
    const maximo = Math.max(1, ...CATEGORIAS.map((c) => distribuicao[c.chave] ?? 0));
    return CATEGORIAS.map((categoria) => {
      const quantidade = distribuicao[categoria.chave] ?? 0;
      return {
        rotulo: categoria.rotulo,
        grupo: categoria.grupo,
        quantidade,
        larguraBarra: (quantidade / maximo) * 100,
      };
    });
  });

  protected readonly totalAtivos = computed(() =>
    this.categorias().reduce((soma, categoria) => soma + categoria.quantidade, 0),
  );

  ngOnInit(): void {
    this.carregarMetricas();
    this.acompanharStatusIa();
  }

  protected carregarMetricas(): void {
    this.carregando.set(true);
    this.erro.set(false);

    this.dashboardAdminService.obterMetricas().subscribe({
      next: (dados) => {
        this.metricas.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set(true);
      },
    });
  }

  protected formatarNumero(valor: number): string {
    return valor.toLocaleString('pt-BR');
  }

  protected formatarVariacao(valor: number): string {
    return valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  }

  protected textoPrazo(titulo: TituloVencendo): string {
    if (titulo.diasParaVencimento <= 0) return 'Vence hoje';
    if (titulo.diasParaVencimento === 1) return 'Vence amanhã';
    return `Vence em ${titulo.diasParaVencimento} dias`;
  }

  private acompanharStatusIa(): void {
    timer(0, INTERVALO_STATUS_IA_MS)
      .pipe(
        switchMap(() =>
          this.dashboardAdminService.obterStatusIa().pipe(
            catchError(() =>
              of<StatusIa>({
                disponivel: false,
                rabbitmqConectado: null,
                verificadoEm: new Date().toISOString(),
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((status) => this.statusIa.set(status));
  }
}
