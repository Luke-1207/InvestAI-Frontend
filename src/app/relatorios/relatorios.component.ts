import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { RelatorioService } from '../shared/services/relatorio.service';
import { HistoricoRelatorio, TipoRelatorio } from '../shared/models/relatorio';
import { SpinnerComponent } from '../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../shared/components/erro-servidor/erro-servidor.component';
import { EstadoErroComponent } from '../shared/components/ui/estado-erro/estado-erro.component';

export const TAMANHO_PAGINA_HISTORICO = 20;

const TIPOS: Record<TipoRelatorio, { rotulo: string; icone: string }> = {
  ATIVO_INDIVIDUAL: { rotulo: 'Análise de ativo', icone: 'query_stats' },
  LISTAGEM: { rotulo: 'Listagem ranqueada', icone: 'format_list_numbered' },
  PERFIL: { rotulo: 'Perfil do investidor', icone: 'person' },
};

const REFERENCIAS: Record<string, string> = {
  LISTAGEM_VARIAVEL: 'Renda Variável',
  LISTAGEM_FIXA: 'Renda Fixa',
  LISTAGEM_AMBOS: 'Renda Variável e Renda Fixa',
  PERFIL: 'Seu perfil de investidor',
};

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [DatePipe, SpinnerComponent, ErroServidorComponent, EstadoErroComponent],
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.scss',
})
export class RelatoriosComponent implements OnInit {
  private readonly relatorioService = inject(RelatorioService);
  private readonly router = inject(Router);

  protected readonly carregando = signal(true);
  protected readonly carregandoMais = signal(false);
  protected readonly erro = signal(false);
  protected readonly erroAoCarregarMais = signal(false);
  protected readonly registros = signal<HistoricoRelatorio[]>([]);
  protected readonly total = signal(0);

  private paginaAtual = 0;

  protected readonly temMais = computed(() => this.registros().length < this.total());

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.paginaAtual = 0;

    this.relatorioService.listarHistorico(0, TAMANHO_PAGINA_HISTORICO).subscribe({
      next: (pagina) => {
        this.registros.set(pagina.content);
        this.total.set(pagina.totalElements);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set(true);
      },
    });
  }

  protected carregarMais(): void {
    if (this.carregandoMais() || !this.temMais()) return;
    this.carregandoMais.set(true);
    this.erroAoCarregarMais.set(false);

    this.relatorioService.listarHistorico(this.paginaAtual + 1, TAMANHO_PAGINA_HISTORICO).subscribe({
      next: (pagina) => {
        this.paginaAtual += 1;
        this.registros.update((atual) => [...atual, ...pagina.content]);
        this.total.set(pagina.totalElements);
        this.carregandoMais.set(false);
      },
      error: () => {
        this.carregandoMais.set(false);
        this.erroAoCarregarMais.set(true);
      },
    });
  }

  protected rotuloTipo(tipo: TipoRelatorio): string {
    return TIPOS[tipo]?.rotulo ?? tipo;
  }

  protected iconeTipo(tipo: TipoRelatorio): string {
    return TIPOS[tipo]?.icone ?? 'description';
  }

  protected rotuloReferencia(referencia: string): string {
    return REFERENCIAS[referencia] ?? referencia;
  }

  protected irParaRendaVariavel(): void {
    this.router.navigateByUrl('/renda-variavel');
  }
}
