import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { FormularioAtivoComponent } from './formulario-ativo.component';
import { GestaoCatalogoService } from '../../shared/services/gestao-catalogo.service';
import { ToastService } from '../../shared/services/toast.service';
import { AtivoGestao } from '../../shared/models/gestao-catalogo';

const EXISTENTES: AtivoGestao[] = [
  {
    id: 'a1', codigo: 'TAEE11', nome: 'Taesa Unit', tipo: 'ACAO', setor: 'Energia Elétrica', ativo: false,
    criadoEm: '2026-01-01T00:00:00', atualizadoEm: '2026-01-01T00:00:00',
  },
  {
    id: 'a2', codigo: 'HGLG11', nome: 'CSHG Logística', tipo: 'FII', setor: 'Logística', ativo: true,
    criadoEm: '2026-01-01T00:00:00', atualizadoEm: '2026-01-01T00:00:00',
  },
];

describe('FormularioAtivoComponent', () => {
  let fixture: ComponentFixture<FormularioAtivoComponent>;
  let service: jasmine.SpyObj<GestaoCatalogoService>;
  let router: Router;
  let toast: ToastService;

  async function montar(id: string | null = null, lista = of(EXISTENTES)) {
    service = jasmine.createSpyObj<GestaoCatalogoService>('GestaoCatalogoService', [
      'listarAtivos', 'cadastrarAtivo', 'atualizarAtivo',
    ]);
    service.listarAtivos.and.returnValue(lista);
    await TestBed.configureTestingModule({
      imports: [FormularioAtivoComponent],
      providers: [
        provideRouter([]),
        { provide: GestaoCatalogoService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FormularioAtivoComponent);
    router = TestBed.inject(Router);
    toast = TestBed.inject(ToastService);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  const el = (seletor: string): HTMLElement => fixture.nativeElement.querySelector(seletor);
  const radio = (valor: string): HTMLInputElement =>
    fixture.nativeElement.querySelector(`input[type="radio"][id$="-${valor}"]`);
  const campo = (id: string): HTMLInputElement => el('#' + id) as HTMLInputElement;

  function digitar(id: string, valor: string): void {
    const input = campo(id);
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function escolherTipo(valor: string): void {
    radio(valor).click();
    fixture.detectChanges();
  }

  function enviar(): void {
    el('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  const erroDe = (id: string): string | undefined => el(`#${id}-erro`)?.textContent?.trim();

  it('cadastro: deve mostrar os campos vazios e sugerir os setores do perfil e os já usados', async () => {
    await montar();

    expect(el('h1').textContent).toContain('Cadastrar ativo');
    expect(campo('ativo-codigo').disabled).toBeFalse();
    const sugestoes = Array.from(fixture.nativeElement.querySelectorAll('#ativo-setores option')).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(sugestoes).toContain('Tecnologia');
    expect(sugestoes).toContain('Logística');
    expect(new Set(sugestoes).size).toBe(sugestoes.length);
  });

  it('enviar vazio deve apontar cada campo obrigatório, ligar a mensagem ao campo e focar o primeiro', async () => {
    await montar();

    enviar();
    await new Promise((resolve) => setTimeout(resolve));

    expect(erroDe('ativo-codigo')).toBe('Informe o código do ativo.');
    expect(erroDe('ativo-nome')).toBe('Informe o nome do ativo.');
    expect(erroDe('ativo-tipo')).toBe('Escolha o tipo do ativo.');
    expect(campo('ativo-codigo').getAttribute('aria-invalid')).toBe('true');
    expect(campo('ativo-codigo').getAttribute('aria-describedby')).toBe('ativo-codigo-erro');
    expect(document.activeElement).toBe(campo('ativo-codigo'));
    expect(service.cadastrarAtivo).not.toHaveBeenCalled();
  });

  it('deve validar código, nome e setor com as mesmas regras da API', async () => {
    await montar();

    digitar('ativo-codigo', 'PETR 4');
    expect(erroDe('ativo-codigo')).toContain('Use só letras e números');
    digitar('ativo-codigo', 'ABCDEFGHIJK');
    expect(erroDe('ativo-codigo')).toBe('O código pode ter no máximo 10 caracteres.');
    digitar('ativo-codigo', 'hglg11');
    expect(erroDe('ativo-codigo')).toBe('Já existe um ativo cadastrado com esse código.');
    digitar('ativo-codigo', 'PETR4');
    expect(erroDe('ativo-codigo')).toBeUndefined();

    digitar('ativo-nome', ' P ');
    expect(erroDe('ativo-nome')).toBe('O nome precisa ter pelo menos 2 caracteres.');
    digitar('ativo-nome', 'x'.repeat(151));
    expect(erroDe('ativo-nome')).toBe('O nome pode ter no máximo 150 caracteres.');

    digitar('ativo-setor', 's'.repeat(101));
    expect(erroDe('ativo-setor')).toBe('O setor pode ter no máximo 100 caracteres.');
  });

  it('cadastro válido deve mandar código em maiúsculas, textos sem espaços nas pontas e voltar para a lista', async () => {
    await montar();
    service.cadastrarAtivo.and.returnValue(of({ ...EXISTENTES[0], id: 'novo', codigo: 'PETR4' }));
    const sucesso = spyOn(toast, 'sucesso');

    digitar('ativo-codigo', ' petr4 ');
    digitar('ativo-nome', '  Petrobras PN ');
    escolherTipo('ACAO');
    digitar('ativo-setor', '  ');
    enviar();

    expect(service.cadastrarAtivo).toHaveBeenCalledOnceWith({ codigo: 'PETR4', nome: 'Petrobras PN', tipo: 'ACAO', setor: null });
    expect(sucesso).toHaveBeenCalledWith('PETR4 foi cadastrado.');
    expect(router.navigate).toHaveBeenCalledWith(['/gestor/ativos']);
  });

  it('código repetido recusado pela API (409) deve aparecer no campo de código', async () => {
    await montar(null, of([]));
    service.cadastrarAtivo.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { erro: 'Já existe um ativo cadastrado com esse código' } })),
    );

    digitar('ativo-codigo', 'VALE3');
    digitar('ativo-nome', 'Vale ON');
    escolherTipo('ACAO');
    enviar();

    expect(erroDe('ativo-codigo')).toBe('Já existe um ativo cadastrado com esse código');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('erros de validação da API (400) devem aparecer em cada campo', async () => {
    await montar();
    service.cadastrarAtivo.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { erro: 'Erro de validação', detalhes: { nome: 'Nome deve ter entre 2 e 150 caracteres' } } })),
    );

    digitar('ativo-codigo', 'VALE3');
    digitar('ativo-nome', 'Vale ON');
    escolherTipo('ACAO');
    enviar();

    expect(erroDe('ativo-nome')).toBe('Nome deve ter entre 2 e 150 caracteres');
  });

  it('falha inesperada deve mostrar um aviso geral e manter o que foi digitado', async () => {
    await montar();
    service.cadastrarAtivo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    digitar('ativo-codigo', 'VALE3');
    digitar('ativo-nome', 'Vale ON');
    escolherTipo('ACAO');
    enviar();

    expect(el('.formulario__erro-geral').textContent).toContain('Não foi possível salvar agora');
    expect(el('.formulario__erro-geral').getAttribute('role')).toBe('alert');
    expect(campo('ativo-codigo').value).toBe('VALE3');
  });

  it('edição: deve preencher com o ativo, travar o código e manter o status atual ao salvar', async () => {
    await montar('a1');
    service.atualizarAtivo.and.returnValue(of({ ...EXISTENTES[0], nome: 'Taesa' }));
    const sucesso = spyOn(toast, 'sucesso');

    expect(el('h1').textContent).toContain('Editar TAEE11');
    expect(campo('ativo-codigo').value).toBe('TAEE11');
    expect(campo('ativo-codigo').disabled).toBeTrue();
    expect(el('#ativo-codigo-ajuda').textContent).toContain('não pode ser alterado');
    expect(radio('ACAO').checked).toBeTrue();
    expect(campo('ativo-setor').value).toBe('Energia Elétrica');

    digitar('ativo-nome', 'Taesa');
    enviar();

    expect(service.atualizarAtivo).toHaveBeenCalledOnceWith('a1', {
      nome: 'Taesa', tipo: 'ACAO', setor: 'Energia Elétrica', ativo: false,
    });
    expect(sucesso).toHaveBeenCalledWith('TAEE11 foi atualizado.');
  });

  it('edição de um id que não existe deve avisar e oferecer voltar', async () => {
    await montar('nao-existe');

    expect(el('[role="alert"]').textContent).toContain('Não encontramos esse ativo');
    expect(el('form')).toBeNull();
  });

  it('se não conseguir carregar deve mostrar o erro com opção de tentar de novo', async () => {
    await montar(null, throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(el('app-erro-servidor')).not.toBeNull();
  });
});
