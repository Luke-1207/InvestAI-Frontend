import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, switchMap, tap } from 'rxjs';
import { UsuarioService } from './usuario.service';

@Injectable({ providedIn: 'root' })
export class FotoPerfilService {
  private readonly usuarioService = inject(UsuarioService);

  private readonly _url = signal<string | null>(null);
  readonly url = this._url.asReadonly();

  carregar(): void {
    this.definir(null);

    this.usuarioService
      .obter()
      .pipe(switchMap((dados) => (dados.possuiFoto ? this.usuarioService.obterFoto() : of(null))))
      .subscribe({
        next: (blob) => this.definir(blob ? URL.createObjectURL(blob) : null),
        error: () => this.definir(null),
      });
  }

  enviar(arquivo: File): Observable<void> {
    return this.usuarioService.enviarFoto(arquivo).pipe(tap(() => this.definir(URL.createObjectURL(arquivo))));
  }

  remover(): Observable<void> {
    return this.usuarioService.removerFoto().pipe(tap(() => this.definir(null)));
  }

  limpar(): void {
    this.definir(null);
  }

  private definir(nova: string | null): void {
    const atual = this._url();
    if (atual) URL.revokeObjectURL(atual);
    this._url.set(nova);
  }
}
