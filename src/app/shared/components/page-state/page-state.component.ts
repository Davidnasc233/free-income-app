import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-state',
  standalone: true,
  templateUrl: './page-state.component.html',
  styleUrl: './page-state.component.css',
})
export class PageStateComponent {
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() empty = false;
  @Input() loadingMessage = 'Carregando...';
  @Input() emptyMessage = 'Nada por aqui ainda.';
}
