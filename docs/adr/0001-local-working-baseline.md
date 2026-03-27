# ADR 0001: Local Working Baseline

- Status: Accepted
- Date: 2026-03-27

## Context

The repo currently has a working BJ3 baseline:

- firmware compiles
- frontend lints, builds, runs, and loads
- the ESP32 is reachable locally
- current sensor values display in the UI
- Manual Water Now works from the local site

Supabase-backed history and graph restoration are still deferred. The project needs a stable, low-risk baseline that reflects what is working now without pretending the deferred path is already restored.

## Decision

The approved working baseline is the local ESP32 fallback path.

For the current architecture:

- the frontend may rely on the local ESP32 path for live sensor values
- the frontend may rely on the local ESP32 path for Manual Water Now
- Supabase-backed history/graph behavior remains deferred and is not part of the approved baseline yet

## Consequences

- Current-state validation should be judged against the local working path first.
- Work on deferred history/graph restoration must not break the local fallback behavior.
- Future changes that alter the approved runtime path or re-establish a different primary architecture require a new ADR.
