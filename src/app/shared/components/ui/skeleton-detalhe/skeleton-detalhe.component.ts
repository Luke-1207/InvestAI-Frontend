import { Component } from '@angular/core';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-skeleton-detalhe',
  standalone: true,
  imports: [SkeletonComponent],
  templateUrl: './skeleton-detalhe.component.html',
  styleUrl: './skeleton-detalhe.component.scss',
})
export class SkeletonDetalheComponent {}
