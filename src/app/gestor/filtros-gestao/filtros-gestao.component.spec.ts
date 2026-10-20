import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FiltrosGestaoComponent, OpcaoFiltro } from './filtros-gestao.component';
import { FiltroStatus } from '../../shared/models/gestao-catalogo';

@Component({
  standalone: true,
  imports: [FiltrosGestaoComponent],
  template: `
    <app-filtros-gestao
      rotuloBusca="Buscar ativos cadastrados"
      placeholder="Código ou nome"
      [opcoesTipo]="opcoes"
      [(termo)]="termo"
      [(tipo)]="tipo"
      [(status)]="status"
    />
  `,
})
class HospedeiroComponent {
  readonly opcoes: OpcaoFiltro[] = [
    { valor: 'TODOS', rotulo: 'Todos' },
    { valor: 'FII', rotulo: 'FIIs' },
  ];
  readonly termo = signal('');
  readonly tipo = signal('TODOS');
  readonly status = signal<FiltroStatus>('TODOS');
}

describe('FiltrosGestaoComponent', () => {
  let fixture: ComponentFixture<HospedeiroComponent>;
  let host: HospedeiroComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeiroComponent] }).compileComponents();
    fixture = TestBed.createComponent(HospedeiroComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('a busca deve ter nome para leitores de tela e atualizar o termo de quem usa', () => {
    const campo: HTMLInputElement = fixture.nativeElement.querySelector('input[type="search"]');
    expect(campo.closest('label')!.textContent).toContain('Buscar ativos cadastrados');
    expect(campo.placeholder).toBe('Código ou nome');

    campo.value = 'hglg';
    campo.dispatchEvent(new Event('input'));

    expect(host.termo()).toBe('hglg');
  });

  it('os botões de tipo devem indicar qual está escolhido e trocar o filtro', () => {
    const botoes: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('[role="group"] button'));
    expect(botoes.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);

    botoes[1].click();
    fixture.detectChanges();

    expect(host.tipo()).toBe('FII');
    expect(botoes[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('o seletor de status deve atualizar o filtro e mostrar o valor atual', () => {
    const seletor: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(seletor.closest('label')!.textContent).toContain('Status');

    seletor.value = 'INATIVOS';
    seletor.dispatchEvent(new Event('change'));
    expect(host.status()).toBe('INATIVOS');

    host.status.set('ATIVOS');
    fixture.detectChanges();
    expect(seletor.value).toBe('ATIVOS');
  });
});
