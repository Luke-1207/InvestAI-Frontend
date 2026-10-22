import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { IndicadoresComponent, situacaoSincronizacao } from './indicadores.component';
import { DashboardService } from '../../shared/services/dashboard.service';
import { GestaoIndicadoresService } from '../../shared/services/gestao-indicadores.service';
import { ToastService } from '../../shared/services/toast.service';
import { DashboardResponse, IndicadoresMercado } from '../../shared/models/dashboard';

function indicadores(parcial: Partial<IndicadoresMercado> = {}): IndicadoresMercado {
  return {
    ibovespaPontos: 131245, ibovespaVariacaoDia: 0.5, dolarValor: 5.42, dolarVariacaoDia: 0.1, euroValor: 5.91,
    euroVariacaoDia: 0.2, selicAtual: 15, ipcaAcumulado12m: 4.8, sincronizadoEm: new Date().toISOString(),
    selicIpcaSincronizadoEm: new Date(Date.now() - 2 * 3_600_000).toISOString(), ...parcial,
  };
}

describe('situacaoSincronizacao', () => {
  const agora = new Date('2026-10-20T20:00:00');

  it('deve indicar se a última atualização está em dia, atrasada ou se nunca houve uma', () => {
    expect(situacaoSincronizacao(null, agora)).toBe('sem-dados');
    expect(situacaoSincronizacao('2026-10-20T07:00:00', agora)).toBe('em-dia');
    expect(situacaoSincronizacao('2026-10-19T07:00:00', agora)).toBe('atrasada');
  });
});

describe('IndicadoresComponent', () => {
  let fixture: ComponentFixture<IndicadoresComponent>;
  let dashboard: DashboardService;
  let service: jasmine.SpyObj<GestaoIndicadoresService>;
  let toast: ToastService;

  async function montar(atuais: IndicadoresMercado | null = indicadores()) {
    service = jasmine.createSpyObj<GestaoIndicadoresService>('GestaoIndicadoresService', ['atualizarSelicIpca']);
    await TestBed.configureTestingModule({
      imports: [IndicadoresComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: GestaoIndicadoresService, useValue: service }],
    }).compileComponents();
    dashboard = TestBed.inject(DashboardService);
    toast = TestBed.inject(ToastService);
    if (atuais) dashboard.dashboard.set({ indicadoresMercado: atuais } as DashboardResponse);
    fixture = TestBed.createComponent(IndicadoresComponent);
  }

  afterEach(() => document.querySelectorAll('dialog[open]').forEach((d) => (d as HTMLDialogElement).close()));

  const campo = (id: string): HTMLInputElement => fixture.nativeElement.querySelector('#' + id);
  const el = (seletor: string): HTMLElement => fixture.nativeElement.querySelector(seletor);

  function preencher(id: string, valor: string): void {
    campo(id).value = valor;
    campo(id).dispatchEvent(new Event('input'));
    campo(id).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function enviar(): void {
    el('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('deve preencher com os valores atuais e dizer que a atualização está em dia', async () => {
    await montar();
    fixture.detectChanges();

    expect(campo('indicador-selic').value).toBe('15');
    expect(campo('indicador-ipca').value).toBe('4.8');
    expect(el('.indicadores__situacao').textContent).toContain('Atualização em dia');
    expect(el('.indicadores__situacao').textContent).toContain('Selic de 15,00%');
    expect(el('.indicadores__situacao').getAttribute('role')).toBeNull();
  });

  it('atualização atrasada deve aparecer como alerta', async () => {
    await montar(indicadores({ selicIpcaSincronizadoEm: new Date(Date.now() - 48 * 3_600_000).toISOString() }));
    fixture.detectChanges();

    expect(el('.indicadores__situacao').classList).toContain('indicadores__situacao--alerta');
    expect(el('.indicadores__situacao').textContent).toContain('parece ter falhado');
    expect(el('.indicadores__situacao').getAttribute('role')).toBe('status');
  });

  it('sem dashboard em memória deve carregar os indicadores', async () => {
    await montar(null);
    const carregar = spyOn(dashboard, 'carregar').and.returnValue(of({ indicadoresMercado: indicadores({ selicAtual: 14.25 }) } as DashboardResponse));
    fixture.detectChanges();

    expect(carregar).toHaveBeenCalled();
    expect(campo('indicador-selic').value).toBe('14.25');
  });

  it('se não conseguir carregar deve mostrar o erro', async () => {
    await montar(null);
    spyOn(dashboard, 'carregar').and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    fixture.detectChanges();

    expect(el('app-erro-servidor')).not.toBeNull();
  });

  it('deve validar como a API: Selic positiva e IPCA obrigatório, podendo ser negativo', async () => {
    await montar();
    fixture.detectChanges();

    preencher('indicador-selic', '0');
    expect(el('#indicador-selic-ajuda-erro').textContent).toContain('A Selic precisa ser maior que zero.');
    preencher('indicador-selic', '');
    expect(el('#indicador-selic-ajuda-erro').textContent).toContain('Informe a Selic atual.');
    preencher('indicador-ipca', '');
    expect(el('#indicador-ipca-ajuda-erro').textContent).toContain('Informe o IPCA acumulado em 12 meses.');
    preencher('indicador-ipca', '-0.4');
    expect(el('#indicador-ipca-ajuda-erro')).toBeNull();
  });

  it('deve mostrar o CDI estimado e avisar de valores fora do comum sem bloquear', async () => {
    await montar();
    fixture.detectChanges();

    preencher('indicador-selic', '14.25');
    expect(el('#indicador-selic-ajuda').textContent).toContain('14,15%');

    preencher('indicador-selic', '45');
    expect(el('#indicador-selic-ajuda-aviso').textContent).toContain('acima do comum');
    expect(campo('indicador-selic').getAttribute('aria-describedby')).toBe('indicador-selic-ajuda indicador-selic-ajuda-aviso');
    preencher('indicador-ipca', '35');
    expect(el('#indicador-ipca-ajuda-aviso')).not.toBeNull();
  });

  it('valores iguais aos atuais não devem gerar uma gravação', async () => {
    await montar();
    fixture.detectChanges();

    enviar();

    expect(el('[role="status"].campo__ajuda').textContent).toContain('Nada para salvar');
    expect(el('dialog').hasAttribute('open')).toBeFalse();
  });

  it('salvar deve mostrar antes e depois, gravar e avisar', async () => {
    await montar();
    fixture.detectChanges();
    service.atualizarSelicIpca.and.returnValue(of(indicadores({ selicAtual: 14.25, ipcaAcumulado12m: 4.6 })));
    const sucesso = spyOn(toast, 'sucesso');

    preencher('indicador-selic', '14.25');
    preencher('indicador-ipca', '4.6');
    enviar();

    const dialogo = el('dialog') as HTMLDialogElement;
    expect(dialogo.open).toBeTrue();
    expect(dialogo.textContent).toContain('15,00% para');
    expect(dialogo.textContent).toContain('14,25%');
    expect(dialogo.textContent).toContain('4,80% para');
    expect(service.atualizarSelicIpca).not.toHaveBeenCalled();

    dialogo.querySelector<HTMLButtonElement>('.dialogo__confirmar')!.click();
    fixture.detectChanges();

    expect(service.atualizarSelicIpca).toHaveBeenCalledOnceWith({ selicAtual: 14.25, ipcaAcumulado12m: 4.6 });
    expect(dialogo.open).toBeFalse();
    expect(sucesso).toHaveBeenCalledWith(jasmine.stringContaining('Selic e IPCA atualizados'));
  });

  it('erro de validação da API deve aparecer no campo', async () => {
    await montar();
    fixture.detectChanges();
    service.atualizarSelicIpca.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { detalhes: { selicAtual: 'Selic atual deve ser positiva' } } })),
    );

    preencher('indicador-selic', '13');
    enviar();
    el('dialog').querySelector<HTMLButtonElement>('.dialogo__confirmar')!.click();
    fixture.detectChanges();

    expect(el('#indicador-selic-ajuda-erro').textContent).toContain('Selic atual deve ser positiva');
  });

  it('falha inesperada deve mostrar um aviso geral', async () => {
    await montar();
    fixture.detectChanges();
    service.atualizarSelicIpca.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));

    preencher('indicador-selic', '13');
    enviar();
    el('dialog').querySelector<HTMLButtonElement>('.dialogo__confirmar')!.click();
    fixture.detectChanges();

    expect(el('.formulario__erro-geral').textContent).toContain('Não foi possível salvar agora');
  });
});
