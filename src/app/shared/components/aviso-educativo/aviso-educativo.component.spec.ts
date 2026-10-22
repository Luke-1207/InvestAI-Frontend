import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AvisoEducativoComponent } from './aviso-educativo.component';

describe('AvisoEducativoComponent', () => {
  it('deve dizer que o conteúdo é educativo e levar para a página de conformidade', async () => {
    await TestBed.configureTestingModule({ imports: [AvisoEducativoComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(AvisoEducativoComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Não é recomendação de investimento.');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/conformidade');
  });
});
