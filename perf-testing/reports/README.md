# Performance evidence and archives

This directory contains two maintained documents: this archive index and the [current performance summary](./SUMMARY.md). The summary records the October 6 and 7 cross-library measurements of `main`, and its [history](./SUMMARY.md#history) summarizes earlier batches, including the October 5 base/head matrix of PR #184, whose paired CI measurements are uploaded by the [PR checks](https://github.com/unadlib/mutative/pull/184/checks). Benchmark source, tests, pinned versions, [`budgets.json`](../budgets.json), and the [build-size baseline](../../scripts/build-size-baseline.json) remain versioned. Historical measurements are not inputs to CI: the performance job measures its actual base/head checkouts and uploads its own results.

## Retention policy

- Write routine generated JSON, Markdown, and profiles to the ignored `perf-testing/results/` directory. Other files under `reports/` are ignored.
- For an important optimization or release, preserve the complete measurement batch in a compressed archive with the relevant baseline and candidate data, original metadata, a file manifest, and SHA-256 checksums.
- Store durable evidence as downloadable release assets and add an entry here. Use a new archive tag for each batch and preserve existing assets and tags. CI artifacts remain useful for individual runs; summaries intended for long-term reference need their own durable archive.
- Download the published archive and verify its checksum and every source file before removing local reports. Update the summary and affected documentation and PR links together. Refresh the summary for material performance changes; do not append every benchmark run to Git.

Archive releases use `perf-reports-*` tags, are marked as prereleases, and are not marked latest. The current [npm workflow](../../.github/workflows/npm-publish.yml) listens for `release.created`: create an archive release as a draft, upload and verify the assets, then publish that existing draft. GitHub documents the [draft release event behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release). Recheck the repository's release triggers before publishing future archives.

## Archive index

| Measurement dates (UTC)   | Snapshot                                                                                         | Contents                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-30 and 2026-10-01 | [`ed16bd4`](https://github.com/unadlib/mutative/commit/ed16bd466b301bc3babcaa2c87608fb53441e3ec) | All 51 original reports: 24 JSON and 27 Markdown files, including the original workloads, patch follow-up, expanded baseline/candidate, timing, memory, object-order controls, and local/GitHub budgets. |

[Release page][release] · [Full archive][archive] · [File manifest][manifest] · [SHA256SUMS][checksums]

The archive is **1,142,738 bytes**. It preserves every original report byte from that snapshot, plus the matching benchmark guide, upstream license, and array-method notes. The manifest records the snapshot SHA and each original file's path, byte count, and SHA-256. The original report directory occupies 12,880,582 uncompressed bytes; it remains available in Git history as well.

Archive SHA-256:

```text
a2ddaa60d87235ceb5ebf497d93c86b4da3e2b59174b20a34f9e67728985266d
```

The archive's `perf-testing/reports/README.md` is the original index. `2026-09-30-m1-max-node24-expanded-summary.md` documents the unoptimized reference; `2026-10-01-m1-max-node24-expanded-summary.md` documents the optimized candidate. Their neighboring JSON and table files retain their original names and relative links. Historical comments about measurements refer to those dates.

## Download and verify

From the repository root, using GitHub CLI, `shasum`, and `tar`:

```sh
mkdir -p perf-testing/results/archive
cd perf-testing/results/archive
# Use an empty download directory; do not overwrite an earlier archive.
gh release download perf-reports-2026-10-01 --repo unadlib/mutative --pattern '*.tar.gz' --pattern '*.manifest.json' --pattern SHA256SUMS
shasum -a 256 -c SHA256SUMS
tar -xzf mutative-performance-reports-2026-09-30_2026-10-01-ed16bd4.tar.gz
cd mutative-performance-reports-2026-09-30_2026-10-01-ed16bd4
shasum -a 256 -c FILES.sha256
```

To re-evaluate saved budget decisions without running measurements, return to the repository root and run:

```sh
node perf-testing/check-budgets.mjs perf-testing/results/archive/mutative-performance-reports-2026-09-30_2026-10-01-ed16bd4/perf-testing/reports/2026-10-01-m1-max-node24-expanded-budgets-local.json
```

See the [summary](./SUMMARY.md#reproduce) for the measured source identities and full-matrix commands, or the [benchmark guide](../README.md#run) for focused runs.

[release]: https://github.com/unadlib/mutative/releases/tag/perf-reports-2026-10-01
[archive]: https://github.com/unadlib/mutative/releases/download/perf-reports-2026-10-01/mutative-performance-reports-2026-09-30_2026-10-01-ed16bd4.tar.gz
[manifest]: https://github.com/unadlib/mutative/releases/download/perf-reports-2026-10-01/mutative-performance-reports-2026-09-30_2026-10-01-ed16bd4.manifest.json
[checksums]: https://github.com/unadlib/mutative/releases/download/perf-reports-2026-10-01/SHA256SUMS
