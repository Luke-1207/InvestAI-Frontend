import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { RelatoriosComponent, TAMANHO_PAGINA_HISTORICO } from './relatorios.component';
import { RelatorioService } from '../shared/services/relatorio.service';
import { PageResponse } from '../shared/models/acao';
import { HistoricoRelatorio } from '../shared/models/relatorio';

function registro(parcial: Partial<HistoricoRelatorio> = {}): HistoricoRelatorio {
  return { id: 'r1', tipo: 'ATIVO_INDIVIDUAL', referencia: 'TAEE11', geradoEm: '2026-10-06T15:00:00', ...parcial };
}

function pagina(content: HistoricoRelatorio[], totalElements = content.length): PageResponse<HistoricoRelatorio> {
  return {
    content,
    totalElements,
    totalPages: Math.ceil(totalElements / TAMANHO_PAGINA_HISTORICO),
    number: 0,
    size: TAMANHO_PAGINA_HISTORICO,
    first: true,
    last: content.length >= totalElements,
  };
}

describe('RelatoriosComponent', () => {
  let fixture: ComponentFixture<RelatoriosComponent>;
  let relatorioService: jasmine.SpyObj<RelatorioService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    relatorioService = jasmine.createSpyObj<RelatorioService>('RelatorioService', ['listarHistorico']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [RelatoriosComponent],
      providers: [
        { provide: RelatorioService, useValue: relatorioService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  function iniciar(): HTMLElement {
    fixture = TestBed.createComponent(RelatoriosComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function texto(elemento: Element | null): string {
    return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  it('deve pedir a primeira página do histórico ao abrir', () => {
    relatorioService.listarHistorico.and.returnValue(of(pagina([registro()])));

    iniciar();

    expect(relatorioService.listarHistorico).toHaveBeenCalledOnceWith(0, TAMANHO_PAGINA_HISTORICO);
  });

  it('deve mostrar carregamento enquanto o histórico não chega', () => {
    relatorioService.listarHistorico.and.returnValue(new Subject<PageResponse<HistoricoRelatorio>>());

    const el = iniciar();

    expect(el.querySelector('app-spinner')).toBeTruthy();
    expect(el.querySelector('.relatorios__lista')).toBeNull();
  });

  it('deve listar os registros na ordem recebida, com tipo, referência e data', () => {
    relatorioService.listarHistorico.and.returnValue(
      of(
        pagina([
          registro({ id: 'r3', tipo: 'PERFIL', referencia: 'PERFIL', geradoEm: '2026-10-06T16:30:00' }),
          registro({ id: 'r2', tipo: 'LISTAGEM', referencia: 'LISTAGEM_FIXA', geradoEm: '2026-10-06T15:45:00' }),
          registro({ id: 'r1', tipo: 'ATIVO_INDIVIDUAL', referencia: 'TAEE11', geradoEm: '2026-10-05T09:05:00' }),
        ]),
      ),
    );

    const el = iniciar();

    const itens = Array.from(el.querySelectorAll('.relatorios__item')).map((item) => texto(item));
    expect(itens.length).toBe(3);
    expect(itens[0]).toContain('Perfil do investidor');
    expect(itens[0]).toContain('Seu perfil de investidor');
    expect(itens[0]).toContain('06/10/2026 16:30');
    expect(itens[1]).toContain('Listagem ranqueada');
    expect(itens[1]).toContain('Renda Fixa');
    expect(itens[2]).toContain('Análise de ativo');
    expect(itens[2]).toContain('TAEE11');
    expect(itens[2]).toContain('05/10/2026 09:05');
    expect(texto(el.querySelector('.relatorios__total'))).toBe('3 relatórios');
  });

  it('deve traduzir as referências de listagem de renda variável e de ambos os módulos', () => {
    relatorioService.listarHistorico.and.returnValue(
      of(
        pagina([
          registro({ id: 'a', tipo: 'LISTAGEM', referencia: 'LISTAGEM_VARIAVEL' }),
          registro({ id: 'b', tipo: 'LISTAGEM', referencia: 'LISTAGEM_AMBOS' }),
        ]),
      ),
    );

    const el = iniciar();

    const itens = Array.from(el.querySelectorAll('.relatorios__descricao span')).map((item) => texto(item));
    expect(itens).toEqual(['Renda Variável', 'Renda Variável e Renda Fixa']);
  });

  it('com um único registro deve usar o singular no total', () => {
    relatorioService.listarHistorico.and.returnValue(of(pagina([registro()])));

    const el = iniciar();

    expect(texto(el.querySelector('.relatorios__total'))).toBe('1 relatório');
  });

  it('sem registros deve mostrar o estado vazio, sem lista nem total', () => {
    relatorioService.listarHistorico.and.returnValue(of(pagina([])));

    const el = iniciar();

    expect(texto(el.querySelector('.estado-erro__titulo'))).toBe('Nenhum relatório gerado ainda');
    expect(el.querySelector('.relatorios__lista')).toBeNull();
    expect(el.querySelector('.relatorios__total')).toBeNull();
  });

  it('o botão do estado vazio deve levar pra Renda Variável', () => {
    relatorioService.listarHistorico.and.returnValue(of(pagina([])));

    const el = iniciar();
    (el.querySelector('app-estado-erro app-button button') as HTMLButtonElement).click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/renda-variavel');
  });

  it('falha ao carregar deve mostrar erro, e tentar novamente deve recarregar', () => {
    relatorioService.listarHistorico.and.returnValue(throwError(() => new Error('500')));

    const el = iniciar();
    expect(el.querySelector('app-erro-servidor')).toBeTruthy();

    relatorioService.listarHistorico.and.returnValue(of(pagina([registro()])));
    (el.querySelector('app-erro-servidor app-button button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(relatorioService.listarHistorico).toHaveBeenCalledTimes(2);
    expect(el.querySelector('app-erro-servidor')).toBeNull();
    expect(el.querySelectorAll('.relatorios__item').length).toBe(1);
  });

  it('não deve mostrar "Carregar mais" quando todos os registros já estão na tela', () => {
    relatorioService.listarHistorico.and.returnValue(of(pagina([registro()])));

    const el = iniciar();

    expect(el.querySelector('.relatorios__mais')).toBeNull();
  });

  it('"Carregar mais" deve buscar a página seguinte e acrescentar os registros ao fim', () => {
    relatorioService.listarHistorico.and.returnValue(of(pagina([registro({ id: 'r1' })], 3)));
    const el = iniciar();

    relatorioService.listarHistorico.and.returnValue(
      of(pagina([registro({ id: 'r2', referencia: 'ITUB4' }), registro({ id: 'r3', referencia: 'VALE3' })], 3)),
    );
    (el.querySelector('.relatorios__mais') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(relatorioService.listarHistorico).toHaveBeenCalledWith(1, TAMANHO_PAGINA_HISTORICO);
    const referencias = Array.from(el.querySelectorAll('.relatorios__descricao span')).map((item) => texto(item));
    expect(referencias).toEqual(['TAEE11', 'ITUB4', 'VALE3']);
    expect(el.querySelector('.relatorios__mais')).toBeNull();
  });

  it('enquanto carrega mais deve desabilitar o botão', () => {
    relatorioService.listarHistorico.and.returnValue(of(pagina([registro()], 3)));
    const el = iniciar();

    relatorioService.listarHistorico.and.returnValue(new Subject<PageResponse<HistoricoRelatorio>>());
    const botao = el.querySelector('.relatorios__mais') as HTMLButtonElement;
    botao.click();
    fixture.detectChanges();

    expect(botao.disabled).toBeTrue();
    expect(texto(botao)).toContain('Carregando...');
  });

  it('falha ao carregar mais deve manter os registros, avisar e permitir tentar a mesma página de novo', () => {
    relatorioService.listarHistorico.and.returnValue(of(pagina([registro()], 3)));
    const el = iniciar();

    relatorioService.listarHistorico.and.returnValue(throwError(() => new Error('500')));
    (el.querySelector('.relatorios__mais') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelectorAll('.relatorios__item').length).toBe(1);
    expect(texto(el.querySelector('.relatorios__aviso'))).toContain('Não foi possível carregar mais registros');

    relatorioService.listarHistorico.and.returnValue(of(pagina([registro({ id: 'r2' })], 3)));
    (el.querySelector('.relatorios__mais') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(relatorioService.listarHistorico.calls.mostRecent().args).toEqual([1, TAMANHO_PAGINA_HISTORICO]);
    expect(el.querySelectorAll('.relatorios__item').length).toBe(2);
    expect(el.querySelector('.relatorios__aviso')).toBeNull();
  });
});
