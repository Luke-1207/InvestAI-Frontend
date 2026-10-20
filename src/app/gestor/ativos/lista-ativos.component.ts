import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GestaoCatalogoService } from '../../shared/services/gestao-catalogo.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  AtivoGestao,
  FiltroStatus,
  passaNoFiltroStatus,
  textoPesquisavel,
} from '../../shared/models/gestao-catalogo';
import { TipoAtivo } from '../../shared/models/acao';
import { RotuloPipe } from '../../shared/pipes/rotulo.pipe';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { FiltrosGestaoComponent } from '../filtros-gestao/filtros-gestao.component';
import { DialogoConfirmacaoComponent } from '../../shared/components/ui/dialogo-confirmacao/dialogo-confirmacao.component';
import { mensagemDoErro } from '../../shared/utils/erro-api.util';

type FiltroTipo = 'TODOS' | TipoAtivo;

@Component({
  selector: 'app-lista-ativos',
  standalone: true,
  imports: [RouterLink, RotuloPipe, SpinnerComponent, ErroServidorComponent, DialogoConfirmacaoComponent, FiltrosGestaoComponent],
  templateUrl: './lista-ativos.component.html',
  styleUrl: './lista-ativos.component.scss',
})
export class ListaAtivosComponent implements OnInit {
  @ViewChild(DialogoConfirmacaoComponent) private dialogo?: DialogoConfirmacaoComponent;

  private readonly gestaoCatalogoService = inject(GestaoCatalogoService);
  private readonly toastService = inject(ToastService);

  protected readonly opcoesTipo: { valor: FiltroTipo; rotulo: string }[] = [
    { valor: 'TODOS', rotulo: 'Todos' },
    { valor: 'ACAO', rotulo: 'Ações' },
    { valor: 'FII', rotulo: 'FIIs' },
    { valor: 'ETF', rotulo: 'ETFs' },
  ];

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly ativos = signal<AtivoGestao[]>([]);
  protected readonly termo = signal('');
  protected readonly filtroTipo = signal<FiltroTipo>('TODOS');
  protected readonly filtroStatus = signal<FiltroStatus>('TODOS');
  protected readonly paraDesativar = signal<AtivoGestao | null>(null);
  protected readonly desativando = signal(false);
  protected readonly reativandoId = signal<string | null>(null);

  protected readonly filtrados = computed(() => {
    const termo = textoPesquisavel(this.termo().trim());
    return this.ativos().filter(
      (ativo) =>
        (this.filtroTipo() === 'TODOS' || ativo.tipo === this.filtroTipo()) &&
        passaNoFiltroStatus(ativo.ativo, this.filtroStatus()) &&
        (!termo || textoPesquisavel(ativo.codigo, ativo.nome, ativo.setor).includes(termo)),
    );
  });

  protected readonly temFiltro = computed(
    () => !!this.termo().trim() || this.filtroTipo() !== 'TODOS' || this.filtroStatus() !== 'TODOS',
  );

  protected readonly contagem = computed(() => {
    const total = this.filtrados().length;
    return total === 1 ? '1 ativo' : `${total} ativos`;
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.gestaoCatalogoService.listarAtivos().subscribe({
      next: (ativos) => {
        this.ativos.set(ativos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  protected limparFiltros(): void {
    this.termo.set('');
    this.filtroTipo.set('TODOS');
    this.filtroStatus.set('TODOS');
  }

  protected pedirDesativacao(ativo: AtivoGestao): void {
    this.paraDesativar.set(ativo);
    this.dialogo?.abrir();
  }

  protected confirmarDesativacao(): void {
    const ativo = this.paraDesativar();
    if (!ativo) return;
    this.desativando.set(true);
    this.gestaoCatalogoService.desativarAtivo(ativo.id).subscribe({
      next: () => {
        this.substituir({ ...ativo, ativo: false });
        this.desativando.set(false);
        this.dialogo?.fechar();
        this.toastService.sucesso(`${ativo.codigo} foi desativado e não aparece mais para os investidores.`);
      },
      error: (erro) => {
        this.desativando.set(false);
        this.toastService.erro(mensagemDoErro(erro, `Não foi possível desativar ${ativo.codigo}. Tente de novo.`));
      },
    });
  }

  protected reativar(ativo: AtivoGestao): void {
    this.reativandoId.set(ativo.id);
    this.gestaoCatalogoService
      .atualizarAtivo(ativo.id, { nome: ativo.nome, tipo: ativo.tipo, setor: ativo.setor, ativo: true })
      .subscribe({
        next: (atualizado) => {
          this.substituir(atualizado);
          this.reativandoId.set(null);
          this.toastService.sucesso(`${ativo.codigo} foi reativado.`);
        },
        error: (erro) => {
          this.reativandoId.set(null);
          this.toastService.erro(mensagemDoErro(erro, `Não foi possível reativar ${ativo.codigo}. Tente de novo.`));
        },
      });
  }

  private substituir(atualizado: AtivoGestao): void {
    this.ativos.update((ativos) => ativos.map((a) => (a.id === atualizado.id ? atualizado : a)));
  }
}
