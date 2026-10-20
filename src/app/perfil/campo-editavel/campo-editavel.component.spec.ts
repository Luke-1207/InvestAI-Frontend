import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampoEditavelComponent } from './campo-editavel.component';

@Component({
  standalone: true,
  imports: [CampoEditavelComponent],
  template: `
    <app-campo-editavel
      titulo="Objetivo"
      [variante]="variante()"
      [editando]="editando()"
      [salvando]="salvando()"
      [erro]="erro()"
      (editar)="eventos.push('editar'); editando.set(true)"
      (cancelar)="eventos.push('cancelar'); editando.set(false)"
      (salvar)="eventos.push('salvar')"
    >
      <strong valor class="valor-atual">Renda passiva</strong>
      <fieldset edicao>
        <label><input type="radio" name="o" value="a" /> A</label>
        <label><input type="radio" name="o" value="b" checked /> B</label>
      </fieldset>
    </app-campo-editavel>
  `,
})
class HostTesteComponent {
  readonly editando = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly variante = signal<'padrao' | 'destaque'>('padrao');
  readonly eventos: string[] = [];
}

describe('CampoEditavelComponent', () => {
  let fixture: ComponentFixture<HostTesteComponent>;
  let host: HostTesteComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostTesteComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostTesteComponent);
    host = fixture.componentInstance;
    fixture.autoDetectChanges(true);
    await fixture.whenStable();
  });

  function el(): HTMLElement {
    return fixture.nativeElement;
  }

  function botaoEditar(): HTMLButtonElement | null {
    return el().querySelector('.campo-editavel__editar');
  }

  function botoesDeAcao(): HTMLButtonElement[] {
    return Array.from(el().querySelectorAll<HTMLButtonElement>('.campo-editavel__acoes app-button button'));
  }

  it('fora da edição, deve mostrar o título, o valor atual e o botão Editar', () => {
    expect(el().querySelector('h2')!.textContent!.trim()).toBe('Objetivo');
    expect(el().querySelector('.valor-atual')!.textContent).toBe('Renda passiva');
    expect(botaoEditar()!.getAttribute('aria-label')).toBe('Editar objetivo');
    expect(el().querySelector('form')).toBeNull();
  });

  it('ao clicar em Editar, deve trocar o valor pelo formulário com Salvar e Cancelar', async () => {
    botaoEditar()!.click();
    await fixture.whenStable();

    expect(host.eventos).toEqual(['editar']);
    expect(el().querySelector('.valor-atual')).toBeNull();
    expect(el().querySelector('form fieldset')).not.toBeNull();
    expect(botaoEditar()).toBeNull();
    expect(botoesDeAcao().map((b) => b.textContent!.trim())).toEqual(['Salvar', 'Cancelar']);
    expect(el().querySelector('app-campo-editavel')!.classList).toContain('campo-editavel--editando');
  });

  it('deve levar o foco para a opção marcada ao abrir e de volta para o Editar ao fechar', async () => {
    botaoEditar()!.click();
    await fixture.whenStable();
    expect(document.activeElement).toBe(el().querySelector('input[value="b"]'));

    botoesDeAcao()[1].click();
    await fixture.whenStable();
    expect(document.activeElement).toBe(botaoEditar());
  });

  it('enviar o formulário deve pedir para salvar, e Cancelar ou Esc devem cancelar', async () => {
    host.editando.set(true);
    await fixture.whenStable();

    el().querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    el().querySelector('form')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(host.eventos).toEqual(['salvar', 'cancelar']);
    expect(el().querySelector('form')).toBeNull();
  });

  it('deve mostrar o erro como alerta e travar os botões enquanto salva', async () => {
    host.editando.set(true);
    host.erro.set('Escolha pelo menos um tipo de ativo.');
    host.salvando.set(true);
    await fixture.whenStable();

    const erro = el().querySelector('.campo-editavel__erro')!;
    expect(erro.textContent!.trim()).toBe('Escolha pelo menos um tipo de ativo.');
    expect(erro.getAttribute('role')).toBe('alert');
    expect(botoesDeAcao().every((b) => b.disabled)).toBeTrue();
  });

  it('a variante de destaque deve marcar o componente', async () => {
    host.variante.set('destaque');
    await fixture.whenStable();

    expect(el().querySelector('app-campo-editavel')!.classList).toContain('campo-editavel--destaque');
  });
});
