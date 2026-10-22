import { Component, computed, inject, signal } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { IndicadorTicker } from '../../models/indicador-mercado';
import { AjudaGlossarioComponent } from '../ajuda-glossario/ajuda-glossario.component';
import { formatarMoeda, formatarNumero, formatarPercentual } from '../../utils/formatacao.util';

@Component({
  selector: 'app-ticker-mercado',
  standalone: true,
  imports: [AjudaGlossarioComponent],
  templateUrl: './ticker-mercado.component.html',
  styleUrl: './ticker-mercado.component.scss',
  host: {
    role: 'region',
    'aria-label': 'Cotações do mercado',
    '[class.ticker-mercado--pausado]': 'ajudaAberta()',
  },
})
export class TickerMercadoComponent {
  private readonly dashboardService = inject(DashboardService);

  protected readonly copias = [0, 1];
  protected readonly ajudaAberta = signal(false);

  readonly indicadores = computed<IndicadorTicker[]>(() => {
    const dados = this.dashboardService.dashboard()?.indicadoresMercado;
    if (!dados) {
      return [
        { label: 'IBOVESPA', chave: 'IBOVESPA', valor: '—' },
        { label: 'DÓLAR', chave: 'DOLAR', valor: '—' },
        { label: 'EURO', chave: 'EURO', valor: '—' },
        { label: 'SELIC', chave: 'SELIC', valor: '—' },
        { label: 'IPCA', chave: 'IPCA', valor: '—' },
      ];
    }

    return [
      { label: 'IBOVESPA', chave: 'IBOVESPA', valor: formatarNumero(dados.ibovespaPontos, 0), positivo: dados.ibovespaVariacaoDia >= 0 },
      { label: 'DÓLAR', chave: 'DOLAR', valor: formatarMoeda(dados.dolarValor), positivo: dados.dolarVariacaoDia >= 0 },
      { label: 'EURO', chave: 'EURO', valor: formatarMoeda(dados.euroValor), positivo: dados.euroVariacaoDia >= 0 },
      { label: 'SELIC', chave: 'SELIC', valor: formatarPercentual(dados.selicAtual) },
      { label: 'IPCA', chave: 'IPCA', valor: formatarPercentual(dados.ipcaAcumulado12m) },
    ];
  });
}
