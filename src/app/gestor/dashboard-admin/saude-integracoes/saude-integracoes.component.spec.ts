import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaudeIntegracoesComponent } from './saude-integracoes.component';
import { SaudeIntegracoes, StatusIntegracao } from '../../../shared/models/dashboard-admin';

function integracao(parcial: Partial<StatusIntegracao>): StatusIntegracao {
  return {
    chave: 'MICROSSERVICO_IA', nome: 'Microsserviço de IA', situacao: 'OPERACIONAL', simulado: false,
    detalhe: 'Respondendo normalmente.', ultimoSucessoEm: null, ultimaFalhaEm: null, ultimoErro: null, ...parcial,
  };
}

const umaHoraAtras = new Date(Date.now() - 3_600_000).toISOString();
const doisDiasAtras = new Date(Date.now() - 2 * 86_400_000).toISOString();

const SAUDE: SaudeIntegracoes = {
  verificadoEm: '2026-10-21T19:00:00',
  integracoes: [
    integracao({ ultimoSucessoEm: umaHoraAtras }),
    integracao({ chave: 'LLM', nome: 'LLM (Groq)', situacao: 'FORA_DO_AR', detalhe: 'O provedor recusou a chave de API',
      ultimoSucessoEm: doisDiasAtras, ultimaFalhaEm: umaHoraAtras, ultimoErro: 'O provedor recusou a chave de API' }),
    integracao({ chave: 'HG_BRASIL', nome: 'HG Brasil', simulado: true, detalhe: 'Rodando em modo simulado: os dados não vêm da fonte real.' }),
    integracao({ chave: 'BANCO_CENTRAL', nome: 'Banco Central', situacao: 'DESATUALIZADA', ultimoSucessoEm: doisDiasAtras,
      ultimaFalhaEm: umaHoraAtras, ultimoErro: 'Falha ao consultar a série 432: timeout' }),
    integracao({ chave: 'TESOURO_DIRETO', nome: 'Tesouro Direto', situacao: 'SEM_DADOS' }),
    integracao({ chave: 'RABBITMQ', nome: 'RabbitMQ', situacao: 'DESCONHECIDA' }),
  ],
};

describe('SaudeIntegracoesComponent', () => {
  let fixture: ComponentFixture<SaudeIntegracoesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SaudeIntegracoesComponent] }).compileComponents();
    fixture = TestBed.createComponent(SaudeIntegracoesComponent);
  });

  function montar(saude: SaudeIntegracoes | null, falhaConsulta = false): HTMLElement {
    fixture.componentRef.setInput('saude', saude);
    fixture.componentRef.setInput('falhaConsulta', falhaConsulta);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const item = (el: HTMLElement, chave: string): HTMLElement => el.querySelector(`[data-chave="${chave}"]`)!;
  const texto = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

  it('deve listar cada integração com nome, situação e detalhe', () => {
    const el = montar(SAUDE);

    expect(el.querySelectorAll('li').length).toBe(6);
    expect(texto(item(el, 'MICROSSERVICO_IA'))).toContain('Operacional');
    expect(texto(item(el, 'LLM'))).toContain('Fora do ar');
    expect(texto(item(el, 'BANCO_CENTRAL'))).toContain('Desatualizada');
    expect(texto(item(el, 'TESOURO_DIRETO'))).toContain('Sem dados ainda');
    expect(texto(item(el, 'RABBITMQ'))).toContain('Sem como verificar');
    expect(item(el, 'LLM').querySelector('h3')!.textContent).toContain('LLM (Groq)');
  });

  it('deve marcar as integrações em modo simulado', () => {
    const el = montar(SAUDE);

    expect(texto(item(el, 'HG_BRASIL'))).toContain('Simulado');
    expect(item(el, 'MICROSSERVICO_IA').querySelector('.saude__simulado')).toBeNull();
  });

  it('deve mostrar a data e há quanto tempo foi o último sucesso, e a última falha com o motivo', () => {
    const el = montar(SAUDE);

    expect(texto(item(el, 'MICROSSERVICO_IA'))).toContain('há 1 hora');
    expect(texto(item(el, 'LLM'))).toContain('há 2 dias');
    expect(texto(item(el, 'BANCO_CENTRAL').querySelector('.saude__erro'))).toBe('Falha ao consultar a série 432: timeout');
    expect(texto(item(el, 'LLM'))).toContain('Última falha');
    expect(item(el, 'LLM').querySelector('.saude__erro')).toBeNull();
    expect(texto(item(el, 'TESOURO_DIRETO'))).toContain('Nenhum registrado');
    expect(texto(item(el, 'TESOURO_DIRETO'))).not.toContain('Última falha');
  });

  it('as cores devem seguir a situação', () => {
    const el = montar(SAUDE);

    expect(item(el, 'MICROSSERVICO_IA').querySelector('.saude__situacao--ok')).not.toBeNull();
    expect(item(el, 'LLM').querySelector('.saude__situacao--erro')).not.toBeNull();
    expect(item(el, 'BANCO_CENTRAL').querySelector('.saude__situacao--alerta')).not.toBeNull();
    expect(item(el, 'RABBITMQ').querySelector('.saude__situacao--neutro')).not.toBeNull();
  });

  it('o leitor de tela deve ouvir um resumo, que só muda quando a situação muda', () => {
    const el = montar(SAUDE);
    const status = el.querySelector('[role="status"]')!;
    expect(texto(status)).toBe('2 integrações com problema: LLM (Groq), Banco Central.');

    montar({ ...SAUDE, integracoes: [integracao({})] });
    expect(texto(status)).toBe('Todas as integrações estão operando.');

    montar({ ...SAUDE, integracoes: [integracao({ situacao: 'FORA_DO_AR' })] });
    expect(texto(status)).toBe('1 integração com problema: Microsserviço de IA.');
  });

  it('deve dizer de quanto em quanto tempo atualiza e quando foi a última verificação', () => {
    fixture.componentRef.setInput('intervaloSegundos', 300);
    const el = montar(SAUDE);

    expect(texto(el.querySelector('.saude__verificacao'))).toContain('a cada 5 minutos');
    expect(texto(el.querySelector('.saude__verificacao'))).toContain('19:00:00');

    fixture.componentRef.setInput('intervaloSegundos', 30);
    fixture.detectChanges();
    expect(texto(el.querySelector('.saude__verificacao'))).toContain('a cada 30 segundos');
  });

  it('antes da primeira resposta deve mostrar que está verificando', () => {
    const el = montar(null);

    expect(texto(el)).toContain('Verificando as integrações...');
    expect(el.querySelectorAll('li').length).toBe(0);
  });

  it('se a consulta falhar deve avisar, mantendo a última verificação quando houver', () => {
    let el = montar(null, true);
    expect(texto(el.querySelector('.saude__aviso'))).toContain('Não conseguimos atualizar agora. Use "Verificar todas"');

    el = montar(SAUDE, true);
    expect(texto(el.querySelector('.saude__aviso'))).toContain('mostrando a última verificação');
    expect(el.querySelectorAll('li').length).toBe(6);
  });

  const botaoDe = (el: HTMLElement, chave: string): HTMLButtonElement =>
    item(el, chave).querySelector<HTMLButtonElement>('[data-teste="verificar-integracao"]')!;
  const botaoTodas = (el: HTMLElement): HTMLButtonElement => el.querySelector<HTMLButtonElement>('[data-teste="verificar-todas"]')!;

  it('cada integração deve ter um botão próprio, com nome acessível, que pede a verificação dela', () => {
    const el = montar(SAUDE);
    const pedidas: string[] = [];
    fixture.componentInstance.verificar.subscribe((chave) => pedidas.push(chave));

    expect(el.querySelectorAll('[data-teste="verificar-integracao"]').length).toBe(6);
    expect(botaoDe(el, 'LLM').getAttribute('aria-label')).toBe('Verificar LLM (Groq) agora');

    botaoDe(el, 'LLM').click();
    botaoDe(el, 'BANCO_CENTRAL').click();

    expect(pedidas).toEqual(['LLM', 'BANCO_CENTRAL']);
  });

  it('o botão geral deve pedir a verificação de todas', () => {
    const el = montar(SAUDE);
    let pedidos = 0;
    fixture.componentInstance.verificarTodas.subscribe(() => pedidos++);

    expect(texto(botaoTodas(el))).toBe('refresh Verificar todas');
    botaoTodas(el).click();

    expect(pedidos).toBe(1);
  });

  it('enquanto uma integração é verificada só o botão dela fica ocupado', () => {
    fixture.componentRef.setInput('verificando', new Set(['LLM']));
    const el = montar(SAUDE);

    expect(botaoDe(el, 'LLM').disabled).toBeTrue();
    expect(botaoDe(el, 'LLM').getAttribute('aria-busy')).toBe('true');
    expect(botaoDe(el, 'LLM').querySelector('.saude__girando')).not.toBeNull();
    expect(botaoDe(el, 'HG_BRASIL').disabled).toBeFalse();
    expect(botaoTodas(el).disabled).toBeFalse();
  });

  it('verificando todas deve ocupar o botão geral e os individuais', () => {
    fixture.componentRef.setInput('verificandoTodas', true);
    const el = montar(SAUDE);

    expect(texto(botaoTodas(el))).toContain('Verificando...');
    expect(botaoTodas(el).disabled).toBeTrue();
    expect(Array.from(el.querySelectorAll<HTMLButtonElement>('[data-teste="verificar-integracao"]')).every((b) => b.disabled)).toBeTrue();
  });

  it('o botão geral deve aparecer mesmo sem nenhuma verificação ainda, para tentar de novo', () => {
    const el = montar(null, true);

    expect(botaoTodas(el)).not.toBeNull();
    expect(botaoTodas(el).disabled).toBeFalse();
  });

  it('deve mostrar o aviso de falha da verificação manual como alerta', () => {
    fixture.componentRef.setInput('aviso', 'Não conseguimos verificar LLM (Groq) agora. Tente de novo em instantes.');
    const el = montar(SAUDE);

    const alerta = el.querySelector('[role="alert"]');
    expect(texto(alerta)).toContain('Não conseguimos verificar LLM (Groq) agora');
  });
});
