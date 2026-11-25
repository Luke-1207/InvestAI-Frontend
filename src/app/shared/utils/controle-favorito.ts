import { signal } from '@angular/core';
import { FavoritoService } from '../services/favorito.service';
import { ToastService } from '../services/toast.service';
import { ReferenciaAtivo } from '../models/favorito';
import { mensagemDoErro } from './erro-api.util';

export const MENSAGEM_FAVORITO_ADICIONADO = 'Adicionado aos favoritos. Os alertas dele vão aparecer no sininho.';
export const MENSAGEM_FAVORITO_REMOVIDO = 'Removido dos favoritos.';
export const MENSAGEM_FAVORITO_ERRO = 'Não foi possível atualizar seus favoritos. Tente de novo.';

export class ControleFavorito {
  readonly favoritado = signal(false);
  readonly processando = signal(false);
  private favoritoId: string | null = null;

  constructor(
    private readonly favoritoService: FavoritoService,
    private readonly toastService: ToastService,
    private readonly referencia: () => ReferenciaAtivo,
  ) {}

  carregar(): void {
    this.favoritoService.status(this.referencia()).subscribe({
      next: (status) => {
        this.favoritado.set(status.favoritado);
        this.favoritoId = status.favoritoId;
      },
      error: () => this.favoritado.set(false),
    });
  }

  alternar(): void {
    if (this.processando()) return;
    this.processando.set(true);

    if (this.favoritado() && this.favoritoId) {
      this.favoritoService.remover(this.favoritoId).subscribe({
        next: () => {
          this.favoritado.set(false);
          this.favoritoId = null;
          this.processando.set(false);
          this.toastService.sucesso(MENSAGEM_FAVORITO_REMOVIDO);
        },
        error: (erro) => this.falhar(erro),
      });
      return;
    }

    this.favoritoService.adicionar(this.referencia()).subscribe({
      next: (favorito) => {
        this.favoritado.set(true);
        this.favoritoId = favorito.id;
        this.processando.set(false);
        this.toastService.sucesso(MENSAGEM_FAVORITO_ADICIONADO);
      },
      error: (erro) => this.falhar(erro),
    });
  }

  private falhar(erro: unknown): void {
    this.processando.set(false);
    this.toastService.erro(mensagemDoErro(erro, MENSAGEM_FAVORITO_ERRO));
  }
}
