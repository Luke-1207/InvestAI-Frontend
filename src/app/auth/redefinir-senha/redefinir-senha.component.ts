import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout.component';
import { InputComponent } from '../../shared/components/ui/input/input.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { AuthService } from '../../shared/services/auth.service';
import { senhasIguaisValidator } from '../../shared/validators/senhas-iguais.validator';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, InputComponent, ButtonComponent],
  templateUrl: './redefinir-senha.component.html',
  styleUrl: './redefinir-senha.component.scss',
})
export class RedefinirSenhaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly tokenAusente = !this.token;

  protected readonly formulario = this.fb.nonNullable.group(
    {
      novaSenha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarNovaSenha: ['', [Validators.required]],
    },
    { validators: senhasIguaisValidator('novaSenha', 'confirmarNovaSenha') },
  );

  protected readonly carregando = signal(false);
  protected readonly concluido = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected get senhasNaoConferem(): boolean {
    return (
      this.formulario.hasError('senhasDiferentes') &&
      this.formulario.controls.confirmarNovaSenha.touched
    );
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    this.authService
      .redefinirSenha({ token: this.token, ...this.formulario.getRawValue() })
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.concluido.set(true);
        },
        error: () => {
          this.carregando.set(false);
          this.erro.set('Link inválido ou expirado. Solicite um novo link de redefinição.');
        },
      });
  }
}
