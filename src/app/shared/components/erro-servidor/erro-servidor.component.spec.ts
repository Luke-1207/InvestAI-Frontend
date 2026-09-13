import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErroServidorComponent } from './erro-servidor.component';

describe('ErroServidorComponent', () => {
  let fixture: ComponentFixture<ErroServidorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErroServidorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErroServidorComponent);
    fixture.detectChanges();
  });

  it('deve emitir tentarNovamente ao clicar no botão', () => {
    let emitiu = false;
    fixture.componentInstance.tentarNovamente.subscribe(() => (emitiu = true));

    fixture.nativeElement.querySelector('app-button button').click();

    expect(emitiu).toBe(true);
  });
});
