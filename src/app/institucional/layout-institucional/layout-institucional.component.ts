import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LINKS_INSTITUCIONAIS } from '../links-institucionais';

@Component({
  selector: 'app-layout-institucional',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout-institucional.component.html',
  styleUrl: './layout-institucional.component.scss',
})
export class LayoutInstitucionalComponent {
  protected readonly links = LINKS_INSTITUCIONAIS;
}
