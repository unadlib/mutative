'use client';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

const maxAge = 60 * 60 * 1000;

function readCache(key: string): number | undefined {
  try {
    const cached = JSON.parse(localStorage.getItem(key) ?? 'null') as {
      stars: number;
      time: number;
    } | null;
    if (cached && Date.now() - cached.time < maxAge) return cached.stars;
  } catch {
    // Storage is unavailable, as in a private window.
  }
  return undefined;
}

function writeCache(key: string, stars: number) {
  try {
    localStorage.setItem(key, JSON.stringify({ stars, time: Date.now() }));
  } catch {
    // Storage is unavailable, as in a private window.
  }
}

/**
 * The stars of a repository, fetched in the browser so that the static build
 * needs no network, and cached for an hour, as GitHub limits the requests of
 * each visitor. Its space is kept while it loads, so the buttons beside it do
 * not move.
 */
export function StarCount({ repo }: { repo: string }) {
  // `undefined` while loading, `null` when GitHub cannot be reached.
  const [stars, setStars] = useState<number | null>();

  useEffect(() => {
    const key = `github-stars:${repo}`;
    const cached = readCache(key);
    const request =
      cached !== undefined
        ? Promise.resolve(cached)
        : fetch(`https://api.github.com/repos/${repo}`)
            .then((res) => (res.ok ? res.json() : Promise.reject(res)))
            .then(({ stargazers_count }: { stargazers_count: number }) => {
              writeCache(key, stargazers_count);
              return stargazers_count;
            });
    let active = true;
    request.then(
      (value) => active && setStars(value),
      () => active && setStars(null)
    );
    return () => {
      active = false;
    };
  }, [repo]);

  if (stars === null) return null;
  return (
    <span
      className={`ms-1 inline-flex items-center gap-1 border-s ps-3 text-sm font-medium text-fd-muted-foreground transition-opacity ${stars === undefined ? 'opacity-0' : 'opacity-100'}`}
    >
      <Star className="size-3.5 fill-current" />
      {stars === undefined ? '0,000' : stars.toLocaleString('en-US')}
    </span>
  );
}
