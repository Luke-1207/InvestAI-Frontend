import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AcaoService } from './acao.service';
import { RendaFixaService } from './renda-fixa.service';
import {
  ItemComparacao,
  ItemSelecionavel,
  MetricaComparacao,
  TipoItemComparacao,
  VereditoComparacao,
} from '../models/comparacao';
import { TituloPrivadoDetalhe, TituloTesouroDetalhe } from '../models/renda-fixa';

type ItemComparacaoSemPontuacao = Omit<ItemComparacao, 'tipo' | 'score' | 'compatibilidade'>;

@Injectable({ providedIn: 'root' })
export class ComparacaoService {
  private readonly http = inject(HttpClient);
  private readonly acaoService = inject(AcaoService);
  private readonly rendaFixaService = inject(RendaFixaService);
  private readonly baseUrl = `${environment.apiUrl}/comparacao`;

  listarItensSelecionaveis(): Observable<ItemSelecionavel[]> {
    return forkJoin({
      acoes: this.acaoService.listar({ pagina: 1, tamanho: 100 }),
      rendaFixa: this.rendaFixaService.listar('livre'),
    }).pipe(
      map(({ acoes, rendaFixa }) => [
        ...acoes.content.map(
          (a): ItemSelecionavel => ({
            tipo: a.tipo,
            identificador: a.codigo,
            rotulo: `${a.codigo} — ${a.nome}`,
            subRotulo: a.setor,
          }),
        ),
        ...rendaFixa.map(
          (r): ItemSelecionavel => ({
            tipo: r.categoria,
            identificador: r.codigo ?? r.id,
            rotulo: r.nome,
            subRotulo: r.indexador,
          }),
        ),
      ]),
    );
  }

  obterVeredito(
    tipoA: string,
    identificadorA: string,
    tipoB: string,
    identificadorB: string,
  ): Observable<VereditoComparacao> {
    const params = new HttpParams()
      .set('tipoA', tipoA)
      .set('identificadorA', identificadorA)
      .set('tipoB', tipoB)
      .set('identificadorB', identificadorB);
    return this.http.get<VereditoComparacao>(`${this.baseUrl}/veredito`, { params });
  }

  carregarItemComparacao(tipo: TipoItemComparacao, identificador: string): Observable<ItemComparacao> {
    if (tipo === 'ACAO' || tipo === 'FII' || tipo === 'ETF') {
      return this.carregarAcao(tipo, identificador);
    }
    return this.carregarRendaFixa(tipo, identificador);
  }

  private carregarAcao(tipo: TipoItemComparacao, codigo: string): Observable<ItemComparacao> {
    return forkJoin({
      detalhe: this.acaoService.obterDetalhe(codigo, '1A'),
      sugestao: this.acaoService.obterSugestao(codigo),
    }).pipe(
      map(({ detalhe, sugestao }) => {
        const metricas: MetricaComparacao[] = [
          { rotulo: 'Preço', valor: `R$ ${detalhe.preco.toFixed(2)}` },
          {
            rotulo: 'Variação',
            valor: `${detalhe.variacaoPercentual >= 0 ? '+' : ''}${detalhe.variacaoPercentual.toFixed(2)}%`,
          },
          { rotulo: 'Dividend Yield', valor: `${detalhe.dividendYield.toFixed(2)}%` },
          { rotulo: 'P/VP', valor: detalhe.precoValorPatrimonial.toFixed(2) },
        ];

        return {
          tipo,
          identificador: codigo,
          rotulo: `${detalhe.codigo} — ${detalhe.nome}`,
          categoria: detalhe.tipo,
          metricas,
          score: sugestao?.score ?? null,
          compatibilidade: sugestao?.compatibilidade ?? null,
        };
      }),
    );
  }

  private carregarRendaFixa(tipo: TipoItemComparacao, identificador: string): Observable<ItemComparacao> {
    const detalhe$: Observable<ItemComparacaoSemPontuacao> =
      tipo === 'TESOURO'
        ? this.rendaFixaService
          .obterDetalheTesouro(identificador)
          .pipe(map((dto) => this.normalizarTesouro(dto)))
        : this.rendaFixaService
          .obterDetalhePrivado(identificador)
          .pipe(map((dto) => this.normalizarPrivado(dto)));

    return forkJoin({
      normalizado: detalhe$,
      itensInteligente: this.rendaFixaService.listar('inteligente'),
    }).pipe(
      map(({ normalizado, itensInteligente }) => {
        const item = itensInteligente.find(
          (i) => i.id === identificador || i.codigo === identificador,
        );
        return {
          ...normalizado,
          tipo,
          score: item?.score ?? null,
          compatibilidade: item?.compatibilidade ?? null,
        };
      }),
    );
  }

  private normalizarTesouro(dto: TituloTesouroDetalhe): ItemComparacaoSemPontuacao {
    return {
      identificador: dto.codigo,
      rotulo: dto.nome,
      categoria: 'TESOURO',
      metricas: [
        { rotulo: 'Rentabilidade', valor: `${dto.taxaAnual.toFixed(2)}% a.a.` },
        { rotulo: 'Vencimento', valor: new Date(dto.vencimento).toLocaleDateString('pt-BR') },
        { rotulo: 'Investimento mínimo', valor: `R$ ${dto.precoMinimo.toFixed(2)}` },
        { rotulo: 'Liquidez', valor: dto.liquidez === 'DIARIA' ? 'Diária' : 'No vencimento' },
      ],
    };
  }

  private normalizarPrivado(dto: TituloPrivadoDetalhe): ItemComparacaoSemPontuacao {
    return {
      identificador: dto.id,
      rotulo: dto.emissor,
      categoria: dto.tipo,
      metricas: [
        { rotulo: 'Rentabilidade', valor: `${dto.rentabilidadeEstimada.taxaBrutaAnual.toFixed(2)}% a.a.` },
        { rotulo: 'Vencimento', valor: new Date(dto.vencimento).toLocaleDateString('pt-BR') },
        { rotulo: 'Investimento mínimo', valor: `R$ ${dto.investimentoMinimo.toFixed(2)}` },
        { rotulo: 'Liquidez', valor: dto.liquidez === 'DIARIA' ? 'Diária' : 'No vencimento' },
      ],
    };
  }
}
