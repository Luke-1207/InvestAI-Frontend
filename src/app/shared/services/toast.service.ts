import { Injectable, signal } from '@angular/core';

export type TipoToast = 'sucesso' | 'erro' | 'aviso';

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

const DURACAO_PADRAO_MS: Record<TipoToast, number> = {
  sucesso: 4000,
  aviso: 5000,
  erro: 6000,
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private proximoId = 0;

  readonly toasts = signal<Toast[]>([]);

  sucesso(mensagem: string, duracaoMs?: number): void {
    this.exibir('sucesso', mensagem, duracaoMs);
  }

  erro(mensagem: string, duracaoMs?: number): void {
    this.exibir('erro', mensagem, duracaoMs);
  }

  aviso(mensagem: string, duracaoMs?: number): void {
    this.exibir('aviso', mensagem, duracaoMs);
  }

  remover(id: number): void {
    this.toasts.update((atual) => atual.filter((toast) => toast.id !== id));
  }

  private exibir(tipo: TipoToast, mensagem: string, duracaoMs?: number): void {
    const id = this.proximoId++;
    const duracao = duracaoMs ?? DURACAO_PADRAO_MS[tipo];

    this.toasts.update((atual) => [...atual, { id, tipo, mensagem }]);
    setTimeout(() => this.remover(id), duracao);
  }
}
