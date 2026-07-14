import { Component } from '@angular/core';
import { Goals } from '../../../shared/interfaces/goals.interface';

@Component({
  selector: 'app-home-goals',
  imports: [],
  templateUrl: './home-goals.component.html',
  styleUrl: './home-goals.component.css',
})
export class HomeGoalsComponent {
  data: Goals[] = [];
}
