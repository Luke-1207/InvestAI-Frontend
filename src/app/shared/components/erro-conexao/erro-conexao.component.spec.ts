import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErroConexaoComponent } from './erro-conexao.component';

describe('ErroConexaoComponent', () => {
  let fixture: ComponentFixture<ErroConexaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErroConexaoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErroConexaoComponent);
    fixture.detectChanges();
  });

  it('deve emitir tentarNovamente ao clicar no botão', () => {
    let emitiu = false;
    fixture.componentInstance.tentarNovamente.subscribe(() => (emitiu = true));

    fixture.nativeElement.querySelector('app-button button').click();

    expect(emitiu).toBe(true);
  });
});
