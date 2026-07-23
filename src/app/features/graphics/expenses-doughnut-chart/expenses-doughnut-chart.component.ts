import { Component, Input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-expenses-doughnut-chart',
  imports: [BaseChartDirective],
  templateUrl: './expenses-doughnut-chart.component.html',
  styleUrl: './expenses-doughnut-chart.component.css',
})
export class ExpensesDoughnutChartComponent {
  @Input({ required: true }) data!: ChartData<'doughnut', number[], string>;

  readonly options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };
}
