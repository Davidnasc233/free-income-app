import { Component, Input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-balance-evolution-line-chart',
  imports: [BaseChartDirective],
  templateUrl: './balance-evolution-line-chart.component.html',
  styleUrl: './balance-evolution-line-chart.component.css',
})
export class BalanceEvolutionLineChartComponent {
  @Input({ required: true }) data!: ChartData<'line', number[], string>;

  readonly options: ChartOptions<'line'> = {
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
