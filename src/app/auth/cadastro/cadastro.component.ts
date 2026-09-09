import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout.component';
import { InputComponent } from '../../shared/components/ui/input/input.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { AuthService } from '../../shared/services/auth.service';
import { senhasIguaisValidator } from '../../shared/validators/senhas-iguais.validator';

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
  private readonly router = inject(Router);

  protected readonly formulario = this.fb.nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasIguaisValidator },
  );

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected get senhasNaoConferem(): boolean {
    return (
      this.formulario.hasError('senhasDiferentes') &&
      this.formulario.controls.confirmarSenha.touched
    );
  }

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    this.authService.cadastrar(this.formulario.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/onboarding'),
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
}
