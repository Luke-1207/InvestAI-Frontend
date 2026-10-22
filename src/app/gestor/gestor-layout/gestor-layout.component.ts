import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface SecaoGestor {
  rota: string;
  rotulo: string;
  icone: string;
  exata: boolean;
}

@Component({
  selector: 'app-gestor-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './gestor-layout.component.html',
  styleUrl: './gestor-layout.component.scss',
})
export class GestorLayoutComponent {
  protected readonly secoes: SecaoGestor[] = [
    { rota: '/gestor', rotulo: 'Visão geral', icone: 'monitoring', exata: true },
    { rota: '/gestor/ativos', rotulo: 'Renda variável', icone: 'trending_up', exata: false },
    { rota: '/gestor/titulos', rotulo: 'Títulos privados', icone: 'account_balance', exata: false },
    { rota: '/gestor/usuarios', rotulo: 'Usuários', icone: 'group', exata: false },
    { rota: '/gestor/indicadores', rotulo: 'Indicadores', icone: 'percent', exata: false },
  ];
}
