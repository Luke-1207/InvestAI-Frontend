import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificacaoService } from '../shared/services/notificacao.service';
import { ToastService } from '../shared/services/toast.service';
import { Notificacao, TipoNotificacao } from '../shared/models/notificacao';
import { rotaDoAtivo } from '../shared/models/favorito';
import { SpinnerComponent } from '../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../shared/components/erro-servidor/erro-servidor.component';
import { EstadoErroComponent } from '../shared/components/ui/estado-erro/estado-erro.component';
import { tempoRelativo } from '../shared/utils/tempo-relativo.util';
import { mensagemDoErro } from '../shared/utils/erro-api.util';

export const TAMANHO_PAGINA_NOTIFICACOES = 20;

type Filtro = 'todas' | 'nao-lidas';

const ICONES: Record<TipoNotificacao, string> = {
  VARIACAO_ALTA: 'trending_up',
  VARIACAO_BAIXA: 'trending_down',
  DY_ALTO: 'payments',
  PRECO_MINIMO_52S: 'south',
  TITULO_VENCENDO: 'event',
  PERFIL_ALTERADO: 'person',
  SISTEMA: 'campaign',
};

@Component({
  selector: 'app-notificacoes',
  standalone: true,
  imports: [SpinnerComponent, ErroServidorComponent, EstadoErroComponent],
  templateUrl: './notificacoes.component.html',
  styleUrl: './notificacoes.component.scss',
})
export class NotificacoesComponent implements OnInit {
  protected readonly notificacaoService = inject(NotificacaoService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly tempoRelativo = tempoRelativo;

  protected readonly filtro = signal<Filtro>('todas');
  protected readonly carregando = signal(true);
  protected readonly carregandoMais = signal(false);
  protected readonly erro = signal(false);
  protected readonly erroAoCarregarMais = signal(false);
  protected readonly marcandoTodas = signal(false);
  protected readonly notificacoes = signal<Notificacao[]>([]);
  protected readonly total = signal(0);

  private paginaAtual = 0;

  protected readonly temMais = computed(() => this.notificacoes().length < this.total());

  ngOnInit(): void {
    this.carregar();
  }

  protected selecionarFiltro(filtro: Filtro): void {
    if (this.filtro() === filtro) return;
    this.filtro.set(filtro);
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.paginaAtual = 0;

    this.notificacaoService.listar(0, TAMANHO_PAGINA_NOTIFICACOES, this.filtroLida()).subscribe({
      next: (pagina) => {
        this.notificacoes.set(pagina.content);
        this.total.set(pagina.totalElements);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set(true);
      },
    });
    this.notificacaoService.contarNaoLidas().subscribe({ error: () => undefined });
  }

  protected carregarMais(): void {
    if (this.carregandoMais() || !this.temMais()) return;
    this.carregandoMais.set(true);
    this.erroAoCarregarMais.set(false);

    this.notificacaoService.listar(this.paginaAtual + 1, TAMANHO_PAGINA_NOTIFICACOES, this.filtroLida()).subscribe({
      next: (pagina) => {
        this.paginaAtual += 1;
        this.notificacoes.update((atual) => [...atual, ...pagina.content.filter((n) => !atual.some((a) => a.id === n.id))]);
        this.total.set(pagina.totalElements);
        this.carregandoMais.set(false);
      },
      error: () => {
        this.carregandoMais.set(false);
        this.erroAoCarregarMais.set(true);
      },
    });
  }

  protected abrir(notificacao: Notificacao): void {
    const rota = notificacao.tipoAtivo
      ? rotaDoAtivo(notificacao.tipoAtivo, notificacao.codigoAtivo, notificacao.ativoId)
      : notificacao.tipo === 'PERFIL_ALTERADO'
        ? ['/perfil']
        : null;

    if (!notificacao.lida) {
      this.notificacaoService.marcarComoLida(notificacao.id).subscribe({
        next: (atualizada) => this.substituir(atualizada),
        error: () => undefined,
      });
    }
    if (rota) this.router.navigate(rota);
  }

  protected marcarTodas(): void {
    if (this.marcandoTodas()) return;
    this.marcandoTodas.set(true);
    this.notificacaoService.marcarTodasComoLidas().subscribe({
      next: () => {
        this.marcandoTodas.set(false);
        if (this.filtro() === 'nao-lidas') {
          this.notificacoes.set([]);
          this.total.set(0);
        } else {
          this.notificacoes.update((lista) => lista.map((n) => ({ ...n, lida: true })));
        }
      },
      error: (erro) => {
        this.marcandoTodas.set(false);
        this.toastService.erro(mensagemDoErro(erro, 'Não foi possível marcar as notificações como lidas.'));
      },
    });
  }

  protected icone(tipo: TipoNotificacao): string {
    return ICONES[tipo] ?? 'notifications';
  }

  protected temDestino(notificacao: Notificacao): boolean {
    return !!notificacao.tipoAtivo || notificacao.tipo === 'PERFIL_ALTERADO';
  }

  private filtroLida(): boolean | undefined {
    return this.filtro() === 'nao-lidas' ? false : undefined;
  }

  private substituir(atualizada: Notificacao): void {
    this.notificacoes.update((lista) =>
      lista.map((n) => (n.id === atualizada.id ? { ...n, lida: true, lidaEm: atualizada.lidaEm } : n)),
    );
  }
}
