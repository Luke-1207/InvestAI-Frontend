import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
  });

  function spinner(): HTMLElement {
    return fixture.nativeElement.querySelector('.app-spinner');
  }

  it('deve usar o tamanho médio por padrão, sem classe de modificador', () => {
    fixture.detectChanges();
    expect(spinner().classList).not.toContain('app-spinner--pequeno');
    expect(spinner().classList).not.toContain('app-spinner--grande');
  });

  it('deve aplicar a classe de tamanho pequeno', () => {
    fixture.componentRef.setInput('tamanho', 'pequeno');
    fixture.detectChanges();
    expect(spinner().classList).toContain('app-spinner--pequeno');
  });

  it('deve aplicar a classe de tamanho grande', () => {
    fixture.componentRef.setInput('tamanho', 'grande');
    fixture.detectChanges();
    expect(spinner().classList).toContain('app-spinner--grande');
  });

  it('deve expor o rótulo customizado via aria-label', () => {
    fixture.componentRef.setInput('rotulo', 'Carregando ativos');
    fixture.detectChanges();
    expect(spinner().getAttribute('aria-label')).toBe('Carregando ativos');
  });
});
