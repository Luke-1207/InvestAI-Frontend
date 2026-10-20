import {
  Component,
  ElementRef,
  Injector,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { BuscaService } from '../../services/busca.service';
import { ResultadoBusca, TAMANHO_MINIMO_BUSCA, rotaDoResultado } from '../../models/busca';
import { RotuloPipe } from '../../pipes/rotulo.pipe';

type EstadoBusca = 'ocioso' | 'carregando' | 'pronto' | 'erro';

export const ATRASO_BUSCA_MS = 250;
const ID_LISTA = 'busca-ativos-lista';

@Component({
  selector: 'app-busca-ativos',
  standalone: true,
  imports: [RotuloPipe],
  templateUrl: './busca-ativos.component.html',
  styleUrl: './busca-ativos.component.scss',
})
export class BuscaAtivosComponent {
  @ViewChild('campo', { static: true }) private campo!: ElementRef<HTMLInputElement>;
  @ViewChild('botaoAbrir', { static: true }) private botaoAbrir!: ElementRef<HTMLButtonElement>;

  private readonly buscaService = inject(BuscaService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly termos$ = new Subject<string>();

  protected readonly idLista = ID_LISTA;
  protected readonly termo = signal('');
  protected readonly resultados = signal<ResultadoBusca[]>([]);
  protected readonly estado = signal<EstadoBusca>('ocioso');
  protected readonly aberta = signal(false);
  protected readonly indiceAtivo = signal(-1);
  protected readonly expandidaNoCelular = signal(false);

  protected readonly termoValido = computed(() => this.termo().trim().length >= TAMANHO_MINIMO_BUSCA);
  protected readonly painelVisivel = computed(() => this.aberta() && this.termoValido());
  protected readonly listaVisivel = computed(() => this.painelVisivel() && this.resultados().length > 0);
  protected readonly idAtivo = computed(() =>
    this.listaVisivel() && this.indiceAtivo() >= 0 ? this.idOpcao(this.indiceAtivo()) : null,
  );

  protected readonly anuncio = computed(() => {
    if (!this.painelVisivel()) return '';
    const quantidade = this.resultados().length;
    switch (this.estado()) {
      case 'carregando':
        return quantidade ? '' : 'Buscando ativos';
      case 'erro':
        return 'Não conseguimos buscar agora';
      case 'pronto':
        if (quantidade === 0) return 'Nenhum ativo encontrado';
        return quantidade === 1 ? '1 resultado encontrado' : `${quantidade} resultados encontrados`;
      default:
        return '';
    }
  });

  constructor() {
    this.termos$
      .pipe(
        debounceTime(ATRASO_BUSCA_MS),
        map((termo) => termo.trim()),
        distinctUntilChanged(),
        switchMap((termo) =>
          termo.length < TAMANHO_MINIMO_BUSCA
            ? of(null)
            : this.buscaService.buscar(termo).pipe(
                map((resultados) => ({ resultados, erro: false })),
                catchError(() => of({ resultados: [] as ResultadoBusca[], erro: true })),
              ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((resposta) => {
        if (!resposta) return;
        this.resultados.set(resposta.resultados);
        this.estado.set(resposta.erro ? 'erro' : 'pronto');
        this.indiceAtivo.set(resposta.resultados.length ? 0 : -1);
      });
  }

  focar(): void {
    this.campo.nativeElement.focus();
  }

  protected idOpcao(indice: number): string {
    return `${ID_LISTA}-opcao-${indice}`;
  }

  protected aoDigitar(valor: string): void {
    this.termo.set(valor);
    this.aberta.set(true);
    if (this.termoValido()) {
      this.estado.set('carregando');
    } else {
      this.estado.set('ocioso');
      this.resultados.set([]);
      this.indiceAtivo.set(-1);
    }
    this.termos$.next(valor);
  }

  protected aoFocar(): void {
    this.aberta.set(true);
  }

  protected aoSairDoFoco(evento: FocusEvent): void {
    const destino = evento.relatedTarget as Node | null;
    if (!destino || !this.host.nativeElement.contains(destino)) {
      this.aberta.set(false);
    }
  }

  protected aoTeclar(evento: KeyboardEvent): void {
    const quantidade = this.resultados().length;

    switch (evento.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!quantidade || !this.termoValido()) return;
        evento.preventDefault();
        if (!this.aberta()) {
          this.aberta.set(true);
          return;
        }
        const passo = evento.key === 'ArrowDown' ? 1 : -1;
        this.ativar((this.indiceAtivo() + passo + quantidade) % quantidade);
        return;
      }
      case 'Enter': {
        if (!this.listaVisivel()) return;
        evento.preventDefault();
        this.escolher(this.resultados()[Math.max(this.indiceAtivo(), 0)]);
        return;
      }
      case 'Escape': {
        evento.stopPropagation();
        if (this.painelVisivel()) {
          this.aberta.set(false);
        } else if (this.expandidaNoCelular()) {
          this.fecharNoCelular();
        } else {
          this.limpar();
        }
        return;
      }
    }
  }

  protected ativar(indice: number): void {
    this.indiceAtivo.set(indice);
    document.getElementById(this.idOpcao(indice))?.scrollIntoView({ block: 'nearest' });
  }

  protected escolher(resultado: ResultadoBusca): void {
    this.limpar();
    this.expandidaNoCelular.set(false);
    this.campo.nativeElement.blur();
    this.router.navigate(rotaDoResultado(resultado));
  }

  protected abrirNoCelular(): void {
    this.expandidaNoCelular.set(true);
    afterNextRender(() => this.focar(), { injector: this.injector });
  }

  protected fecharNoCelular(): void {
    this.limpar();
    this.expandidaNoCelular.set(false);
    afterNextRender(() => this.botaoAbrir.nativeElement.focus(), { injector: this.injector });
  }

  private limpar(): void {
    this.termo.set('');
    this.resultados.set([]);
    this.estado.set('ocioso');
    this.aberta.set(false);
    this.indiceAtivo.set(-1);
    this.termos$.next('');
  }
}
