import fs from 'fs';
import path from 'path';
import https from 'https';
import QuickChart from 'quickchart-js';

const resultPath = path.resolve(__dirname, `./results/result.json`);
const raw = fs.readFileSync(resultPath);
const result: Record<string, { name: string; avg: number }> = JSON.parse(
  String(raw)
);

const data = Object.entries(result).sort(
  ([, { avg: avgA }], [, { avg: avgB }]) => avgA - avgB
);

const name = path.basename(__filename).replace('.ts', '');
const chart = new QuickChart();
chart.setConfig({
  type: 'horizontalBar',
  data: {
    labels: data.map(([name]) => name),
    datasets: [
      {
        label: 'All benchmark items',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        data: data.map(([, { avg }]) => avg.toFixed(1)),
      },
    ],
  },
  options: {
    title: {
      display: true,
      text: 'Mutative vs Immer - All benchmark results by average multiplier',
    },
    plugins: {
      datalabels: {
        anchor: 'right',
        align: 'right',
        color: '#666',
        font: {
          weight: 'normal',
        },
      },
    },
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Multiplier',
          },
        },
      ],
      yAxes: [
        {
          type: 'category',
          position: 'left',
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Benchmark Type',
          },
          ticks: {
            reverse: true,
          },
        },
      ],
    },
  },
});

const file = fs.createWriteStream(
  path.resolve(__dirname, `./results/${name}.jpg`)
);
https.get(chart.getUrl(), (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
  });
});
