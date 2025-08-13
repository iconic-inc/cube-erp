import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { WEEKDAY } from '~/constants/date.constant';
import { formatCurrency } from '~/utils';

const makeupPointLabel = (context: any) => {
  const { raw } = context;

  return `${new Date().toLocaleDateString()}`;
};

export function createChart(
  canvas: any,
  {
    type, // 'line' | 'bar' | 'pie' | 'doughnut'
    data,
    options,
  }: {
    type: 'line' | 'bar' | 'pie' | 'doughnut';
    data: {
      labels: Array<number | string>;
      datasets: { label: any; data: number[] }[];
    };
    options?: any;
  },
) {
  const chart = new Chart(canvas, {
    type,
    data: {
      ...data,
    },
    options: {
      ...options,
      responsive: true,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
        },
        ...options?.plugins,
      },
    },
  });

  return {
    chart,
  };
}
