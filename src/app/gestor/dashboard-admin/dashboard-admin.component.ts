import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, startWith, switchMap, timer } from 'rxjs';
import { DashboardAdminService } from '../../shared/services/dashboard-admin.service';
import {
  CategoriaAtivoAdmin,
  DashboardAdminResponse,
  NivelUrgencia,
  PerfilRiscoChave,
  ChaveIntegracao,
  SaudeIntegracoes,
  TituloVencendo,
  integracaoComProblema,
} from '../../shared/models/dashboard-admin';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { DonutChartComponent, SegmentoDonut } from '../../shared/components/ui/donut-chart/donut-chart.component';
import { SaudeIntegracoesComponent } from './saude-integracoes/saude-integracoes.component';

export const INTERVALO_INTEGRACOES_MS = 5 * 60_000;

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
  imports: [DatePipe, SpinnerComponent, ErroServidorComponent, DonutChartComponent, SaudeIntegracoesComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.scss',
})
export class DashboardAdminComponent implements OnInit {
  private readonly dashboardAdminService = inject(DashboardAdminService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly metricas = signal<DashboardAdminResponse | null>(null);
  protected readonly saudeIntegracoes = signal<SaudeIntegracoes | null>(null);
  protected readonly falhaIntegracoes = signal(false);
  protected readonly intervaloIntegracoesSegundos = INTERVALO_INTEGRACOES_MS / 1000;
  protected readonly verificandoTodas = signal(false);
  protected readonly verificandoIntegracoes = signal<ReadonlySet<ChaveIntegracao>>(new Set());
  protected readonly avisoVerificacao = signal<string | null>(null);
  private readonly reiniciarAcompanhamento = new Subject<void>();

  protected readonly resumoIntegracoes = computed(() => {
    const integracoes = this.saudeIntegracoes()?.integracoes ?? [];
    const comProblema = integracoes.filter(integracaoComProblema);
    return {
      total: integracoes.length,
      comProblema: comProblema.length,
      foraDoAr: comProblema.some((i) => i.situacao === 'FORA_DO_AR'),
      simuladas: integracoes.filter((i) => i.simulado).length,
    };
  });

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
    this.acompanharIntegracoes();
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

  protected irParaIntegracoes(evento: Event): void {
    evento.preventDefault();
    const secao = document.getElementById('saude-integracoes');
    secao?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    secao?.focus({ preventScroll: true });
  }

  protected verificarTodasIntegracoes(): void {
    if (this.verificandoTodas()) return;
    this.verificandoTodas.set(true);
    this.avisoVerificacao.set(null);

    this.dashboardAdminService
      .verificarIntegracoes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saude) => {
          this.verificandoTodas.set(false);
          this.falhaIntegracoes.set(false);
          this.saudeIntegracoes.set(saude);
          this.reiniciarAcompanhamento.next();
        },
        error: () => {
          this.verificandoTodas.set(false);
          this.avisoVerificacao.set('Não conseguimos verificar as integrações agora. Tente de novo em instantes.');
        },
      });
  }

  protected verificarIntegracao(chave: ChaveIntegracao): void {
    if (this.verificandoTodas() || this.verificandoIntegracoes().has(chave)) return;
    this.alterarVerificando(chave, true);
    this.avisoVerificacao.set(null);

    this.dashboardAdminService
      .verificarIntegracao(chave)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (atualizada) => {
          this.alterarVerificando(chave, false);
          this.saudeIntegracoes.update(
            (saude) =>
              saude && { ...saude, integracoes: saude.integracoes.map((i) => (i.chave === chave ? atualizada : i)) },
          );
        },
        error: () => {
          this.alterarVerificando(chave, false);
          const nome = this.saudeIntegracoes()?.integracoes.find((i) => i.chave === chave)?.nome ?? 'a integração';
          this.avisoVerificacao.set(`Não conseguimos verificar ${nome} agora. Tente de novo em instantes.`);
        },
      });
  }

  private alterarVerificando(chave: ChaveIntegracao, verificando: boolean): void {
    this.verificandoIntegracoes.update((atuais) => {
      const proximas = new Set(atuais);
      if (verificando) proximas.add(chave);
      else proximas.delete(chave);
      return proximas;
    });
  }

  private acompanharIntegracoes(): void {
    this.reiniciarAcompanhamento
      .pipe(
        map(() => INTERVALO_INTEGRACOES_MS),
        startWith(0),
        switchMap((espera) => timer(espera, INTERVALO_INTEGRACOES_MS)),
        switchMap(() =>
          this.dashboardAdminService.obterIntegracoes().pipe(
            map((saude): SaudeIntegracoes | null => saude),
            catchError(() => of(null)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((saude) => {
        this.falhaIntegracoes.set(saude === null);
        if (saude) this.saudeIntegracoes.set(saude);
      });
  }
}
