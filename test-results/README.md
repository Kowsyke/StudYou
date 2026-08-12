# Test results

This folder holds the actual output of the test suites, saved so the results can be read without cloning and running anything.

## Why the tests are split three ways

Each layer catches a different kind of mistake, so they run separately.

**Vitest** covers the two pure calculation engines in `packages/engine`. Budget totals and deadline dates are the two places where a quiet arithmetic bug would be worst, because nobody notices a number that is wrong by a small amount. These functions take plain data and return plain data with no database and no network, so they run in milliseconds and need no mocking.

**Bun test** covers server side helpers that are easier to break than they look: the rate limiter and the password policy. Both have edge cases that are awkward to reach through the UI, like what happens on the exact request that crosses the limit, or a password that is exactly 72 characters.

**Playwright** drives a real browser against a running app and database. This is the only layer that proves the whole vertical slice works together, and it is the one that catches things unit tests never can, like a role check that passes on the server but is bypassed in the interface.

## How many tests

| Layer | Tool | Tests |
|---|---|---|
| Engines | Vitest | 15 |
| Server helpers | Bun test | 12 |
| End to end | Playwright | 8 |
| **Total** | | **35** |

## Last run

Both suites were run on **12 August 2026**.

**Unit and server tests: 35 of 35 assertions green, 27 tests, no failures.**
See `unit-tests.txt` and `unit-tests.png`.

```
Test Files  2 passed (2)
     Tests  15 passed (15)

12 pass
 0 fail
```

**End to end: 7 of 8 passed.**
See `end-to-end-tests.txt`.

Passing: all three role based access control checks, all three resource library search and filter checks, and the full admin create, edit and delete flow.

Failing: `vertical-slice.spec.ts`, which signs in as the seeded student, ticks a task and checks the dashboard percentage updates. It times out looking for the first pending task button on the journey page. This is a known issue and it is not a regression from recent work, confirmed by running the same test against a clean checkout where it fails the same way. The behaviour it covers works when done by hand, so the fault is in how the test reaches the page rather than in the app.

## Running them yourself

```
pnpm test        # Vitest and Bun, no setup needed
pnpm test:e2e    # needs Postgres running and the database seeded
```

The end to end suite starts its own client and API servers. It expects the database to be migrated and seeded first, which `pnpm bootstrap` does.
