import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { EstadoErroComponent } from '../shared/components/ui/estado-erro/estado-erro.component';

export interface DadosEmBreve {
  icone: string;
  titulo: string;
  descricao: string;
}

@Component({
  selector: 'app-em-breve',
  standalone: true,
  imports: [EstadoErroComponent],
  template: `
    @if (dados(); as secao) {
      <div class="em-breve">
        <span class="em-breve__selo">Em breve</span>
        <app-estado-erro
          [icone]="secao.icone"
          [titulo]="secao.titulo"
          [mensagem]="secao.descricao"
          textoAcao="Voltar ao Dashboard"
          (acao)="voltarParaDashboard()"
        />
      </div>
    }
  `,
  styleUrl: './em-breve.component.scss',
})
export class EmBreveComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly dados = toSignal(this.route.data.pipe(map((data) => data as DadosEmBreve)));

  protected voltarParaDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
