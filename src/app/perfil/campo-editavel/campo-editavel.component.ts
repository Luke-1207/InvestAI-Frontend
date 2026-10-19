import { Component, ElementRef, Injector, afterNextRender, effect, inject, input, output } from '@angular/core';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

let proximoId = 0;

@Component({
  selector: 'app-campo-editavel',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './campo-editavel.component.html',
  styleUrl: './campo-editavel.component.scss',
  host: {
    '[class.campo-editavel--destaque]': "variante() === 'destaque'",
    '[class.campo-editavel--editando]': 'editando()',
  },
})
export class CampoEditavelComponent {
  readonly titulo = input.required<string>();
  readonly editando = input(false);
  readonly salvando = input(false);
  readonly erro = input<string | null>(null);
  readonly variante = input<'padrao' | 'destaque'>('padrao');

  readonly editar = output<void>();
  readonly cancelar = output<void>();
  readonly salvar = output<void>();

  protected readonly id = `campo-editavel-${proximoId++}`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private primeiraExecucao = true;

  constructor() {
    effect(() => {
      const editando = this.editando();
      if (this.primeiraExecucao) {
        this.primeiraExecucao = false;
        return;
      }
      afterNextRender(() => this.moverFoco(editando), { injector: this.injector });
    });
  }

  protected aoEnviar(evento: Event): void {
    evento.preventDefault();
    this.salvar.emit();
  }

  private moverFoco(editando: boolean): void {
    const elemento = this.host.nativeElement;
    if (editando) {
      const formulario = elemento.querySelector('.campo-editavel__formulario');
      (formulario?.querySelector<HTMLElement>('input:checked') ?? formulario?.querySelector<HTMLElement>('input'))?.focus();
      return;
    }
    const focoAtual = document.activeElement;
    if (!focoAtual || focoAtual === document.body || elemento.contains(focoAtual)) {
      elemento.querySelector<HTMLElement>('.campo-editavel__editar')?.focus();
    }
  }
}
