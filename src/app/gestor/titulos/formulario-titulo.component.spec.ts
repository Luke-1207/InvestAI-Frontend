import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { FormularioTituloComponent } from './formulario-titulo.component';
import { GestaoCatalogoService } from '../../shared/services/gestao-catalogo.service';
import { ToastService } from '../../shared/services/toast.service';
import { TituloGestao } from '../../shared/models/gestao-catalogo';
import { hojeIso } from '../validacoes-gestao';

const EXISTENTE: TituloGestao = {
  id: 't1', tipo: 'LCA', emissor: 'Banco do Brasil', indexador: 'IPCA', taxaPercentual: 5.2, vencimento: '2999-08-01',
  investimentoMinimo: 1000, liquidez: 'NO_VENCIMENTO', garantidoFgc: true, isentoIr: true, ativo: true,
  criadoEm: '2026-01-01T00:00:00', atualizadoEm: '2026-01-01T00:00:00',
};

describe('FormularioTituloComponent', () => {
  let fixture: ComponentFixture<FormularioTituloComponent>;
  let service: jasmine.SpyObj<GestaoCatalogoService>;
  let router: Router;
  let toast: ToastService;

  async function montar(id: string | null = null, lista = of([EXISTENTE])) {
    service = jasmine.createSpyObj<GestaoCatalogoService>('GestaoCatalogoService', [
      'listarTitulos', 'cadastrarTitulo', 'atualizarTitulo',
    ]);
    service.listarTitulos.and.returnValue(lista);
    await TestBed.configureTestingModule({
      imports: [FormularioTituloComponent],
      providers: [
        provideRouter([]),
        { provide: GestaoCatalogoService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FormularioTituloComponent);
    router = TestBed.inject(Router);
    toast = TestBed.inject(ToastService);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  const el = (seletor: string): HTMLElement => fixture.nativeElement.querySelector(seletor);
  const radio = (valor: string): HTMLInputElement =>
    fixture.nativeElement.querySelector(`input[type="radio"][id$="-${valor}"]`);
  const input = (id: string): HTMLInputElement => el('#' + id) as HTMLInputElement;
  const erroDe = (id: string): string | undefined => el(`#${id}-erro`)?.textContent?.trim();

  function preencher(id: string, valor: string): void {
    const campo = input(id);
    campo.value = valor;
    campo.dispatchEvent(new Event(campo.tagName === 'SELECT' ? 'change' : 'input'));
    campo.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function clicar(elemento: HTMLElement): void {
    elemento.click();
    fixture.detectChanges();
  }

  function marcar(seletor: string): void {
    el(seletor).click();
    fixture.detectChanges();
  }

  function preencherValido(): void {
    clicar(radio('CDB'));
    preencher('titulo-emissor', '  Banco Inter ');
    preencher('titulo-indexador', 'CDI');
    preencher('titulo-taxa', '110');
    preencher('titulo-vencimento', '2999-05-10');
    preencher('titulo-minimo', '500');
    clicar(radio('DIARIA'));
  }

  function enviar(): void {
    el('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('cadastro: deve sugerir os emissores já usados e começar com FGC marcado', async () => {
    await montar();

    expect(el('h1').textContent).toContain('Cadastrar título privado');
    expect(Array.from(fixture.nativeElement.querySelectorAll('#titulo-emissores option')).map((o) => (o as HTMLOptionElement).value))
      .toEqual(['Banco do Brasil']);
    expect((el('input[formcontrolname="garantidoFgc"]') as HTMLInputElement).checked).toBeTrue();
    expect(input('titulo-vencimento').min > hojeIso()).toBeTrue();
  });

  it('enviar vazio deve mostrar a mensagem de cada campo obrigatório e focar o primeiro', async () => {
    await montar();

    enviar();
    await new Promise((resolve) => setTimeout(resolve));

    expect(erroDe('titulo-tipo')).toBe('Escolha o tipo do título.');
    expect(erroDe('titulo-emissor')).toBe('Informe o emissor do título.');
    expect(erroDe('titulo-indexador')).toBe('Escolha o indexador.');
    expect(erroDe('titulo-taxa')).toBe('Informe a taxa.');
    expect(erroDe('titulo-vencimento')).toBe('Informe o vencimento.');
    expect(erroDe('titulo-minimo')).toBe('Informe o investimento mínimo.');
    expect(erroDe('titulo-liquidez')).toBe('Escolha a liquidez.');
    expect(document.activeElement).toBe(radio('CDB'));
    expect(service.cadastrarTitulo).not.toHaveBeenCalled();
  });

  it('deve recusar taxa e mínimo sem valor positivo, vencimento que não é futuro e emissor longo', async () => {
    await montar();

    preencher('titulo-taxa', '0');
    expect(erroDe('titulo-taxa')).toBe('A taxa precisa ser maior que zero.');
    preencher('titulo-minimo', '-10');
    expect(erroDe('titulo-minimo')).toBe('O investimento mínimo precisa ser maior que zero.');
    preencher('titulo-vencimento', hojeIso());
    expect(erroDe('titulo-vencimento')).toBe('O vencimento precisa ser uma data futura.');
    preencher('titulo-emissor', 'e'.repeat(151));
    expect(erroDe('titulo-emissor')).toBe('O emissor pode ter no máximo 150 caracteres.');
  });

  it('a dica da taxa deve mudar com o indexador e mostrar como o investidor vai ver', async () => {
    await montar();
    expect(el('#titulo-taxa-ajuda').textContent).toContain('Escolha o indexador');

    preencher('titulo-indexador', 'IPCA');
    preencher('titulo-taxa', '6.5');

    expect(el('#titulo-taxa-ajuda').textContent).toContain('somada ao IPCA');
    expect(el('#titulo-taxa-previa').textContent).toContain('IPCA + 6,50% a.a.');
    expect(input('titulo-taxa').getAttribute('aria-describedby')).toBe('titulo-taxa-ajuda titulo-taxa-previa');

    preencher('titulo-indexador', 'CDI');
    expect(el('#titulo-taxa-previa').textContent).toContain('6,50% do CDI');
  });

  it('LCI e LCA devem vir marcadas como isentas, até o gestor mexer nisso', async () => {
    await montar();
    const isento = (): HTMLInputElement => el('input[formcontrolname="isentoIr"]') as HTMLInputElement;

    clicar(radio('LCI'));
    expect(isento().checked).toBeTrue();
    clicar(radio('CDB'));
    expect(isento().checked).toBeFalse();

    marcar('input[formcontrolname="isentoIr"]');
    clicar(radio('LCA'));
    clicar(radio('CDB'));
    expect(isento().checked).toBeTrue();
  });

  it('cadastro válido deve mandar os dados no formato da API e voltar para a lista', async () => {
    await montar();
    service.cadastrarTitulo.and.returnValue(of({ ...EXISTENTE, id: 'novo', tipo: 'CDB', emissor: 'Banco Inter' }));
    const sucesso = spyOn(toast, 'sucesso');

    preencherValido();
    enviar();

    expect(service.cadastrarTitulo).toHaveBeenCalledOnceWith({
      tipo: 'CDB', emissor: 'Banco Inter', indexador: 'CDI', taxaPercentual: 110, vencimento: '2999-05-10',
      investimentoMinimo: 500, liquidez: 'DIARIA', garantidoFgc: true, isentoIr: false,
    });
    expect(sucesso).toHaveBeenCalledWith('CDB Banco Inter foi cadastrado.');
    expect(router.navigate).toHaveBeenCalledWith(['/gestor/titulos']);
  });

  it('erros de validação da API devem aparecer no campo certo', async () => {
    await montar();
    service.cadastrarTitulo.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { detalhes: { vencimento: 'Vencimento deve ser uma data futura' } } })),
    );

    preencherValido();
    enviar();

    expect(erroDe('titulo-vencimento')).toBe('Vencimento deve ser uma data futura');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('falha inesperada deve mostrar um aviso geral', async () => {
    await montar();
    service.cadastrarTitulo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));

    preencherValido();
    enviar();

    expect(el('.formulario__erro-geral').textContent).toContain('Não foi possível salvar agora');
  });

  it('edição: deve preencher com o título, sem trocar a isenção sozinho, e salvar pelo PUT', async () => {
    await montar('t1');
    service.atualizarTitulo.and.returnValue(of({ ...EXISTENTE, taxaPercentual: 5.5 }));
    const sucesso = spyOn(toast, 'sucesso');

    expect(el('h1').textContent).toContain('Editar título');
    expect(el('.formulario__descricao').textContent).toContain('LCA Banco do Brasil');
    expect(input('titulo-emissor').value).toBe('Banco do Brasil');
    expect(input('titulo-taxa').value).toBe('5.2');
    expect(radio('NO_VENCIMENTO').checked).toBeTrue();
    expect((el('input[formcontrolname="isentoIr"]') as HTMLInputElement).checked).toBeTrue();

    clicar(radio('CDB'));
    expect((el('input[formcontrolname="isentoIr"]') as HTMLInputElement).checked).toBeTrue();
    clicar(radio('LCA'));

    preencher('titulo-taxa', '5.5');
    enviar();

    expect(service.atualizarTitulo).toHaveBeenCalledOnceWith('t1', jasmine.objectContaining({ taxaPercentual: 5.5, tipo: 'LCA', isentoIr: true }));
    expect(sucesso).toHaveBeenCalledWith('LCA Banco do Brasil foi atualizado.');
  });

  it('edição de título já vencido deve avisar logo que precisa de um vencimento novo', async () => {
    await montar('t1', of([{ ...EXISTENTE, vencimento: '2020-01-01' }]));

    expect(erroDe('titulo-vencimento')).toBe('O vencimento precisa ser uma data futura.');
  });

  it('edição de um id que não existe deve avisar', async () => {
    await montar('nao-existe');

    expect(el('[role="alert"]').textContent).toContain('Não encontramos esse título');
  });
});
