import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { PosicaoBalao, calcularPosicaoBalao } from './posicao-balao';

let contador = 0;
let ajudaAberta: AjudaContextualComponent | null = null;

@Component({
  selector: 'app-ajuda',
  standalone: true,
  templateUrl: './ajuda-contextual.component.html',
  styleUrl: './ajuda-contextual.component.scss',
})
export class AjudaContextualComponent {
  readonly texto = input.required<string>();
  readonly termo = input('');
  readonly rotulo = input('');
  readonly importancia = input('');
  readonly focavel = input(true);

  readonly alternado = output<boolean>();

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);
  private readonly botao = viewChild.required<ElementRef<HTMLButtonElement>>('botao');
  private readonly balao = viewChild<ElementRef<HTMLElement>>('balao');

  protected readonly idBalao = `ajuda-contextual-${++contador}`;
  protected readonly aberto = signal(false);
  protected readonly posicao = signal<PosicaoBalao | null>(null);
  protected readonly rotuloBotao = computed(
    () => this.rotulo() || (this.termo() ? `O que é ${this.termo()}?` : 'Ajuda'),
  );

  private ponteiroPressionado = false;
  private readonly reposicionar = () => this.posicionar();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.pararDeAcompanhar();
      this.balao()?.nativeElement.remove();
      if (ajudaAberta === this) {
        ajudaAberta = null;
      }
    });
  }

  abrir(): void {
    if (this.aberto()) return;
    if (ajudaAberta && ajudaAberta !== this) {
      ajudaAberta.fechar();
    }
    ajudaAberta = this;
    this.posicao.set(null);
    this.aberto.set(true);
    this.alternado.emit(true);
    document.addEventListener('scroll', this.reposicionar, true);
    window.addEventListener('resize', this.reposicionar);
    afterNextRender(() => this.levarBalaoParaOTopo(), { injector: this.injector });
  }

  fechar(): void {
    if (!this.aberto()) return;
    if (ajudaAberta === this) {
      ajudaAberta = null;
    }
    this.aberto.set(false);
    this.posicao.set(null);
    this.pararDeAcompanhar();
    this.alternado.emit(false);
  }

  protected aoPressionar(): void {
    this.ponteiroPressionado = true;
  }

  protected aoFocar(): void {
    if (!this.ponteiroPressionado) {
      this.abrir();
    }
    this.ponteiroPressionado = false;
  }

  protected aoClicar(evento: MouseEvent): void {
    this.ponteiroPressionado = false;
    const veioDoTeclado = evento.detail === 0;
    if (veioDoTeclado || !this.aberto()) {
      this.abrir();
    } else {
      this.fechar();
    }
  }

  @HostListener('click', ['$event'])
  protected aoClicarDentro(evento: MouseEvent): void {
    evento.stopPropagation();
  }

  @HostListener('keydown.escape', ['$event'])
  protected aoApertarEsc(evento: Event): void {
    if (!this.aberto()) return;
    evento.stopPropagation();
    this.fechar();
    this.botao().nativeElement.focus();
  }

  @HostListener('focusout', ['$event'])
  protected aoPerderFoco(evento: FocusEvent): void {
    const destino = evento.relatedTarget as Node | null;
    if (destino && this.estaDentro(destino)) return;
    this.fechar();
  }

  @HostListener('document:click', ['$event'])
  protected aoClicarNaPagina(evento: MouseEvent): void {
    if (!this.estaDentro(evento.target as Node)) {
      this.fechar();
    }
  }

  private estaDentro(alvo: Node): boolean {
    return this.host.nativeElement.contains(alvo) || !!this.balao()?.nativeElement.contains(alvo);
  }

  private levarBalaoParaOTopo(): void {
    const balao = this.balao()?.nativeElement;
    if (!this.aberto() || !balao) return;
    if (balao.parentElement !== document.body) {
      document.body.appendChild(balao);
    }
    this.posicionar();
  }

  private posicionar(): void {
    const balao = this.balao()?.nativeElement;
    if (!this.aberto() || !balao) return;

    const ancora = this.botao().nativeElement.getBoundingClientRect();
    this.posicao.set(
      calcularPosicaoBalao(
        ancora,
        { width: balao.offsetWidth, height: balao.offsetHeight },
        { width: document.documentElement.clientWidth, height: window.innerHeight },
      ),
    );
  }

  private pararDeAcompanhar(): void {
    document.removeEventListener('scroll', this.reposicionar, true);
    window.removeEventListener('resize', this.reposicionar);
  }
}
