import { Component, Injector, afterNextRender, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { UsuarioService } from '../../shared/services/usuario.service';
import { AuthService } from '../../shared/services/auth.service';
import { FotoPerfilService } from '../../shared/services/foto-perfil.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-excluir-conta',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './excluir-conta.component.html',
  styleUrl: './excluir-conta.component.scss',
})
export class ExcluirContaComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly fotoPerfilService = inject(FotoPerfilService);
  private readonly toastService = inject(ToastService);
  private readonly injector = inject(Injector);

  protected readonly confirmando = signal(false);
  protected readonly senha = signal('');
  protected readonly excluindo = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected abrir(): void {
    this.confirmando.set(true);
    afterNextRender(() => document.getElementById('excluir-conta-senha')?.focus(), { injector: this.injector });
  }

  protected cancelar(): void {
    this.confirmando.set(false);
    this.senha.set('');
    this.erro.set(null);
  }

  protected lerSenha(evento: Event): void {
    this.senha.set((evento.target as HTMLInputElement).value);
  }

  protected confirmar(evento: Event): void {
    evento.preventDefault();
    if (this.excluindo()) return;
    if (!this.senha()) {
      this.erro.set('Digite a sua senha para confirmar.');
      return;
    }

    this.excluindo.set(true);
    this.erro.set(null);
    this.usuarioService.excluirConta(this.senha()).subscribe({
      next: () => {
        this.fotoPerfilService.limpar();
        this.authService.logout();
        this.toastService.sucesso('Sua conta foi excluída.');
      },
      error: (erro: HttpErrorResponse) => {
        this.excluindo.set(false);
        this.erro.set(this.mensagemDeErro(erro));
      },
    });
  }

  private mensagemDeErro(erro: HttpErrorResponse): string {
    if (erro.status === 422) return 'Senha incorreta. Confira e tente de novo.';
    const detalhes = erro.error?.detalhes as Record<string, string> | undefined;
    if (detalhes && Object.keys(detalhes).length) return Object.values(detalhes)[0];
    return 'Não foi possível excluir a conta agora. Tente novamente.';
  }
}
