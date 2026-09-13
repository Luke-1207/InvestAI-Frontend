import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EstadoErroComponent } from '../shared/components/ui/estado-erro/estado-erro.component';

@Component({
  selector: 'app-pagina-nao-encontrada',
  standalone: true,
  imports: [EstadoErroComponent],
  template: `
    <app-estado-erro
      icone="search_off"
      titulo="Página não encontrada"
      mensagem="O endereço que você tentou acessar não existe ou foi movido."
      textoAcao="Voltar ao Dashboard"
      (acao)="voltarParaDashboard()"
    />
  `,
})
export class PaginaNaoEncontradaComponent {
  private readonly router = inject(Router);

  protected voltarParaDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
