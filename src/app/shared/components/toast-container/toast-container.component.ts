import { Component, inject } from '@angular/core';
import { ToastService, TipoToast } from '../../services/toast.service';

const ICONE_POR_TIPO: Record<TipoToast, string> = {
  sucesso: 'check_circle',
  erro: 'error',
  aviso: 'warning',
};

@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  protected icone(tipo: TipoToast): string {
    return ICONE_POR_TIPO[tipo];
  }
}
