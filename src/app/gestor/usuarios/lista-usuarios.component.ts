import { Component, ViewChild, computed, inject, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { GestaoUsuariosService } from '../../shared/services/gestao-usuarios.service';
import { AuthService } from '../../shared/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { FiltroStatus } from '../../shared/models/gestao-catalogo';
import { PageResponse } from '../../shared/models/acao';
import { PapelUsuario, ROTULO_PAPEL, UsuarioGestao } from '../../shared/models/gestao-usuarios';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { DialogoConfirmacaoComponent } from '../../shared/components/ui/dialogo-confirmacao/dialogo-confirmacao.component';
import { TabelaGestaoComponent } from '../tabela-gestao/tabela-gestao.component';
import { FiltrosGestaoComponent, OpcaoFiltro } from '../filtros-gestao/filtros-gestao.component';
import { mensagemDoErro } from '../../shared/utils/erro-api.util';

export const ATRASO_BUSCA_USUARIOS_MS = 300;

type AcaoUsuario = 'promover' | 'rebaixar' | 'desativar';

interface AcaoPendente {
  tipo: AcaoUsuario;
  usuario: UsuarioGestao;
}

const TEXTOS_ACAO: Record<AcaoUsuario, { titulo: (nome: string) => string; confirmar: string; perigoso: boolean }> = {
  promover: { titulo: (nome) => `Promover ${nome} a gestor?`, confirmar: 'Promover', perigoso: false },
  rebaixar: { titulo: (nome) => `Tirar o acesso de gestor de ${nome}?`, confirmar: 'Tirar acesso', perigoso: true },
  desativar: { titulo: (nome) => `Desativar a conta de ${nome}?`, confirmar: 'Desativar', perigoso: true },
};

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [DatePipe, RouterLink, SpinnerComponent, ErroServidorComponent, DialogoConfirmacaoComponent, FiltrosGestaoComponent, TabelaGestaoComponent],
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.scss',
})
export class ListaUsuariosComponent {
  @ViewChild(DialogoConfirmacaoComponent) private dialogo?: DialogoConfirmacaoComponent;

  private readonly gestaoUsuariosService = inject(GestaoUsuariosService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  protected readonly rotuloPapel = ROTULO_PAPEL;
  protected readonly opcoesPapel: OpcaoFiltro[] = [
    { valor: 'TODOS', rotulo: 'Todos' },
    { valor: 'USUARIO', rotulo: 'Investidores' },
    { valor: 'GESTOR', rotulo: 'Gestores' },
  ];

  protected readonly termo = signal('');
  protected readonly filtroPapel = signal('TODOS');
  protected readonly filtroStatus = signal<FiltroStatus>('TODOS');
  private readonly tentativa = signal(0);

  private readonly termoAtrasado = toSignal(
    toObservable(this.termo).pipe(
      debounceTime(ATRASO_BUSCA_USUARIOS_MS),
      map((termo) => termo.trim()),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  protected readonly pagina = linkedSignal({
    source: () => [this.termoAtrasado(), this.filtroPapel(), this.filtroStatus()],
    computation: () => 0,
  });

  private readonly consulta = computed(() => ({
    busca: this.termoAtrasado(),
    role: this.filtroPapel() === 'TODOS' ? null : (this.filtroPapel() as PapelUsuario),
    ativo: this.filtroStatus() === 'TODOS' ? null : this.filtroStatus() === 'ATIVOS',
    pagina: this.pagina(),
    tentativa: this.tentativa(),
  }));

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly resultado = signal<PageResponse<UsuarioGestao> | null>(null);
  protected readonly pendente = signal<AcaoPendente | null>(null);
  protected readonly processando = signal(false);
  protected readonly ativandoId = signal<string | null>(null);

  protected readonly usuarios = computed(() => this.resultado()?.content ?? []);
  protected readonly totalPaginas = computed(() => Math.max(this.resultado()?.totalPages ?? 1, 1));
  protected readonly temFiltro = computed(
    () => !!this.termo().trim() || this.filtroPapel() !== 'TODOS' || this.filtroStatus() !== 'TODOS',
  );
  protected readonly contagem = computed(() => {
    const total = this.resultado()?.totalElements ?? 0;
    return total === 1 ? '1 usuário' : `${total} usuários`;
  });
  protected readonly textosDialogo = computed(() => {
    const acao = this.pendente();
    if (!acao) return { titulo: '', confirmar: 'Confirmar', perigoso: false };
    const textos = TEXTOS_ACAO[acao.tipo];
    return { titulo: textos.titulo(acao.usuario.nome), confirmar: textos.confirmar, perigoso: textos.perigoso };
  });

  constructor() {
    toObservable(this.consulta)
      .pipe(
        tap(() => {
          this.carregando.set(true);
          this.erro.set(false);
        }),
        switchMap(({ tentativa, ...filtro }) =>
          this.gestaoUsuariosService.listar(filtro).pipe(
            map((pagina) => ({ pagina, falhou: false })),
            catchError(() => of({ pagina: null, falhou: true })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ pagina, falhou }) => {
        this.carregando.set(false);
        this.erro.set(falhou);
        if (pagina) this.resultado.set(pagina);
      });
  }

  protected souEu(usuario: UsuarioGestao): boolean {
    return usuario.email.toLowerCase() === (this.authService.email() ?? '').toLowerCase();
  }

  protected tentarDeNovo(): void {
    this.tentativa.update((n) => n + 1);
  }

  protected limparFiltros(): void {
    this.termo.set('');
    this.filtroPapel.set('TODOS');
    this.filtroStatus.set('TODOS');
  }

  protected irParaPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas()) return;
    this.pagina.set(pagina);
  }

  protected pedir(tipo: AcaoUsuario, usuario: UsuarioGestao): void {
    this.pendente.set({ tipo, usuario });
    this.dialogo?.abrir();
  }

  protected confirmar(): void {
    const acao = this.pendente();
    if (!acao) return;
    this.processando.set(true);
    const { usuario } = acao;
    const requisicao =
      acao.tipo === 'desativar'
        ? this.gestaoUsuariosService.alterarStatus(usuario.id, false)
        : this.gestaoUsuariosService.alterarPapel(usuario.id, acao.tipo === 'promover' ? 'GESTOR' : 'USUARIO');

    requisicao.subscribe({
      next: (atualizado) => {
        this.substituir(atualizado);
        this.processando.set(false);
        this.dialogo?.fechar();
        this.toastService.sucesso(this.mensagemSucesso(acao.tipo, usuario.nome));
      },
      error: (erro) => {
        this.processando.set(false);
        this.toastService.erro(mensagemDoErro(erro, 'Não foi possível concluir agora. Tente de novo.'));
      },
    });
  }

  protected ativar(usuario: UsuarioGestao): void {
    this.ativandoId.set(usuario.id);
    this.gestaoUsuariosService.alterarStatus(usuario.id, true).subscribe({
      next: (atualizado) => {
        this.substituir(atualizado);
        this.ativandoId.set(null);
        this.toastService.sucesso(`A conta de ${usuario.nome} foi ativada.`);
      },
      error: (erro) => {
        this.ativandoId.set(null);
        this.toastService.erro(mensagemDoErro(erro, 'Não foi possível ativar a conta. Tente de novo.'));
      },
    });
  }

  private mensagemSucesso(tipo: AcaoUsuario, nome: string): string {
    if (tipo === 'promover') return `${nome} agora é gestor.`;
    if (tipo === 'rebaixar') return `${nome} voltou a ser investidor.`;
    return `A conta de ${nome} foi desativada.`;
  }

  private substituir(atualizado: UsuarioGestao): void {
    this.resultado.update((pagina) =>
      pagina ? { ...pagina, content: pagina.content.map((u) => (u.id === atualizado.id ? atualizado : u)) } : pagina,
    );
  }
}
