import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AjudaGlossarioComponent } from './ajuda-glossario.component';

@Component({
  standalone: true,
  imports: [AjudaGlossarioComponent],
  template: `<span>Termo <app-ajuda-glossario [chave]="chave()" [definicao]="definicao()" /></span>`,
})
class HostTesteComponent {
  readonly chave = signal<string | null>('CDI');
  readonly definicao = signal<string | null>(null);
}

describe('AjudaGlossarioComponent', () => {
  let fixture: ComponentFixture<HostTesteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostTesteComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostTesteComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function abrir(): HTMLElement {
    fixture.nativeElement
      .querySelector('.ajuda__botao')
      .dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    return document.querySelector<HTMLElement>('.ajuda__balao')!;
  }

  it('deve abrir a explicação do catálogo com o motivo de importar', () => {
    expect(fixture.nativeElement.querySelector('.ajuda__botao').getAttribute('aria-label')).toBe('O que é CDI?');

    const balao = abrir();

    expect(balao.textContent).toContain('Taxa que os bancos usam para emprestar dinheiro entre si');
    expect(balao.querySelector('.ajuda__importancia')!.textContent).toContain('Por que importa:');
  });

  it('deve preferir a definição recebida, mantendo o motivo de importar do catálogo', () => {
    fixture.componentInstance.definicao.set('Texto vindo da API.');
    fixture.detectChanges();

    const balao = abrir();

    expect(balao.textContent).toContain('Texto vindo da API.');
    expect(balao.textContent).not.toContain('Taxa que os bancos usam');
    expect(balao.textContent).toContain('percentual do CDI');
  });

  it('não deve mostrar nada para uma chave sem termo no glossário', () => {
    fixture.componentInstance.chave.set('D+1');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-ajuda')).toBeNull();
  });
});
