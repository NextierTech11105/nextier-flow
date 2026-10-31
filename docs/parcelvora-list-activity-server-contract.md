# Parcelvora — list activity calendar server contract

Status: **server implemented** in the Parcelvora application source (`parcelavora/app/server.mjs`, branch `feature/records-export-ledger`), with the static demo answering the same routes from the browser (`app/static/static-api.js`). `parcelvora-records.html` here is now built from that source by `app/static/build.mjs`, so a rebuild keeps everything in this PR.

## Meaning of a list pull

A successful completed export with at least one record delivered counts as **one list pull**. A filtered search exported as a file and an explicit saved list exported as a file both count. Retries, preview requests, list creation, and unsuccessful/zero-record exports are logged but are not counted as successful pulls.

Show three counters computed in the `America/New_York` timezone:

- **Today**: completed pulls and total new / delivered records from 00:00 through 23:59 Eastern
- **This week**: Monday through Sunday (Eastern)
- **This month**: first through last local date of the month

Calendar day cells show completed pulls and new records, with a click revealing per-export activity.

## Ledger

Use the current spec's `gold.exports` table and `gold.export_items` / `gold.exported` for stable identities and duplicate prevention. Add or expose:

- `account` (tenant-scoped)
- `id`, `created_at` in UTC
- `list_id` (nullable) and `list_name` (human-readable immutable snapshot)
- `channel` (`download` or `dest:<id>`)
- `format`, `status`, `matched`, `delivered`
- `new_count` (first-time records delivered for this account; quota metric)
- `redownloaded` (previously exported in this channel, returned by request)
- `already` (matched records already exported in this channel)
- `skipped` (matched records excluded by duplicate protection, per-export cap or daily limit)
- `error` if failed and `params` (search filter snapshot)

The initial ledger write must precede the file response or webhook side effect; use DB transactions/locking and idempotency tokens so concurrent downloads, retries and multiple sessions cannot circumvent quota or double-debit. Do not treat browser localStorage as authoritative.

## API (as implemented)

- `POST /api/exports/preview {params}` → `{ matched, capped, owned, fresh, sentHere, leftToday, limit, cap }`.
- `POST /api/exports {params, mode: "new"|"all", format: "csv"|"json", name, idempotency_key}` → `{ repeated, export, leftToday, overLimit, capped }`.
  One transaction under a per-account advisory lock; a repeated idempotency key returns the first export. New records are
  admitted only up to what is left of the account's daily allowance (`DAILY_EXPORT_LIMIT`, default 5,000, Eastern day).
  `gold.acquired` records ownership once per account (it is what the allowance counts); `gold.deliveries` records each
  channel separately; `gold.export_items` keeps the exact rows and their content. Failed attempts are logged as `failed`.
- `GET /api/exports/:id/file` → the original rows again; never counts toward the allowance.
- `GET /api/exports?from=YYYY-MM-DD&to=YYYY-MM-DD&page=` → `{ exports, more, page }`, newest first, Eastern dates.
- `/api/records.csv` runs through the same ledger. Accounts sign in with their own keys (`app/accounts.mjs`); account B
  never sees account A's exports or files.

## Demo limitations

The GitHub Pages sample currently implements a localStorage ledger (`pv-exports`, `pv-exported`) and duplicate-aware CSV/JSON export UI. This only persists in that browser. It does **not** provide server-side quotas, multi-device consistency, push/webhooks, or reliable recovery after local storage is cleared. The demo explicitly says so.

## Acceptance checks

1. Two downloads of the same filter: the second new-only export has zero delivered and does not count as another successful pull; the attempt remains in the day log.
2. Same records through two named lists: dedupe by account + channel + parcel identity, not list name.
3. New 5,000-record daily cap enforced transactionally with two concurrent requests.
4. The same record re-downloaded as `all` does not increment `new_count`.
5. Midnight Eastern, DST start/end, month boundaries, and Monday/week boundaries show correct totals.
6. A successful 100-record list download produces exactly one pull and 100 delivered records on the calendar; zero-record export remains logged but not counted.
7. Shared-account pagination and tenant authorization verified for `/api/exports`.
8. History remains stable after list deletion or rename; retain original list name in ledger.
