import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../services/toast.service';

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  function toasts(): NodeListOf<HTMLElement> {
    return fixture.nativeElement.querySelectorAll('.toast');
  }

  it('não deve renderizar nenhum toast quando a fila está vazia', () => {
    expect(toasts().length).toBe(0);
  });

  it('deve renderizar um toast por item da fila, com a classe do tipo certo', () => {
    toastService.sucesso('Tudo certo');
    toastService.erro('Deu ruim');
    fixture.detectChanges();

    const elementos = toasts();
    expect(elementos.length).toBe(2);
    expect(elementos[0].classList).toContain('toast--sucesso');
    expect(elementos[1].classList).toContain('toast--erro');
    expect(elementos[0].textContent).toContain('Tudo certo');
  });

  it('deve remover o toast da tela ao clicar no botão de fechar', () => {
    toastService.sucesso('Vai sumir ao clicar');
    fixture.detectChanges();

    const botaoFechar: HTMLButtonElement = fixture.nativeElement.querySelector('.toast__fechar');
    botaoFechar.click();
    fixture.detectChanges();

    expect(toasts().length).toBe(0);
  });
});
