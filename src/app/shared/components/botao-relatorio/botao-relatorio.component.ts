import { Component, inject, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { MENSAGEM_ERRO_RELATORIO } from '../../services/relatorio.service';
import { SpinnerComponent } from '../ui/spinner/spinner.component';

@Component({
  selector: 'app-botao-relatorio',
  standalone: true,
  imports: [SpinnerComponent],
  templateUrl: './botao-relatorio.component.html',
  styleUrl: './botao-relatorio.component.scss',
})
export class BotaoRelatorioComponent {
  private readonly toastService = inject(ToastService);

  readonly rotulo = input.required<string>();
  readonly requisicao = input.required<() => Observable<unknown>>();
  readonly icone = input('download');
  readonly desabilitado = input(false);

  readonly concluido = output<void>();

  protected readonly baixando = signal(false);

  protected baixar(): void {
    if (this.baixando() || this.desabilitado()) return;
    this.baixando.set(true);

    this.requisicao()().subscribe({
      next: () => {
        this.baixando.set(false);
        this.toastService.sucesso('Relatório baixado.');
        this.concluido.emit();
      },
      error: (erro: unknown) => {
        this.baixando.set(false);
        this.toastService.erro(erro instanceof Error && erro.message ? erro.message : MENSAGEM_ERRO_RELATORIO);
      },
    });
  }
}
