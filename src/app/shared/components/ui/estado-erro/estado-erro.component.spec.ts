import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadoErroComponent } from './estado-erro.component';

describe('EstadoErroComponent', () => {
  let fixture: ComponentFixture<EstadoErroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadoErroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadoErroComponent);
    fixture.componentRef.setInput('icone', 'error');
    fixture.componentRef.setInput('titulo', 'Título de teste');
    fixture.componentRef.setInput('mensagem', 'Mensagem de teste.');
  });

  it('deve renderizar ícone, título e mensagem recebidos', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement;
    expect(el.querySelector('.estado-erro__icone').textContent.trim()).toBe('error');
    expect(el.querySelector('.estado-erro__titulo').textContent).toContain('Título de teste');
    expect(el.querySelector('.estado-erro__mensagem').textContent).toContain('Mensagem de teste.');
  });

  it('não deve renderizar botão de ação quando textoAcao não é passado', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-button')).toBeNull();
  });

  it('deve renderizar o botão e emitir "acao" ao clicar, quando textoAcao é passado', () => {
    fixture.componentRef.setInput('textoAcao', 'Tentar novamente');
    fixture.detectChanges();

    let emitiu = false;
    fixture.componentInstance.acao.subscribe(() => (emitiu = true));

    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('app-button button');
    botao.click();

    expect(emitiu).toBe(true);
  });

  it('deve aplicar a classe de variante alerta no ícone quando solicitado', () => {
    fixture.componentRef.setInput('variante', 'alerta');
    fixture.detectChanges();
    const icone = fixture.nativeElement.querySelector('.estado-erro__icone');
    expect(icone.classList).toContain('estado-erro__icone--alerta');
  });
});
