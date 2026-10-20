import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GestaoCatalogoService } from '../../shared/services/gestao-catalogo.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  FiltroStatus,
  TipoTituloPrivado,
  TituloGestao,
  passaNoFiltroStatus,
  textoPesquisavel,
} from '../../shared/models/gestao-catalogo';
import { RotuloPipe } from '../../shared/pipes/rotulo.pipe';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { FiltrosGestaoComponent } from '../filtros-gestao/filtros-gestao.component';
import { DialogoConfirmacaoComponent } from '../../shared/components/ui/dialogo-confirmacao/dialogo-confirmacao.component';
import { formatarData, formatarMoeda, formatarTaxaComIndexador } from '../../shared/utils/formatacao.util';
import { mensagemDoErro } from '../../shared/utils/erro-api.util';
import { hojeIso } from '../validacoes-gestao';

type FiltroTipo = 'TODOS' | TipoTituloPrivado;

export function nomeDoTitulo(titulo: Pick<TituloGestao, 'tipo' | 'emissor'>): string {
  return `${titulo.tipo} ${titulo.emissor}`;
}

@Component({
  selector: 'app-lista-titulos',
  standalone: true,
  imports: [RouterLink, RotuloPipe, SpinnerComponent, ErroServidorComponent, DialogoConfirmacaoComponent, FiltrosGestaoComponent],
  templateUrl: './lista-titulos.component.html',
  styleUrl: './lista-titulos.component.scss',
})
export class ListaTitulosComponent implements OnInit {
  @ViewChild('dialogoDesativar') private dialogoDesativar?: DialogoConfirmacaoComponent;
  @ViewChild('dialogoRemover') private dialogoRemover?: DialogoConfirmacaoComponent;

  private readonly gestaoCatalogoService = inject(GestaoCatalogoService);
  private readonly toastService = inject(ToastService);

  protected readonly opcoesTipo: { valor: FiltroTipo; rotulo: string }[] = [
    { valor: 'TODOS', rotulo: 'Todos' },
    { valor: 'CDB', rotulo: 'CDBs' },
    { valor: 'LCI', rotulo: 'LCIs' },
    { valor: 'LCA', rotulo: 'LCAs' },
  ];
  protected readonly nome = nomeDoTitulo;
  protected readonly formatarData = formatarData;
  protected readonly formatarMoeda = formatarMoeda;
  protected readonly hoje = hojeIso();

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly titulos = signal<TituloGestao[]>([]);
  protected readonly termo = signal('');
  protected readonly filtroTipo = signal<FiltroTipo>('TODOS');
  protected readonly filtroStatus = signal<FiltroStatus>('TODOS');
  protected readonly selecionado = signal<TituloGestao | null>(null);
  protected readonly processando = signal(false);
  protected readonly ativandoId = signal<string | null>(null);

  protected readonly filtrados = computed(() => {
    const termo = textoPesquisavel(this.termo().trim());
    return this.titulos().filter(
      (titulo) =>
        (this.filtroTipo() === 'TODOS' || titulo.tipo === this.filtroTipo()) &&
        passaNoFiltroStatus(titulo.ativo, this.filtroStatus()) &&
        (!termo || textoPesquisavel(titulo.tipo, titulo.emissor, titulo.indexador).includes(termo)),
    );
  });

  protected readonly temFiltro = computed(
    () => !!this.termo().trim() || this.filtroTipo() !== 'TODOS' || this.filtroStatus() !== 'TODOS',
  );

  protected readonly contagem = computed(() => {
    const total = this.filtrados().length;
    return total === 1 ? '1 título' : `${total} títulos`;
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.gestaoCatalogoService.listarTitulos().subscribe({
      next: (titulos) => {
        this.titulos.set(titulos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  protected taxa(titulo: TituloGestao): string {
    return formatarTaxaComIndexador(titulo.indexador, titulo.taxaPercentual, titulo.indexador === 'IPCA');
  }

  protected vencido(titulo: TituloGestao): boolean {
    return titulo.vencimento <= this.hoje;
  }

  protected limparFiltros(): void {
    this.termo.set('');
    this.filtroTipo.set('TODOS');
    this.filtroStatus.set('TODOS');
  }

  protected pedirDesativacao(titulo: TituloGestao): void {
    this.selecionado.set(titulo);
    this.dialogoDesativar?.abrir();
  }

  protected pedirRemocao(titulo: TituloGestao): void {
    this.selecionado.set(titulo);
    this.dialogoRemover?.abrir();
  }

  protected confirmarDesativacao(): void {
    const titulo = this.selecionado();
    if (!titulo) return;
    this.processando.set(true);
    this.gestaoCatalogoService.alterarStatusTitulo(titulo.id, false).subscribe({
      next: (atualizado) => {
        this.substituir(atualizado);
        this.processando.set(false);
        this.dialogoDesativar?.fechar();
        this.toastService.sucesso(`${nomeDoTitulo(titulo)} foi desativado e não aparece mais para os investidores.`);
      },
      error: (erro) => {
        this.processando.set(false);
        this.toastService.erro(mensagemDoErro(erro, 'Não foi possível desativar o título. Tente de novo.'));
      },
    });
  }

  protected ativar(titulo: TituloGestao): void {
    this.ativandoId.set(titulo.id);
    this.gestaoCatalogoService.alterarStatusTitulo(titulo.id, true).subscribe({
      next: (atualizado) => {
        this.substituir(atualizado);
        this.ativandoId.set(null);
        this.toastService.sucesso(`${nomeDoTitulo(titulo)} foi ativado.`);
      },
      error: (erro) => {
        this.ativandoId.set(null);
        this.toastService.erro(mensagemDoErro(erro, 'Não foi possível ativar o título. Tente de novo.'));
      },
    });
  }

  protected confirmarRemocao(): void {
    const titulo = this.selecionado();
    if (!titulo) return;
    this.processando.set(true);
    this.gestaoCatalogoService.removerTitulo(titulo.id).subscribe({
      next: () => {
        this.titulos.update((titulos) => titulos.filter((t) => t.id !== titulo.id));
        this.processando.set(false);
        this.dialogoRemover?.fechar();
        this.toastService.sucesso(`${nomeDoTitulo(titulo)} foi removido.`);
      },
      error: (erro) => {
        this.processando.set(false);
        this.toastService.erro(mensagemDoErro(erro, 'Não foi possível remover o título. Tente de novo.'));
      },
    });
  }

  private substituir(atualizado: TituloGestao): void {
    this.titulos.update((titulos) => titulos.map((t) => (t.id === atualizado.id ? atualizado : t)));
  }
}
