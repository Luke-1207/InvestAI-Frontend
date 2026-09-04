import { Injectable, signal } from '@angular/core';

export type Tema = 'dark' | 'light';

const CHAVE_STORAGE = 'investai-tema';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this.obterTemaInicial());

  constructor() {
    this.aplicarTema(this.tema());
  }

  alternarTema(): void {
    this.definirTema(this.tema() === 'dark' ? 'light' : 'dark');
  }

  definirTema(tema: Tema): void {
    this.tema.set(tema);
    this.aplicarTema(tema);
    localStorage.setItem(CHAVE_STORAGE, tema);
  }

  private aplicarTema(tema: Tema): void {
    document.documentElement.setAttribute('data-theme', tema);
  }

  private obterTemaInicial(): Tema {
    const salvo = localStorage.getItem(CHAVE_STORAGE) as Tema | null;
    if (salvo === 'dark' || salvo === 'light') {
      return salvo;
    }

    const prefereClaro = window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefereClaro ? 'light' : 'dark';
  }
}
