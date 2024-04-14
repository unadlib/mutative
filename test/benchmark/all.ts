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
  type: 'bar',
  data: {
    labels: data.map(([name]) => name),
    datasets: [
      {
        label: 'All benchmark items',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
        data: data.map(([, { avg }]) => avg.toFixed(1)),
      },
    ],
  },
  options: {
    title: {
      display: true,
      text: `
        All benchmark results by average multiplier
      `,
    },
    plugins: {
      datalabels: {
        anchor: 'center',
        align: 'center',
        color: '#666',
        font: {
          weight: 'normal',
        },
      },
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
