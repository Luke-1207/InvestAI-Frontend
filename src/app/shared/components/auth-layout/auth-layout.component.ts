import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LINKS_INSTITUCIONAIS } from '../../../institucional/links-institucionais';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  protected readonly links = LINKS_INSTITUCIONAIS;
}
