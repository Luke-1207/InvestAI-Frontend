import { Component, ElementRef, ViewChild, input, output } from '@angular/core';

let proximoId = 0;

@Component({
  selector: 'app-dialogo-confirmacao',
  standalone: true,
  templateUrl: './dialogo-confirmacao.component.html',
  styleUrl: './dialogo-confirmacao.component.scss',
})
export class DialogoConfirmacaoComponent {
  @ViewChild('dialogo', { static: true }) private dialogo!: ElementRef<HTMLDialogElement>;

  readonly titulo = input.required<string>();
  readonly textoConfirmar = input('Confirmar');
  readonly perigoso = input(false);
  readonly processando = input(false);
  readonly confirmado = output<void>();

  protected readonly idTitulo = `dialogo-titulo-${proximoId}`;
  protected readonly idTexto = `dialogo-texto-${proximoId++}`;
  private focoAnterior: HTMLElement | null = null;

  get aberto(): boolean {
    return this.dialogo.nativeElement.open;
  }

  abrir(): void {
    this.focoAnterior = document.activeElement as HTMLElement | null;
    if (!this.aberto) this.dialogo.nativeElement.showModal();
  }

  fechar(): void {
    if (this.aberto) this.dialogo.nativeElement.close();
  }

  protected aoCancelar(evento: Event): void {
    if (this.processando()) evento.preventDefault();
  }

  protected aoFechar(): void {
    if (this.focoAnterior?.isConnected) this.focoAnterior.focus();
    this.focoAnterior = null;
  }
}
