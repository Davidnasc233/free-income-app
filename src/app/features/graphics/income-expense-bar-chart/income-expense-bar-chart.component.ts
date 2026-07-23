import { Component, Input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-income-expense-bar-chart',
  imports: [BaseChartDirective],
  templateUrl: './income-expense-bar-chart.component.html',
  styleUrl: './income-expense-bar-chart.component.css',
})
export class IncomeExpenseBarChartComponent {
  @Input({ required: true }) data!: ChartData<'bar', number[], string>;

  readonly options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };
}
