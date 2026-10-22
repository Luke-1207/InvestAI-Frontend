import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CriterioPeso {
  criterio: string;
  pontos: string;
}

@Component({
  selector: 'app-conformidade',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './conformidade.component.html',
  styleUrl: './conformidade.component.scss',
})
export class ConformidadeComponent {
  protected readonly pesosRendaVariavel: CriterioPeso[] = [
    { criterio: 'Oscilação do preço em relação ao seu perfil de risco', pontos: 'até 35 (pode tirar 10)' },
    { criterio: 'Dividendos em relação ao seu objetivo', pontos: 'até 25' },
    { criterio: 'Prazo em que você pretende usar o dinheiro', pontos: 'até 15' },
    { criterio: 'Preço de uma cota cabe no valor disponível', pontos: '10' },
    { criterio: 'Setor da empresa', pontos: 'até 15 (setor evitado tira 20)' },
  ];

  protected readonly pesosRendaFixa: CriterioPeso[] = [
    { criterio: 'Indexador em relação ao seu perfil de risco', pontos: 'até 30' },
    { criterio: 'Vencimento em relação ao seu prazo', pontos: 'até 25 (muito distante tira 10)' },
    { criterio: 'Liquidez, ou seja, quando você pode resgatar', pontos: 'até 15' },
    { criterio: 'Encaixe com o seu objetivo', pontos: 'até 15' },
    { criterio: 'Investimento mínimo cabe no valor disponível', pontos: '10' },
    { criterio: 'Garantia do Tesouro Nacional ou do FGC', pontos: '5' },
  ];
}
