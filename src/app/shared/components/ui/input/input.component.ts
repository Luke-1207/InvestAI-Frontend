import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let proximoId = 0;

@Component({
  selector: 'app-input',
  standalone: true,
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  readonly rotulo = input.required<string>();
  readonly tipo = input<'text' | 'email' | 'password'>('text');
  readonly placeholder = input('');
  readonly mensagemErro = input<string | null>(null);
  readonly mostrarErro = input(false);

  protected readonly id = `app-input-${proximoId++}`;
  protected readonly valor = signal('');
  protected readonly desabilitado = signal(false);
  protected readonly senhaVisivel = signal(false);

  protected readonly ehCampoDeSenha = computed(() => this.tipo() === 'password');

  protected readonly tipoEfetivo = computed(() =>
    this.ehCampoDeSenha() && this.senhaVisivel() ? 'text' : this.tipo(),
  );

  private aoMudar: (valor: string) => void = () => {};
  private aoTocar: () => void = () => {};

  writeValue(valor: string): void {
    this.valor.set(valor ?? '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.aoMudar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocar = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado.set(desabilitado);
  }

  protected aoDigitar(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.valor.set(valor);
    this.aoMudar(valor);
  }

  protected aoPerderFoco(): void {
    this.aoTocar();
  }

  protected alternarVisibilidadeSenha(): void {
    this.senhaVisivel.set(!this.senhaVisivel());
  }
}
