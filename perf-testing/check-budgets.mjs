import { readFileSync, writeFileSync } from 'node:fs';
import { evaluateBudgets, formatBudgetReport } from './regression.mjs';

if (!process.argv[2])
  throw new Error(
    'Usage: node perf-testing/check-budgets.mjs REPORT.json [OUTPUT.md]'
  );
const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const evaluation = evaluateBudgets(report);
const markdown = formatBudgetReport(evaluation);
if (process.argv[3]) writeFileSync(process.argv[3], markdown);
console.log(markdown);
if (evaluation.status !== 'passed') process.exitCode = 1;
