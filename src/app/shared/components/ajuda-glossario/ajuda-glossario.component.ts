import { Component, computed, input, output } from '@angular/core';
import { AjudaContextualComponent } from '../ajuda-contextual/ajuda-contextual.component';
import { termoGlossario } from '../../glossario/glossario';

@Component({
  selector: 'app-ajuda-glossario',
  standalone: true,
  imports: [AjudaContextualComponent],
  template: `
    @if (termo(); as item) {
      <app-ajuda
        [termo]="item.termo"
        [texto]="definicao() || item.definicao"
        [importancia]="item.importancia"
        [focavel]="focavel()"
        (alternado)="alternado.emit($event)"
      />
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
    }
  `,
})
export class AjudaGlossarioComponent {
  readonly chave = input.required<string | null | undefined>();
  readonly definicao = input<string | null | undefined>('');
  readonly focavel = input(true);

  readonly alternado = output<boolean>();

  protected readonly termo = computed(() => termoGlossario(this.chave()));
}
