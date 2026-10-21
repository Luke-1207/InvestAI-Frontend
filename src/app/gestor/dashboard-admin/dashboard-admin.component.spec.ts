import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { DashboardAdminComponent, INTERVALO_INTEGRACOES_MS } from './dashboard-admin.component';
import { DashboardAdminService } from '../../shared/services/dashboard-admin.service';
import { DashboardAdminResponse, SaudeIntegracoes, StatusIntegracao } from '../../shared/models/dashboard-admin';

function criarMetricas(parcial: Partial<DashboardAdminResponse> = {}): DashboardAdminResponse {
  return {
    totalUsuarios: 1284,
    novosUsuariosUltimos30Dias: 96,
    usuariosComPerfilPreenchido: 913,
    distribuicaoRisco: { CONSERVADOR: 402, MODERADO: 371, ARROJADO: 140 },
    distribuicaoAtivosPorCategoria: { ACAO: 42, FII: 18, ETF: 9, CDB: 12, LCI: 5, LCA: 4, TESOURO: 23 },
    titulosVencendoEm30Dias: 3,
    titulosVencendo: [
      { id: 'a', tipo: 'CDB', emissor: 'Banco Alfa', vencimento: '2026-10-08', diasParaVencimento: 3, urgencia: 'ALTA' },
      { id: 'b', tipo: 'LCI', emissor: 'Banco Beta', vencimento: '2026-10-17', diasParaVencimento: 12, urgencia: 'MEDIA' },
      { id: 'c', tipo: 'LCA', emissor: 'Banco Gama', vencimento: '2026-10-30', diasParaVencimento: 25, urgencia: 'BAIXA' },
    ],
    ultimaSincronizacaoTesouro: '2026-10-05T08:00:00',
    iaDisponivel: true,
    iaRabbitmqConectado: true,
    geradoEm: '2026-10-05T11:40:00',
    ...parcial,
  };
}

function integracao(parcial: Partial<StatusIntegracao>): StatusIntegracao {
  return {
    chave: 'MICROSSERVICO_IA', nome: 'Microsserviço de IA', situacao: 'OPERACIONAL', simulado: false, detalhe: null,
    ultimoSucessoEm: null, ultimaFalhaEm: null, ultimoErro: null, ...parcial,
  };
}

function saude(integracoes: StatusIntegracao[]): SaudeIntegracoes {
  return { integracoes, verificadoEm: '2026-10-21T19:00:00' };
}

const TUDO_OK = saude([
  integracao({}),
  integracao({ chave: 'RABBITMQ', nome: 'RabbitMQ' }),
  integracao({ chave: 'HG_BRASIL', nome: 'HG Brasil', simulado: true }),
]);

describe('DashboardAdminComponent', () => {
  let fixture: ComponentFixture<DashboardAdminComponent>;
  let service: jasmine.SpyObj<DashboardAdminService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<DashboardAdminService>('DashboardAdminService', [
      'obterMetricas',
      'obterIntegracoes',
      'verificarIntegracoes',
      'verificarIntegracao',
    ]);
    service.obterMetricas.and.returnValue(of(criarMetricas()));
    service.obterIntegracoes.and.returnValue(of(TUDO_OK));

    await TestBed.configureTestingModule({
      imports: [DashboardAdminComponent],
      providers: [{ provide: DashboardAdminService, useValue: service }],
    }).compileComponents();
  });

  function iniciar(): HTMLElement {
    fixture = TestBed.createComponent(DashboardAdminComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function texto(elemento: Element | null): string {
    return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  it('deve mostrar o total de usuários com a variação dos últimos 30 dias', fakeAsync(() => {
    const el = iniciar();

    const card = texto(el.querySelector('[data-teste="card-usuarios"]'));
    expect(card).toContain('1.284');
    expect(card).toContain('+96');
    expect(card).toContain('(8,1%)');
    fixture.destroy();
  }));

  it('sem cadastros novos deve mostrar a mensagem neutra, sem variação', fakeAsync(() => {
    service.obterMetricas.and.returnValue(of(criarMetricas({ novosUsuariosUltimos30Dias: 0 })));

    const el = iniciar();

    const card = texto(el.querySelector('[data-teste="card-usuarios"]'));
    expect(card).toContain('Sem novos cadastros');
    expect(el.querySelector('.painel-gestor__variacao--positiva')).toBeNull();
    fixture.destroy();
  }));

  it('quando todos os usuários são novos não deve calcular percentual de variação', fakeAsync(() => {
    service.obterMetricas.and.returnValue(of(criarMetricas({ totalUsuarios: 5, novosUsuariosUltimos30Dias: 5 })));

    const el = iniciar();

    const card = texto(el.querySelector('[data-teste="card-usuarios"]'));
    expect(card).toContain('+5');
    expect(card).not.toContain('%');
    fixture.destroy();
  }));

  it('deve mostrar os perfis concluídos com a barra de progresso proporcional', fakeAsync(() => {
    const el = iniciar();

    const barra = el.querySelector('[role="progressbar"]') as HTMLElement;
    const preenchido = el.querySelector('.painel-gestor__progresso-preenchido') as HTMLElement;
    expect(texto(el.querySelector('[data-teste="card-perfis"]'))).toContain('71% responderam o quiz');
    expect(barra.getAttribute('aria-valuenow')).toBe('71');
    expect(preenchido.style.width).toBe('71%');
    fixture.destroy();
  }));

  it('sem usuários o progresso deve ser zero', fakeAsync(() => {
    service.obterMetricas.and.returnValue(
      of(criarMetricas({ totalUsuarios: 0, usuariosComPerfilPreenchido: 0, novosUsuariosUltimos30Dias: 0 })),
    );

    const el = iniciar();

    expect((el.querySelector('[role="progressbar"]') as HTMLElement).getAttribute('aria-valuenow')).toBe('0');
    fixture.destroy();
  }));

  it('o card de integrações deve resumir que está tudo operando e quantas estão simuladas', fakeAsync(() => {
    const el = iniciar();

    const card = el.querySelector('[data-teste="card-integracoes"]');
    expect(texto(card)).toContain('Tudo operando');
    expect(texto(card)).toContain('3 de 3 sem problemas');
    expect(texto(card)).toContain('1 em modo simulado');
    expect(card?.querySelector('.painel-gestor__pulso--online')).toBeTruthy();
    expect(el.querySelector('app-saude-integracoes li')).not.toBeNull();
    fixture.destroy();
  }));

  it('deve consultar as integrações de novo a cada intervalo e refletir a mudança', fakeAsync(() => {
    const el = iniciar();
    expect(service.obterIntegracoes).toHaveBeenCalledTimes(1);

    service.obterIntegracoes.and.returnValue(of(saude([
      integracao({ situacao: 'FORA_DO_AR' }),
      integracao({ chave: 'BANCO_CENTRAL', nome: 'Banco Central', situacao: 'DESATUALIZADA' }),
      integracao({ chave: 'RABBITMQ', nome: 'RabbitMQ', situacao: 'DESCONHECIDA' }),
    ])));
    tick(INTERVALO_INTEGRACOES_MS);
    fixture.detectChanges();

    const card = el.querySelector('[data-teste="card-integracoes"]');
    expect(service.obterIntegracoes).toHaveBeenCalledTimes(2);
    expect(texto(card)).toContain('2 com problema');
    expect(card?.querySelector('.painel-gestor__pulso--offline')).toBeTruthy();
    fixture.destroy();
  }));

  it('só integração desatualizada deve deixar o indicador em alerta, não em erro', fakeAsync(() => {
    service.obterIntegracoes.and.returnValue(of(saude([
      integracao({}),
      integracao({ chave: 'TESOURO_DIRETO', nome: 'Tesouro Direto', situacao: 'DESATUALIZADA' }),
    ])));

    const el = iniciar();

    const card = el.querySelector('[data-teste="card-integracoes"]');
    expect(card?.querySelector('.painel-gestor__pulso--alerta')).toBeTruthy();
    expect(card?.querySelector('.painel-gestor__pulso--offline')).toBeNull();
    fixture.destroy();
  }));

  it('falha na consulta deve avisar, manter a última verificação e continuar consultando', fakeAsync(() => {
    service.obterIntegracoes.and.returnValue(throwError(() => new Error('falha de rede')));
    const el = iniciar();
    expect(texto(el.querySelector('[data-teste="card-integracoes"]'))).toContain('Sem resposta');

    service.obterIntegracoes.and.returnValue(of(TUDO_OK));
    tick(INTERVALO_INTEGRACOES_MS);
    fixture.detectChanges();
    expect(texto(el.querySelector('[data-teste="card-integracoes"]'))).toContain('Tudo operando');

    service.obterIntegracoes.and.returnValue(throwError(() => new Error('falha de rede')));
    tick(INTERVALO_INTEGRACOES_MS);
    fixture.detectChanges();
    expect(texto(el.querySelector('app-saude-integracoes'))).toContain('mostrando a última verificação');
    expect(el.querySelectorAll('app-saude-integracoes li').length).toBe(3);
    expect(el.querySelector('[data-teste="card-integracoes"] .painel-gestor__pulso--offline')).toBeTruthy();
    fixture.destroy();
  }));

  it('as integrações devem aparecer mesmo quando as métricas do painel falham', fakeAsync(() => {
    service.obterMetricas.and.returnValue(throwError(() => new Error('falha')));

    const el = iniciar();

    expect(el.querySelector('app-erro-servidor')).not.toBeNull();
    expect(el.querySelectorAll('app-saude-integracoes li').length).toBe(3);
    fixture.destroy();
  }));

  it('"Ver detalhes" deve levar o foco para a seção de integrações', fakeAsync(() => {
    const el = iniciar();
    const secao = el.querySelector<HTMLElement>('#saude-integracoes')!;
    const rolagem = spyOn(secao, 'scrollIntoView');

    el.querySelector<HTMLAnchorElement>('[data-teste="card-integracoes"] a')!.click();

    expect(rolagem).toHaveBeenCalled();
    expect(document.activeElement).toBe(secao);
    fixture.destroy();
  }));

  it('ao destruir o componente deve parar de consultar as integrações', fakeAsync(() => {
    iniciar();
    fixture.destroy();

    tick(INTERVALO_INTEGRACOES_MS * 3);

    expect(service.obterIntegracoes).toHaveBeenCalledTimes(1);
  }));

  it('deve desenhar a distribuição de risco no gráfico de rosca', fakeAsync(() => {
    const el = iniciar();

    const legenda = texto(el.querySelector('app-donut-chart'));
    expect(legenda).toContain('Conservador');
    expect(legenda).toContain('44%');
    expect(legenda).toContain('Moderado');
    expect(legenda).toContain('Arrojado');
    fixture.destroy();
  }));

  it('sem nenhum perfil concluído deve mostrar estado vazio no lugar do gráfico', fakeAsync(() => {
    service.obterMetricas.and.returnValue(
      of(criarMetricas({ distribuicaoRisco: { CONSERVADOR: 0, MODERADO: 0, ARROJADO: 0 } })),
    );

    const el = iniciar();

    expect(el.querySelector('app-donut-chart')).toBeNull();
    expect(texto(el)).toContain('Nenhum usuário concluiu o quiz de perfil ainda.');
    fixture.destroy();
  }));

  it('deve listar as sete categorias de ativos com contagem e total', fakeAsync(() => {
    const el = iniciar();

    const linhas = Array.from(el.querySelectorAll('.painel-gestor__categoria')).map(
      (linha) =>
        `${texto(linha.querySelector('.painel-gestor__categoria-rotulo'))} ${texto(linha.querySelector('.painel-gestor__categoria-valor'))}`,
    );
    expect(linhas).toEqual([
      'Ações 42',
      'FIIs 18',
      'ETFs 9',
      'Tesouro Direto 23',
      'CDBs 12',
      'LCIs 5',
      'LCAs 4',
    ]);
    expect(texto(el)).toContain('113 ativos');
    const barras = el.querySelectorAll<HTMLElement>('.painel-gestor__categoria-barra');
    expect(barras[0].style.width).toBe('100%');
    expect(barras[3].classList).toContain('painel-gestor__categoria-barra--rf');
    fixture.destroy();
  }));

  it('deve listar os títulos vencendo com prazo e urgência colorida', fakeAsync(() => {
    const el = iniciar();

    const alertas = el.querySelectorAll('.painel-gestor__alerta');
    expect(alertas.length).toBe(3);
    expect(texto(alertas[0])).toContain('Banco Alfa');
    expect(texto(alertas[0])).toContain('Vence em 3 dias');
    expect(texto(alertas[0])).toContain('Urgente');
    expect(alertas[0].classList).toContain('painel-gestor__alerta--alta');
    expect(texto(alertas[1])).toContain('Atenção');
    expect(alertas[1].classList).toContain('painel-gestor__alerta--media');
    expect(texto(alertas[2])).toContain('No prazo');
    expect(alertas[2].classList).toContain('painel-gestor__alerta--baixa');
    fixture.destroy();
  }));

  it('deve escrever "hoje" e "amanhã" nos prazos de zero e um dia', fakeAsync(() => {
    service.obterMetricas.and.returnValue(
      of(
        criarMetricas({
          titulosVencendo: [
            { id: 'a', tipo: 'CDB', emissor: 'Banco Alfa', vencimento: '2026-10-05', diasParaVencimento: 0, urgencia: 'ALTA' },
            { id: 'b', tipo: 'CDB', emissor: 'Banco Beta', vencimento: '2026-10-06', diasParaVencimento: 1, urgencia: 'ALTA' },
          ],
        }),
      ),
    );

    const el = iniciar();

    const alertas = el.querySelectorAll('.painel-gestor__alerta');
    expect(texto(alertas[0])).toContain('Vence hoje');
    expect(texto(alertas[1])).toContain('Vence amanhã');
    fixture.destroy();
  }));

  it('sem títulos vencendo deve mostrar estado vazio', fakeAsync(() => {
    service.obterMetricas.and.returnValue(of(criarMetricas({ titulosVencendo: [], titulosVencendoEm30Dias: 0 })));

    const el = iniciar();

    expect(el.querySelector('.painel-gestor__alerta')).toBeNull();
    expect(texto(el)).toContain('Nenhum título privado vence nos próximos 30 dias.');
    fixture.destroy();
  }));

  it('sem sincronização do Tesouro deve avisar que ainda não sincronizou', fakeAsync(() => {
    service.obterMetricas.and.returnValue(of(criarMetricas({ ultimaSincronizacaoTesouro: null })));

    const el = iniciar();

    expect(texto(el)).toContain('Tesouro Direto ainda não sincronizado');
    fixture.destroy();
  }));

  it('falha ao carregar as métricas deve mostrar erro, e tentar novamente deve recarregar', fakeAsync(() => {
    service.obterMetricas.and.returnValue(throwError(() => new Error('500')));

    const el = iniciar();

    expect(el.querySelector('app-erro-servidor')).toBeTruthy();
    expect(el.querySelector('[data-teste="card-usuarios"]')).toBeNull();

    service.obterMetricas.and.returnValue(of(criarMetricas()));
    (el.querySelector('app-erro-servidor app-button button') as HTMLButtonElement).click();
    tick();
    fixture.detectChanges();

    expect(service.obterMetricas).toHaveBeenCalledTimes(2);
    expect(el.querySelector('app-erro-servidor')).toBeNull();
    expect(el.querySelector('[data-teste="card-usuarios"]')).toBeTruthy();
    fixture.destroy();
  }));

  it('deve atualizar as integrações sozinho a cada 5 minutos', fakeAsync(() => {
    iniciar();
    expect(INTERVALO_INTEGRACOES_MS).toBe(300_000);

    tick(299_000);
    expect(service.obterIntegracoes).toHaveBeenCalledTimes(1);

    tick(1_000);
    expect(service.obterIntegracoes).toHaveBeenCalledTimes(2);
    expect(texto(fixture.nativeElement.querySelector('.saude__verificacao'))).toContain('a cada 5 minutos');
    fixture.destroy();
  }));

  it('verificar uma integração deve atualizar só ela na lista e no card', fakeAsync(() => {
    const resposta = new Subject<StatusIntegracao>();
    service.verificarIntegracao.and.returnValue(resposta);
    const el = iniciar();

    el.querySelector<HTMLButtonElement>('[data-chave="RABBITMQ"] [data-teste="verificar-integracao"]')!.click();
    fixture.detectChanges();

    expect(service.verificarIntegracao).toHaveBeenCalledOnceWith('RABBITMQ');
    expect(el.querySelector<HTMLButtonElement>('[data-chave="RABBITMQ"] [data-teste="verificar-integracao"]')!.disabled).toBeTrue();

    resposta.next(integracao({ chave: 'RABBITMQ', nome: 'RabbitMQ', situacao: 'FORA_DO_AR', detalhe: 'Sem conexão.' }));
    resposta.complete();
    fixture.detectChanges();

    expect(texto(el.querySelector('[data-chave="RABBITMQ"]'))).toContain('Fora do ar');
    expect(texto(el.querySelector('[data-chave="MICROSSERVICO_IA"]'))).toContain('Operacional');
    expect(el.querySelectorAll('app-saude-integracoes li').length).toBe(3);
    expect(texto(el.querySelector('[data-teste="card-integracoes"]'))).toContain('1 com problema');
    expect(el.querySelector<HTMLButtonElement>('[data-chave="RABBITMQ"] [data-teste="verificar-integracao"]')!.disabled).toBeFalse();
    fixture.destroy();
  }));

  it('falha ao verificar uma integração deve avisar e manter o estado anterior', fakeAsync(() => {
    service.verificarIntegracao.and.returnValue(throwError(() => new Error('falha de rede')));
    const el = iniciar();

    el.querySelector<HTMLButtonElement>('[data-chave="HG_BRASIL"] [data-teste="verificar-integracao"]')!.click();
    fixture.detectChanges();

    expect(texto(el.querySelector('app-saude-integracoes [role="alert"]'))).toContain('Não conseguimos verificar HG Brasil agora');
    expect(texto(el.querySelector('[data-chave="HG_BRASIL"]'))).toContain('Operacional');
    expect(el.querySelector<HTMLButtonElement>('[data-chave="HG_BRASIL"] [data-teste="verificar-integracao"]')!.disabled).toBeFalse();
    fixture.destroy();
  }));

  it('verificar todas deve trocar a lista inteira e reiniciar a contagem dos 5 minutos', fakeAsync(() => {
    service.verificarIntegracoes.and.returnValue(of(saude([
      integracao({}),
      integracao({ chave: 'LLM', nome: 'LLM (Groq)', situacao: 'FORA_DO_AR' }),
    ])));
    const el = iniciar();

    tick(200_000);
    el.querySelector<HTMLButtonElement>('[data-teste="verificar-todas"]')!.click();
    fixture.detectChanges();

    expect(service.verificarIntegracoes).toHaveBeenCalledTimes(1);
    expect(el.querySelectorAll('app-saude-integracoes li').length).toBe(2);
    expect(texto(el.querySelector('[data-teste="card-integracoes"]'))).toContain('1 com problema');

    tick(100_000);
    expect(service.obterIntegracoes).toHaveBeenCalledTimes(1);

    tick(200_000);
    expect(service.obterIntegracoes).toHaveBeenCalledTimes(2);
    fixture.destroy();
  }));

  it('verificar todas depois de uma falha na consulta deve tirar o aviso de falha', fakeAsync(() => {
    service.obterIntegracoes.and.returnValue(throwError(() => new Error('falha de rede')));
    service.verificarIntegracoes.and.returnValue(of(TUDO_OK));
    const el = iniciar();
    expect(texto(el.querySelector('app-saude-integracoes'))).toContain('Não conseguimos atualizar agora');

    el.querySelector<HTMLButtonElement>('[data-teste="verificar-todas"]')!.click();
    fixture.detectChanges();

    expect(texto(el.querySelector('app-saude-integracoes'))).not.toContain('Não conseguimos atualizar agora');
    expect(el.querySelectorAll('app-saude-integracoes li').length).toBe(3);
    fixture.destroy();
  }));

  it('falha ao verificar todas deve avisar e liberar o botão de novo', fakeAsync(() => {
    service.verificarIntegracoes.and.returnValue(throwError(() => new Error('falha de rede')));
    const el = iniciar();

    el.querySelector<HTMLButtonElement>('[data-teste="verificar-todas"]')!.click();
    fixture.detectChanges();

    expect(texto(el.querySelector('app-saude-integracoes [role="alert"]'))).toContain('Não conseguimos verificar as integrações agora');
    expect(el.querySelector<HTMLButtonElement>('[data-teste="verificar-todas"]')!.disabled).toBeFalse();
    fixture.destroy();
  }));
});
