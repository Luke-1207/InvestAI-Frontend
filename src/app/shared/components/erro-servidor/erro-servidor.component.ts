import { Component, output } from '@angular/core';
import { EstadoErroComponent } from '../ui/estado-erro/estado-erro.component';

@Component({
  selector: 'app-erro-servidor',
  standalone: true,
  imports: [EstadoErroComponent],
  template: `
    <app-estado-erro
      icone="error"
      titulo="Algo deu errado"
      mensagem="Não conseguimos carregar esses dados agora. Tente novamente em instantes."
      textoAcao="Tentar novamente"
      variante="alerta"
      (acao)="tentarNovamente.emit()"
    />
  `,
})
export class ErroServidorComponent {
  readonly tentarNovamente = output<void>();
}
