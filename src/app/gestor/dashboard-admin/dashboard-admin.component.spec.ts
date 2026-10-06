import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DashboardAdminComponent, INTERVALO_STATUS_IA_MS } from './dashboard-admin.component';
import { DashboardAdminService } from '../../shared/services/dashboard-admin.service';
import { DashboardAdminResponse, StatusIa } from '../../shared/models/dashboard-admin';

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

const STATUS_ONLINE: StatusIa = { disponivel: true, rabbitmqConectado: true, verificadoEm: '2026-10-05T11:40:00' };

describe('DashboardAdminComponent', () => {
  let fixture: ComponentFixture<DashboardAdminComponent>;
  let service: jasmine.SpyObj<DashboardAdminService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<DashboardAdminService>('DashboardAdminService', ['obterMetricas', 'obterStatusIa']);
    service.obterMetricas.and.returnValue(of(criarMetricas()));
    service.obterStatusIa.and.returnValue(of(STATUS_ONLINE));

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

  it('deve mostrar o status da IA como Online com o indicador correspondente', fakeAsync(() => {
    const el = iniciar();

    const card = el.querySelector('[data-teste="card-ia"]');
    expect(texto(card)).toContain('Online');
    expect(texto(card)).toContain('RabbitMQ conectado');
    expect(card?.querySelector('.painel-gestor__pulso--online')).toBeTruthy();
    fixture.destroy();
  }));

  it('deve consultar o status da IA de novo a cada intervalo e refletir a mudança', fakeAsync(() => {
    const el = iniciar();
    expect(service.obterStatusIa).toHaveBeenCalledTimes(1);

    service.obterStatusIa.and.returnValue(
      of({ disponivel: false, rabbitmqConectado: false, verificadoEm: '2026-10-05T11:41:00' }),
    );
    tick(INTERVALO_STATUS_IA_MS);
    fixture.detectChanges();

    const card = el.querySelector('[data-teste="card-ia"]');
    expect(service.obterStatusIa).toHaveBeenCalledTimes(2);
    expect(texto(card)).toContain('Offline');
    expect(texto(card)).toContain('RabbitMQ desconectado');
    expect(card?.querySelector('.painel-gestor__pulso--offline')).toBeTruthy();
    fixture.destroy();
  }));

  it('falha na consulta do status deve mostrar Offline e continuar consultando', fakeAsync(() => {
    service.obterStatusIa.and.returnValue(throwError(() => new Error('falha de rede')));

    const el = iniciar();

    const card = el.querySelector('[data-teste="card-ia"]');
    expect(texto(card)).toContain('Offline');
    expect(texto(card)).toContain('RabbitMQ sem informação');

    service.obterStatusIa.and.returnValue(of(STATUS_ONLINE));
    tick(INTERVALO_STATUS_IA_MS);
    fixture.detectChanges();

    expect(texto(card)).toContain('Online');
    fixture.destroy();
  }));

  it('ao destruir o componente deve parar de consultar o status da IA', fakeAsync(() => {
    iniciar();
    fixture.destroy();

    tick(INTERVALO_STATUS_IA_MS * 3);

    expect(service.obterStatusIa).toHaveBeenCalledTimes(1);
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
});
