import { Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-estado-erro',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './estado-erro.component.html',
  styleUrl: './estado-erro.component.scss',
})
export class EstadoErroComponent {
  readonly icone = input.required<string>();
  readonly titulo = input.required<string>();
  readonly mensagem = input.required<string>();
  readonly textoAcao = input<string | null>(null);
  readonly variante = input<'neutro' | 'alerta'>('neutro');

  readonly acao = output<void>();
}
