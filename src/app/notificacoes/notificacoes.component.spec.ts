import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NotificacoesComponent, TAMANHO_PAGINA_NOTIFICACOES } from './notificacoes.component';
import { NotificacaoService } from '../shared/services/notificacao.service';
import { Notificacao } from '../shared/models/notificacao';
import { PageResponse } from '../shared/models/acao';

function notificacaoMock(overrides: Partial<Notificacao> = {}): Notificacao {
  return {
    id: 'n1',
    tipo: 'VARIACAO_ALTA',
    titulo: 'PETR4 subiu 6,20% hoje',
    mensagem: 'A variação do dia passou do limite.',
    tipoAtivo: 'ACAO_FII_ETF',
    ativoId: 'a1',
    codigoAtivo: 'PETR4',
    lida: false,
    lidaEm: null,
    criadoEm: new Date().toISOString(),
    ...overrides,
  };
}

function pagina(itens: Notificacao[], total = itens.length): PageResponse<Notificacao> {
  return { content: itens, totalElements: total, totalPages: 1, number: 0, size: itens.length, first: true, last: true };
}

describe('NotificacoesComponent', () => {
  let fixture: ComponentFixture<NotificacoesComponent>;
  let service: jasmine.SpyObj<NotificacaoService> & { naoLidas: ReturnType<typeof signal<number>> };
  let router: Router;

  async function montar(itens: Notificacao[] = [notificacaoMock()], total = itens.length) {
    service = Object.assign(
      jasmine.createSpyObj<NotificacaoService>('NotificacaoService', ['listar', 'contarNaoLidas', 'marcarComoLida', 'marcarTodasComoLidas']),
      { naoLidas: signal(1) },
    );
    service.listar.and.returnValue(of(pagina(itens, total)));
    service.contarNaoLidas.and.returnValue(of({ total: 1 }));

    await TestBed.configureTestingModule({
      imports: [NotificacoesComponent],
      providers: [provideRouter([]), { provide: NotificacaoService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacoesComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  function elemento(): HTMLElement {
    return fixture.nativeElement;
  }

  it('deve listar as notificações e marcar as não lidas', async () => {
    await montar([notificacaoMock(), notificacaoMock({ id: 'n2', tipo: 'SISTEMA', tipoAtivo: null, ativoId: null, codigoAtivo: null, lida: true })]);

    expect(service.listar).toHaveBeenCalledWith(0, TAMANHO_PAGINA_NOTIFICACOES, undefined);
    const itens = elemento().querySelectorAll('.notificacoes__item');
    expect(itens.length).toBe(2);
    expect(itens[0].classList).toContain('notificacoes__item--nao-lida');
    expect(itens[1].classList).not.toContain('notificacoes__item--nao-lida');
    expect(itens[0].textContent).toContain('agora há pouco');
  });

  it('deve filtrar só as não lidas', async () => {
    await montar();
    const botoes = elemento().querySelectorAll<HTMLButtonElement>('.notificacoes__filtros button');

    botoes[1].click();

    expect(service.listar).toHaveBeenCalledWith(0, TAMANHO_PAGINA_NOTIFICACOES, false);
  });

  it('ao abrir uma notificação de ativo deve marcar como lida e ir para o detalhe', async () => {
    await montar();
    const navSpy = spyOn(router, 'navigate');
    service.marcarComoLida.and.returnValue(of(notificacaoMock({ lida: true, lidaEm: '2026-11-25T10:00:00' })));

    (elemento().querySelector('.notificacoes__item') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(service.marcarComoLida).toHaveBeenCalledWith('n1');
    expect(navSpy).toHaveBeenCalledWith(['/renda-variavel', 'PETR4']);
    expect(elemento().querySelector('.notificacoes__item')!.classList).not.toContain('notificacoes__item--nao-lida');
  });

  it('perfil alterado deve levar para a tela de perfil', async () => {
    await montar([notificacaoMock({ tipo: 'PERFIL_ALTERADO', tipoAtivo: null, ativoId: null, codigoAtivo: null, lida: true })]);
    const navSpy = spyOn(router, 'navigate');

    (elemento().querySelector('.notificacoes__item') as HTMLButtonElement).click();

    expect(service.marcarComoLida).not.toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/perfil']);
  });

  it('comunicado do sistema não deve navegar', async () => {
    await montar([notificacaoMock({ tipo: 'SISTEMA', tipoAtivo: null, ativoId: null, codigoAtivo: null })]);
    const navSpy = spyOn(router, 'navigate');
    service.marcarComoLida.and.returnValue(of(notificacaoMock({ lida: true })));

    (elemento().querySelector('.notificacoes__item') as HTMLButtonElement).click();

    expect(service.marcarComoLida).toHaveBeenCalled();
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('deve marcar todas como lidas', async () => {
    await montar();
    service.marcarTodasComoLidas.and.returnValue(of({ atualizadas: 1 }));

    (elemento().querySelector('.notificacoes__marcar') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(service.marcarTodasComoLidas).toHaveBeenCalled();
    expect(elemento().querySelector('.notificacoes__item--nao-lida')).toBeNull();
  });

  it('deve carregar mais páginas sem duplicar itens', async () => {
    await montar([notificacaoMock()], 2);
    service.listar.and.returnValue(of(pagina([notificacaoMock(), notificacaoMock({ id: 'n2' })], 2)));

    (elemento().querySelector('.notificacoes__mais') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(service.listar).toHaveBeenCalledWith(1, TAMANHO_PAGINA_NOTIFICACOES, undefined);
    expect(elemento().querySelectorAll('.notificacoes__item').length).toBe(2);
    expect(elemento().querySelector('.notificacoes__mais')).toBeNull();
  });

  it('deve mostrar o estado vazio', async () => {
    await montar([]);
    expect(elemento().textContent).toContain('Nenhuma notificação ainda');
  });

  it('deve mostrar erro quando a listagem falha', async () => {
    await montar();
    service.listar.and.returnValue(throwError(() => new Error('falha')));

    elemento().querySelectorAll<HTMLButtonElement>('.notificacoes__filtros button')[1].click();
    fixture.detectChanges();

    expect(elemento().querySelector('app-erro-servidor')).not.toBeNull();
  });
});
