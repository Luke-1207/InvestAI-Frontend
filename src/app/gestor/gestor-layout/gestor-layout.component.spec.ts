import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { GestorLayoutComponent } from './gestor-layout.component';

@Component({ standalone: true, template: '' })
class VazioComponent {}

describe('GestorLayoutComponent', () => {
  async function montarEm(url: string) {
    await TestBed.configureTestingModule({
      imports: [GestorLayoutComponent],
      providers: [
        provideRouter([
          {
            path: 'gestor',
            children: [
              { path: '', component: VazioComponent },
              { path: 'ativos', component: VazioComponent },
              { path: 'ativos/novo', component: VazioComponent },
              { path: 'titulos', component: VazioComponent },
            ],
          },
        ]),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GestorLayoutComponent);
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    return fixture;
  }

  const atual = (el: HTMLElement) => el.querySelector('nav a[aria-current="page"]')?.textContent?.trim();

  it('deve ter uma navegação com as cinco seções do painel', async () => {
    const fixture = await montarEm('/gestor');
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');

    expect(nav.getAttribute('aria-label')).toBe('Seções do painel do gestor');
    const textos = Array.from(nav.querySelectorAll('a')).map((a) => a.textContent!);
    expect(textos.length).toBe(5);
    expect(textos[0]).toContain('Visão geral');
    expect(textos[1]).toContain('Renda variável');
    expect(textos[2]).toContain('Títulos privados');
    expect(textos[3]).toContain('Usuários');
    expect(textos[4]).toContain('Indicadores');
    expect(atual(fixture.nativeElement)).toContain('Visão geral');
  });

  it('a seção de renda variável deve continuar marcada dentro do formulário de cadastro', async () => {
    const fixture = await montarEm('/gestor/ativos/novo');

    expect(atual(fixture.nativeElement)).toContain('Renda variável');
    expect(fixture.nativeElement.querySelectorAll('nav a[aria-current="page"]').length).toBe(1);
  });
});
