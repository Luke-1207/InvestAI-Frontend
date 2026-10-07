import { Pipe, PipeTransform } from '@angular/core';
import { rotulo } from '../utils/rotulos.util';

@Pipe({ name: 'rotulo', standalone: true })
export class RotuloPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return rotulo(valor);
  }
}
