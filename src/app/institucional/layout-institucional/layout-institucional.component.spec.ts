import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { LayoutInstitucionalComponent } from './layout-institucional.component';

@Component({ standalone: true, template: '<p class="pagina-teste">conteúdo</p>' })
class PaginaTesteComponent {}

describe('LayoutInstitucionalComponent', () => {
  let fixture: ComponentFixture<LayoutInstitucionalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutInstitucionalComponent],
      providers: [provideRouter([{ path: 'privacidade', component: PaginaTesteComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutInstitucionalComponent);
    fixture.detectChanges();
  });

  it('deve oferecer entrar ou criar conta para quem ainda não tem login', () => {
    const acesso = Array.from(fixture.nativeElement.querySelectorAll('.institucional__acesso a')).map((a) =>
      (a as HTMLAnchorElement).getAttribute('href'),
    );

    expect(acesso).toEqual(['/auth/login', '/auth/cadastro']);
  });

  it('deve navegar entre as quatro páginas e marcar a atual', async () => {
    await TestBed.inject(Router).navigateByUrl('/privacidade');
    fixture.detectChanges();

    const abas: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('.institucional__aba'));
    expect(abas.map((a) => a.getAttribute('href'))).toEqual(['/termos-de-uso', '/privacidade', '/conformidade', '/regras-cvm']);
    expect(abas[1].getAttribute('aria-current')).toBe('page');
    expect(abas[1].classList).toContain('institucional__aba--ativa');
    expect(abas[0].getAttribute('aria-current')).toBeNull();
    expect(fixture.nativeElement.querySelector('main .pagina-teste')).not.toBeNull();
  });
});
