import { execFileSync } from 'node:child_process';

export interface LastUpdate {
  date: Date;
  author: string;
}

/**
 * The date and author of the last commit that changed a file, which Docusaurus
 * showed at the end of each page.
 */
export function getLastUpdate(file: string): LastUpdate | undefined {
  try {
    const [date, author] = execFileSync(
      'git',
      ['log', '-1', '--format=%aI%n%an', '--', file],
      { encoding: 'utf8' }
    )
      .trim()
      .split('\n');
    if (date && author) return { date: new Date(date), author };
  } catch {
    // Git is not available or the website is not in a Git checkout.
  }
  return undefined;
}
