import { Component, output } from '@angular/core';
import { EstadoErroComponent } from '../ui/estado-erro/estado-erro.component';

@Component({
  selector: 'app-erro-conexao',
  standalone: true,
  imports: [EstadoErroComponent],
  template: `
    <app-estado-erro
      icone="wifi_off"
      titulo="Sem conexão com o servidor"
      mensagem="Não foi possível falar com a InvestAI agora. Verifique sua internet ou tente novamente em instantes."
      textoAcao="Tentar novamente"
      variante="alerta"
      (acao)="tentarNovamente.emit()"
    />
  `,
})
export class ErroConexaoComponent {
  readonly tentarNovamente = output<void>();
}
