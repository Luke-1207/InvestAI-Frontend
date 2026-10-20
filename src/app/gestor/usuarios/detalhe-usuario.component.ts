import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { GestaoUsuariosService } from '../../shared/services/gestao-usuarios.service';
import { AuthService } from '../../shared/services/auth.service';
import { PerfilResponse } from '../../shared/models/perfil';
import { ROTULO_PAPEL, UsuarioGestao } from '../../shared/models/gestao-usuarios';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { ErroServidorComponent } from '../../shared/components/erro-servidor/erro-servidor.component';
import { formatarMoeda } from '../../shared/utils/formatacao.util';
import { rotulo } from '../../shared/utils/rotulos.util';

const ROTULOS_TIPO_ACEITO: Record<string, string> = { ACAO: 'Ações', FII: 'FIIs', ETF: 'ETFs' };

@Component({
  selector: 'app-detalhe-usuario',
  standalone: true,
  imports: [DatePipe, RouterLink, SpinnerComponent, ErroServidorComponent],
  templateUrl: './detalhe-usuario.component.html',
  styleUrl: './detalhe-usuario.component.scss',
})
export class DetalheUsuarioComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly gestaoUsuariosService = inject(GestaoUsuariosService);
  private readonly authService = inject(AuthService);

  protected readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly rotuloPapel = ROTULO_PAPEL;
  protected readonly formatarMoeda = formatarMoeda;

  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);
  protected readonly naoEncontrado = signal(false);
  protected readonly erroPerfil = signal(false);
  protected readonly usuario = signal<UsuarioGestao | null>(null);
  protected readonly perfil = signal<PerfilResponse | null>(null);

  protected readonly souEu = computed(
    () => this.usuario()?.email.toLowerCase() === (this.authService.email() ?? '').toLowerCase(),
  );
  protected readonly tiposAceitos = computed(() =>
    (this.perfil()?.tiposAceitos ?? []).map((tipo) => ROTULOS_TIPO_ACEITO[tipo] ?? rotulo(tipo)).join(', '),
  );
  protected readonly setoresPreferidos = computed(() => this.setores('PREFERIR'));
  protected readonly setoresEvitados = computed(() => this.setores('EVITAR'));

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(false);
    this.naoEncontrado.set(false);
    this.erroPerfil.set(false);

    forkJoin({
      usuario: this.gestaoUsuariosService.obter(this.id),
      perfil: this.gestaoUsuariosService.obterPerfil(this.id).pipe(
        catchError((erro: HttpErrorResponse) => {
          if (erro.status !== 404) this.erroPerfil.set(true);
          return of(null);
        }),
      ),
    }).subscribe({
        next: ({ usuario, perfil }) => {
          this.usuario.set(usuario);
          this.perfil.set(perfil?.perfilPreenchido ? perfil : null);
          this.carregando.set(false);
        },
        error: (erro: HttpErrorResponse) => {
          this.carregando.set(false);
          if (erro.status === 404) this.naoEncontrado.set(true);
          else this.erro.set(true);
        },
      });
  }

  private setores(preferencia: 'PREFERIR' | 'EVITAR'): string {
    return (this.perfil()?.setoresPreferidos ?? [])
      .filter((s) => s.preferencia === preferencia)
      .map((s) => s.setor)
      .join(', ');
  }
}
