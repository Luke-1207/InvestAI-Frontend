import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout.component';
import { InputComponent } from '../../shared/components/ui/input/input.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { AuthService } from '../../shared/services/auth.service';
import { FotoPerfilService } from '../../shared/services/foto-perfil.service';
import { ToastService } from '../../shared/services/toast.service';
import { senhasIguaisValidator } from '../../shared/validators/senhas-iguais.validator';
import { ACEITE_FOTO, validarFotoPerfil } from '../../shared/utils/foto-perfil.util';

export const MENSAGEM_FALHA_FOTO =
  'Sua conta foi criada, mas não conseguimos enviar a foto. Você pode adicioná-la depois em Perfil, no Editar Dados Pessoais.';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, InputComponent, ButtonComponent],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss',
})
export class CadastroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly fotoPerfilService = inject(FotoPerfilService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly formulario = this.fb.nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasIguaisValidator('senha', 'confirmarSenha') },
  );

  protected readonly aceiteFoto = ACEITE_FOTO;
  protected readonly carregando = signal(false);
  protected readonly enviandoFoto = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly foto = signal<File | null>(null);
  protected readonly previaFoto = signal<string | null>(null);
  protected readonly erroFoto = signal<string | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.trocarPrevia(null));
  }

  protected get senhasNaoConferem(): boolean {
    return (
      this.formulario.hasError('senhasDiferentes') &&
      this.formulario.controls.confirmarSenha.touched
    );
  }

  protected aoEscolherFoto(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    campo.value = '';
    if (!arquivo) return;

    const erro = validarFotoPerfil(arquivo);
    this.erroFoto.set(erro);
    if (erro) return;

    this.foto.set(arquivo);
    this.trocarPrevia(URL.createObjectURL(arquivo));
  }

  protected removerFoto(): void {
    this.foto.set(null);
    this.erroFoto.set(null);
    this.trocarPrevia(null);
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);
    const foto = this.foto();

    this.authService
      .cadastrar(this.formulario.getRawValue())
      .pipe(switchMap(() => (foto ? this.enviarFoto(foto) : of(true))))
      .subscribe({
        next: (fotoEnviada) => {
          if (!fotoEnviada) this.toastService.aviso(MENSAGEM_FALHA_FOTO);
          this.router.navigateByUrl('/onboarding');
        },
        error: (erro: HttpErrorResponse) => {
          this.carregando.set(false);
          this.erro.set(
            erro.status === 409
              ? 'Já existe uma conta cadastrada com esse e-mail.'
              : 'Não foi possível concluir o cadastro. Tente novamente.',
          );
        },
      });
  }

  private enviarFoto(foto: File): Observable<boolean> {
    this.enviandoFoto.set(true);
    return this.fotoPerfilService.enviar(foto).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  private trocarPrevia(nova: string | null): void {
    const atual = this.previaFoto();
    if (atual) URL.revokeObjectURL(atual);
    this.previaFoto.set(nova);
  }
}
