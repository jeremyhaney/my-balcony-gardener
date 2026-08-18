# Phase 8C.3D — Evidence-State Production Validation and Closeout

Date: 2026-08-17

Status: Complete, committed, and pushed

## Purpose

Phase 8C.3D closes the evidence-state sequence after Phase 8C.3C. The implementation already handled derived-unavailable Relative Moisture Index state, but the committed policy tests did not directly invoke that branch. This slice adds deterministic assertions, records the subsequent production validation, and closes the approved evidence-state model without changing runtime behavior.

## Scope

- Directly exercise derived-unavailable policy behavior when no usable raw ADC evidence exists.
- Verify neutral derived-unavailable treatment without evidence and cautionary treatment after repeated invalid raw evidence.
- Verify invalid, omitted, and stale policy labels remain separate from environmental-condition currency.
- Preserve the existing cadence, freshness, actionable-age, last-good, bounded-count, capability-authority, and device-reporting rules.

## Boundaries

This slice changes no production query, polling path, history window, SQL, Supabase object or row, firmware, device, capability, assignment, watering behavior, Demo behavior, customer adoption, presentation styling, or runtime application behavior. It does not introduce measurement plausibility ranges or Support runtime/configuration mismatch diagnostics.

No sensor is disconnected or faulted. Fault-state validation remains deterministic.

## Acceptance criteria

- Derived-unavailable RMI behavior is directly deterministic-test-covered.
- Approved invalid, omission, stale, future-timestamp, repeated-failure, device-inactive, bounded-count, and capability-driven health behavior remains passing.
- Tests, ESLint, the TypeScript/Vite production build, and `git diff --check` pass.
- Query and Disk IO behavior remain unchanged.
- Production validation and operational closeout require Jeremy's separate approval.

## Validation result

Validation passed 22/22 deterministic tests, ESLint, the TypeScript/Vite production build, and `git diff --check`. The existing Vite large-chunk advisory remained non-blocking. During that validation run, no production validation, deployment command, SQL, Supabase mutation, firmware or device operation, sensor fault, commit, or push occurred.

The deterministic slice was committed and pushed on `main` as `de7e5de8bcc9e1d73bc72333939225210b273843` (`Validate Support evidence fault states`). Because it changed only tests and documentation, it required no separate runtime production behavior claim. Its evidence supported the subsequent authenticated production validation and operational closeout committed as `b0d024cee281e100f901eadb5e2966f479456d4d` (`Close Phase 8C evidence validation`).
