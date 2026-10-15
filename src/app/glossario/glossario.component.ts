import { Component, computed, signal } from '@angular/core';
import {
  CATEGORIAS_GLOSSARIO,
  CategoriaGlossario,
  TERMOS_GLOSSARIO,
  TermoGlossario,
} from '../shared/glossario/glossario';

interface SecaoGlossario {
  categoria: CategoriaGlossario;
  termos: TermoGlossario[];
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-glossario',
  standalone: true,
  templateUrl: './glossario.component.html',
  styleUrl: './glossario.component.scss',
})
export class GlossarioComponent {
  protected readonly busca = signal('');

  protected readonly secoes = computed<SecaoGlossario[]>(() => {
    const termoBuscado = normalizar(this.busca());
    const encontrados = termoBuscado
      ? TERMOS_GLOSSARIO.filter((item) =>
          normalizar(`${item.termo} ${item.definicao}`).includes(termoBuscado),
        )
      : TERMOS_GLOSSARIO;

    return CATEGORIAS_GLOSSARIO.map((categoria) => ({
      categoria,
      termos: encontrados.filter((item) => item.categoria === categoria),
    })).filter((secao) => secao.termos.length > 0);
  });

  protected readonly totalTermos = TERMOS_GLOSSARIO.length;

  protected aoBuscar(evento: Event): void {
    this.busca.set((evento.target as HTMLInputElement).value);
  }

  protected limparBusca(): void {
    this.busca.set('');
  }
}
