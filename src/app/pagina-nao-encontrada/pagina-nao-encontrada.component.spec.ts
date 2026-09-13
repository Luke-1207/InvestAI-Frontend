import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PaginaNaoEncontradaComponent } from './pagina-nao-encontrada.component';

describe('PaginaNaoEncontradaComponent', () => {
  let fixture: ComponentFixture<PaginaNaoEncontradaComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaNaoEncontradaComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaNaoEncontradaComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('deve navegar pro /dashboard ao clicar no botão de voltar', () => {
    const navSpy = spyOn(router, 'navigateByUrl');

    const botao: HTMLButtonElement = fixture.nativeElement.querySelector('app-button button');
    botao.click();

    expect(navSpy).toHaveBeenCalledWith('/dashboard');
  });
});
