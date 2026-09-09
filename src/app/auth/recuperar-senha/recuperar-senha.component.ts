import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout.component';
import { InputComponent } from '../../shared/components/ui/input/input.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-recuperar-senha',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, InputComponent, ButtonComponent],
  templateUrl: './recuperar-senha.component.html',
  styleUrl: './recuperar-senha.component.scss',
})
export class RecuperarSenhaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly carregando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    this.authService.esqueciSenha(this.formulario.getRawValue()).subscribe({
      next: () => {
        this.carregando.set(false);
        this.enviado.set(true);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível enviar o link. Tente novamente.');
      },
    });
  }
}
