import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { PreferenciasPerfilComponent } from './preferencias-perfil.component';
import { PerfilService } from '../../shared/services/perfil.service';
import { ToastService } from '../../shared/services/toast.service';
import { EditarPerfilRequest, PerfilResponse } from '../../shared/models/perfil';

function perfilMock(overrides: Partial<PerfilResponse> = {}): PerfilResponse {
  return {
    perfilRisco: { valor: 'MODERADO', descricao: 'Você é um investidor moderado.' },
    objetivoFinanceiro: { valor: 'RENDA_PASSIVA', descricao: 'Seu objetivo é gerar renda passiva.' },
    horizonteInvestimento: { valor: 'LONGO_PRAZO', descricao: 'Seu horizonte é de longo prazo.' },
    valorDisponivel: 5000,
    tiposAceitos: ['ACAO', 'FII'],
    setoresPreferidos: [
      { setor: 'Energia Elétrica', preferencia: 'PREFERIR' },
      { setor: 'Mineração', preferencia: 'EVITAR' },
    ],
    perfilPreenchido: true,
    resumoIA: 'Resumo do perfil.',
    atualizadoEm: '',
    ...overrides,
  };
}

const REQUISICAO_ATUAL: EditarPerfilRequest = {
  perfilRisco: 'MODERADO',
  objetivoFinanceiro: 'RENDA_PASSIVA',
  horizonteInvestimento: 'LONGO_PRAZO',
  valorDisponivel: 5000,
  tiposAceitos: ['ACAO', 'FII'],
  setoresPreferidos: [
    { setor: 'Energia Elétrica', preferencia: 'PREFERIR' },
    { setor: 'Mineração', preferencia: 'EVITAR' },
  ],
};

describe('PreferenciasPerfilComponent', () => {
  let fixture: ComponentFixture<PreferenciasPerfilComponent>;
  let service: jasmine.SpyObj<PerfilService>;
  let toast: ToastService;
  let salvos: PerfilResponse[];

  beforeEach(async () => {
    service = jasmine.createSpyObj<PerfilService>('PerfilService', ['editarPerfil']);
    service.editarPerfil.and.callFake((req) => of(perfilMock({ valorDisponivel: req.valorDisponivel })));

    await TestBed.configureTestingModule({
      imports: [PreferenciasPerfilComponent],
      providers: [{ provide: PerfilService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciasPerfilComponent);
    toast = TestBed.inject(ToastService);
    fixture.componentRef.setInput('perfil', perfilMock());
    salvos = [];
    fixture.componentInstance.salvo.subscribe((p) => salvos.push(p));
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement;
  }

  function campo(titulo: string): HTMLElement {
    return Array.from(el().querySelectorAll<HTMLElement>('app-campo-editavel')).find(
      (c) => c.querySelector('h3')!.textContent!.trim() === titulo,
    )!;
  }

  function abrir(titulo: string): HTMLElement {
    campo(titulo).querySelector<HTMLButtonElement>('.campo-editavel__editar')!.click();
    fixture.detectChanges();
    return campo(titulo);
  }

  function marcar(elemento: HTMLElement, seletor: string, valor = true): void {
    const input = elemento.querySelector<HTMLInputElement>(seletor)!;
    input.checked = valor;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function salvar(elemento: HTMLElement): void {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  }

  function marcarSetor(elemento: HTMLElement, setor: string, opcao: 'Destacar' | 'Neutro' | 'Evitar'): void {
    const grupo = Array.from(elemento.querySelectorAll<HTMLElement>('[role="radiogroup"]')).find(
      (g) => g.querySelector('span')!.textContent!.trim() === setor,
    )!;
    const label = Array.from(grupo.querySelectorAll('label')).find((l) => l.textContent!.trim() === opcao)!;
    const input = label.querySelector('input')!;
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('deve mostrar o perfil atual em cada item, cada um com seu botão Editar', () => {
    expect(campo('Seu perfil de risco').textContent).toContain('Você é um investidor moderado.');
    expect(campo('Seu perfil de risco').textContent).toContain('Resumo do perfil.');
    expect(campo('Objetivo').textContent).toContain('Seu objetivo é gerar renda passiva.');
    expect(campo('Horizonte').textContent).toContain('Seu horizonte é de longo prazo.');
    expect(campo('Valor disponível').textContent).toContain('R$');
    expect(el().querySelectorAll('.campo-editavel__editar').length).toBe(6);
  });

  it('deve marcar os tipos de ativo permitidos, também para leitor de tela', () => {
    const tipos = Array.from(el().querySelectorAll('.preferencias__tipo'));

    expect(tipos.map((t) => t.classList.contains('preferencias__tipo--aceito'))).toEqual([true, true, false]);
    expect(tipos.map((t) => t.querySelector('.preferencias__leitor')!.textContent!.trim())).toEqual([
      'permitido', 'permitido', 'não permitido',
    ]);
  });

  it('deve separar os setores com destaque dos setores a evitar', () => {
    const grupos = Array.from(campo('Setores').querySelectorAll('.preferencias__grupo-setores')).map((g) =>
      Array.from(g.children).map((c) => c.textContent!.trim()),
    );

    expect(grupos).toEqual([['Com destaque', 'Energia Elétrica'], ['Evitar', 'Mineração']]);
    expect(campo('Setores').querySelector('.preferencias__tag--evitar')!.textContent!.trim()).toBe('Mineração');
  });

  it('sem setores marcados, deve explicar que todos têm o mesmo peso', () => {
    fixture.componentRef.setInput('perfil', perfilMock({ setoresPreferidos: [] }));
    fixture.detectChanges();

    expect(campo('Setores').textContent).toContain('Nenhum setor marcado. Todos têm o mesmo peso nas suas sugestões.');
  });

  const camposDeEscolha: [string, string, Partial<EditarPerfilRequest>][] = [
    ['Seu perfil de risco', 'input[value="ARROJADO"]', { perfilRisco: 'ARROJADO' }],
    ['Objetivo', 'input[value="PRESERVAR_CAPITAL"]', { objetivoFinanceiro: 'PRESERVAR_CAPITAL' }],
    ['Horizonte', 'input[value="CURTO_PRAZO"]', { horizonteInvestimento: 'CURTO_PRAZO' }],
  ];

  for (const [titulo, opcao, alteracao] of camposDeEscolha) {
    it(`${titulo}: deve salvar só a nova escolha, mantendo o resto do perfil`, () => {
      const editor = abrir(titulo);
      marcar(editor, opcao);
      salvar(editor);

      expect(service.editarPerfil).toHaveBeenCalledOnceWith({ ...REQUISICAO_ATUAL, ...alteracao });
      expect(salvos.length).toBe(1);
      expect(campo(titulo).querySelector('form')).toBeNull();
      expect(toast.toasts()[0].tipo).toBe('sucesso');
    });
  }

  it('o editor de escolha deve começar com a opção atual marcada e explicar cada opção', () => {
    const editor = abrir('Horizonte');

    expect(editor.querySelector<HTMLInputElement>('input[value="LONGO_PRAZO"]')!.checked).toBeTrue();
    expect(editor.querySelector('legend')!.textContent).toContain('Quando você pretende usar esse dinheiro?');
    expect(editor.textContent).toContain('Pretendo usar o dinheiro entre 1 e 5 anos.');
  });

  it('valor disponível: deve salvar o novo valor', () => {
    const editor = abrir('Valor disponível');
    const input = editor.querySelector<HTMLInputElement>('#preferencias-valor')!;
    expect(input.value).toBe('5000');

    input.value = '12000.5';
    input.dispatchEvent(new Event('input'));
    salvar(editor);

    expect(service.editarPerfil).toHaveBeenCalledOnceWith({ ...REQUISICAO_ATUAL, valorDisponivel: 12000.5 });
  });

  it('valor disponível: vazio ou negativo deve ser recusado antes de chamar o backend', () => {
    const editor = abrir('Valor disponível');
    const input = editor.querySelector<HTMLInputElement>('#preferencias-valor')!;

    input.value = '';
    input.dispatchEvent(new Event('input'));
    salvar(editor);
    expect(editor.querySelector('.campo-editavel__erro')!.textContent!.trim()).toBe('Informe um valor a partir de R$ 0,00.');

    input.value = '-10';
    input.dispatchEvent(new Event('input'));
    salvar(editor);
    expect(service.editarPerfil).not.toHaveBeenCalled();
  });

  it('tipos de ativo: deve salvar na ordem da tela e exigir pelo menos um', () => {
    const editor = abrir('Tipos de ativo permitidos');

    marcar(editor, 'input[value="ACAO"]', false);
    marcar(editor, 'input[value="FII"]', false);
    salvar(editor);
    expect(editor.querySelector('.campo-editavel__erro')!.textContent!.trim()).toBe('Escolha pelo menos um tipo de ativo.');
    expect(service.editarPerfil).not.toHaveBeenCalled();

    marcar(editor, 'input[value="ETF"]');
    marcar(editor, 'input[value="ACAO"]');
    salvar(editor);
    expect(service.editarPerfil).toHaveBeenCalledOnceWith({ ...REQUISICAO_ATUAL, tiposAceitos: ['ACAO', 'ETF'] });
  });

  it('setores: deve permitir destacar, deixar neutro ou evitar cada setor, mantendo setores de fora da lista', () => {
    const editor = abrir('Setores');
    const setores = Array.from(editor.querySelectorAll('[role="radiogroup"] > span')).map((s) => s.textContent!.trim());
    expect(setores).toEqual(['Energia Elétrica', 'Tecnologia', 'Varejo e Consumo', 'Financeiro e Bancos', 'Agronegócio', 'Mineração']);

    marcarSetor(editor, 'Energia Elétrica', 'Neutro');
    marcarSetor(editor, 'Tecnologia', 'Evitar');
    marcarSetor(editor, 'Agronegócio', 'Destacar');
    salvar(editor);

    expect(service.editarPerfil).toHaveBeenCalledOnceWith({
      ...REQUISICAO_ATUAL,
      setoresPreferidos: [
        { setor: 'Tecnologia', preferencia: 'EVITAR' },
        { setor: 'Agronegócio', preferencia: 'PREFERIR' },
        { setor: 'Mineração', preferencia: 'EVITAR' },
      ],
    });
  });

  it('setores: um setor não pode ficar com destaque e evitado ao mesmo tempo', () => {
    const editor = abrir('Setores');

    marcarSetor(editor, 'Tecnologia', 'Destacar');
    marcarSetor(editor, 'Tecnologia', 'Evitar');
    salvar(editor);

    const enviados = service.editarPerfil.calls.mostRecent().args[0].setoresPreferidos.filter((s) => s.setor === 'Tecnologia');
    expect(enviados).toEqual([{ setor: 'Tecnologia', preferencia: 'EVITAR' }]);
  });

  it('cancelar deve descartar o rascunho e voltar ao valor salvo', () => {
    let editor = abrir('Seu perfil de risco');
    marcar(editor, 'input[value="CONSERVADOR"]');
    editor.querySelectorAll<HTMLButtonElement>('.campo-editavel__acoes button')[1].click();
    fixture.detectChanges();

    expect(service.editarPerfil).not.toHaveBeenCalled();
    editor = abrir('Seu perfil de risco');
    expect(editor.querySelector<HTMLInputElement>('input[value="MODERADO"]')!.checked).toBeTrue();
  });

  it('só um item deve ficar em edição por vez', () => {
    abrir('Objetivo');
    abrir('Horizonte');

    expect(el().querySelectorAll('form').length).toBe(1);
    expect(campo('Horizonte').querySelector('form')).not.toBeNull();
  });

  it('erro de validação do backend deve aparecer no item, que continua em edição', () => {
    service.editarPerfil.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400, error: { erro: 'Erro de validação', detalhes: { tiposAceitos: 'Selecione ao menos um tipo de ativo aceito' } },
    })));
    const editor = abrir('Objetivo');
    salvar(editor);

    expect(campo('Objetivo').querySelector('.campo-editavel__erro')!.textContent!.trim()).toBe('Selecione ao menos um tipo de ativo aceito');
    expect(salvos.length).toBe(0);
  });

  it('erro inesperado deve mostrar uma mensagem genérica', () => {
    service.editarPerfil.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { erro: 'Erro inesperado' } })));
    const editor = abrir('Objetivo');
    salvar(editor);

    expect(campo('Objetivo').querySelector('.campo-editavel__erro')!.textContent!.trim()).toBe('Não foi possível salvar agora. Tente novamente.');
  });
});
