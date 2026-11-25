import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FavoritoService } from '../shared/services/favorito.service';
import { ToastService } from '../shared/services/toast.service';
import { Favorito, LIMITE_FAVORITOS, TipoAlerta, TipoAtivoFavorito, rotaDoAtivo } from '../shared/models/favorito';
import { SpinnerComponent } from '../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../shared/components/erro-servidor/erro-servidor.component';
import { EstadoErroComponent } from '../shared/components/ui/estado-erro/estado-erro.component';
import { ButtonComponent } from '../shared/components/ui/button/button.component';
import { mensagemDoErro } from '../shared/utils/erro-api.util';

export const LIMIAR_MINIMO = 0.01;
export const LIMIAR_MAXIMO = 100;

const TIPOS_ATIVO: Record<TipoAtivoFavorito, { rotulo: string; icone: string }> = {
  ACAO_FII_ETF: { rotulo: 'Renda variável', icone: 'trending_up' },
  TITULO_TESOURO: { rotulo: 'Tesouro Direto', icone: 'account_balance' },
  TITULO_PRIVADO: { rotulo: 'Título privado', icone: 'savings' },
};

const ROTULOS_ALERTA: Record<TipoAlerta, string> = {
  VARIACAO_ALTA: 'Alta no dia',
  VARIACAO_BAIXA: 'Queda no dia',
  TITULO_VENCENDO: 'Vencimento em até 30 dias',
};

interface EdicaoAlertas {
  alertasAtivos: boolean;
  tipos: TipoAlerta[];
  limiar: number | null;
}

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [FormsModule, RouterLink, SpinnerComponent, ErroServidorComponent, EstadoErroComponent, ButtonComponent],
  templateUrl: './favoritos.component.html',
  styleUrl: './favoritos.component.scss',
})
export class FavoritosComponent implements OnInit {
  private readonly favoritoService = inject(FavoritoService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly LIMITE = LIMITE_FAVORITOS;
  protected readonly LIMIAR_MINIMO = LIMIAR_MINIMO;
  protected readonly LIMIAR_MAXIMO = LIMIAR_MAXIMO;
  protected readonly rotulosAlerta = ROTULOS_ALERTA;

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly favoritos = signal<Favorito[]>([]);
  protected readonly emEdicao = signal<string | null>(null);
  protected readonly edicao = signal<EdicaoAlertas>({ alertasAtivos: true, tipos: [], limiar: null });
  protected readonly salvando = signal(false);
  protected readonly removendo = signal<string | null>(null);

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.favoritoService.listar().subscribe({
      next: (favoritos) => {
        this.favoritos.set(favoritos);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set(true);
      },
    });
  }

  protected rotuloTipo(tipo: TipoAtivoFavorito): string {
    return TIPOS_ATIVO[tipo].rotulo;
  }

  protected iconeTipo(tipo: TipoAtivoFavorito): string {
    return TIPOS_ATIVO[tipo].icone;
  }

  protected rota(favorito: Favorito): string[] | null {
    return rotaDoAtivo(favorito.tipoAtivo, favorito.codigo, favorito.ativoId);
  }

  protected tiposAtivos(favorito: Favorito): TipoAlerta[] {
    return favorito.tiposAlertaAtivos ?? favorito.tiposAlertaDisponiveis;
  }

  protected resumoAlertas(favorito: Favorito): string {
    if (!favorito.alertasAtivos) return 'Alertas desligados';
    const tipos = this.tiposAtivos(favorito);
    if (tipos.length === 0) return 'Nenhum alerta escolhido';
    const nomes = tipos.map((tipo) => ROTULOS_ALERTA[tipo]).join(' e ');
    return favorito.tipoAtivo === 'ACAO_FII_ETF'
      ? `${nomes} a partir de ${this.formatarLimiar(favorito.limiarVariacao)}`
      : nomes;
  }

  protected formatarLimiar(valor: number): string {
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  }

  protected abrirAlertas(favorito: Favorito): void {
    if (this.emEdicao() === favorito.id) {
      this.emEdicao.set(null);
      return;
    }
    this.edicao.set({
      alertasAtivos: favorito.alertasAtivos,
      tipos: [...this.tiposAtivos(favorito)],
      limiar: favorito.limiarVariacao,
    });
    this.emEdicao.set(favorito.id);
  }

  protected alternarAlertas(ativo: boolean): void {
    this.edicao.update((atual) => ({ ...atual, alertasAtivos: ativo }));
  }

  protected alternarTipo(tipo: TipoAlerta, marcado: boolean): void {
    this.edicao.update((atual) => ({
      ...atual,
      tipos: marcado ? [...new Set([...atual.tipos, tipo])] : atual.tipos.filter((t) => t !== tipo),
    }));
  }

  protected alterarLimiar(valor: number | null): void {
    this.edicao.update((atual) => ({ ...atual, limiar: valor }));
  }

  protected limiarInvalido(favorito: Favorito): boolean {
    if (favorito.tipoAtivo !== 'ACAO_FII_ETF') return false;
    const limiar = this.edicao().limiar;
    return limiar === null || Number.isNaN(limiar) || limiar < LIMIAR_MINIMO || limiar > LIMIAR_MAXIMO;
  }

  protected salvarAlertas(favorito: Favorito): void {
    if (this.salvando() || this.limiarInvalido(favorito)) return;
    const { alertasAtivos, tipos, limiar } = this.edicao();
    this.salvando.set(true);

    this.favoritoService
      .configurarAlertas(favorito.id, {
        alertasAtivos,
        tiposAlertaAtivos: tipos,
        ...(favorito.tipoAtivo === 'ACAO_FII_ETF' && limiar !== null ? { limiarVariacao: limiar } : {}),
      })
      .subscribe({
        next: (atualizado) => {
          this.favoritos.update((lista) => lista.map((f) => (f.id === atualizado.id ? atualizado : f)));
          this.salvando.set(false);
          this.emEdicao.set(null);
          this.toastService.sucesso('Alertas atualizados.');
        },
        error: (erro) => {
          this.salvando.set(false);
          this.toastService.erro(mensagemDoErro(erro, 'Não foi possível salvar os alertas. Tente de novo.'));
        },
      });
  }

  protected remover(favorito: Favorito): void {
    if (this.removendo()) return;
    this.removendo.set(favorito.id);
    this.favoritoService.remover(favorito.id).subscribe({
      next: () => {
        this.favoritos.update((lista) => lista.filter((f) => f.id !== favorito.id));
        this.removendo.set(null);
        if (this.emEdicao() === favorito.id) this.emEdicao.set(null);
        this.toastService.sucesso(`${favorito.codigo ?? favorito.nome} saiu dos seus favoritos.`);
      },
      error: (erro) => {
        this.removendo.set(null);
        this.toastService.erro(mensagemDoErro(erro, 'Não foi possível remover o favorito. Tente de novo.'));
      },
    });
  }

  protected irParaRendaVariavel(): void {
    this.router.navigateByUrl('/renda-variavel');
  }
}
