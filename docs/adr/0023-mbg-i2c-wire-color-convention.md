# ADR 0023: MBG I2C Wire-Color Convention

## Status

Accepted

## Date

2026-07-03

## Context

Earlier May and June documentation used WHT = SDA and GRN = SCL for the MBG short-range local I2C cable. On July 3, 2026, the physical wire-identification convention was changed at approximately 2:34 PM EDT and clarified at approximately 2:45 PM EDT. Leaving both conventions active creates a safety-critical troubleshooting ambiguity: a technician could follow a stale color instruction while the GPIO and bus-signal assignments themselves remain correct.

Factory sensor cables can use their own lead colors. In particular, SEN0562 evidence includes BLUE = GND and YELLOW = SCL. Those factory lead colors describe that sensor cable only and do not establish the MBG internal wiring convention.

## Decision

The previous WHT = SDA and GRN = SCL MBG internal convention is superseded.

The authoritative MBG 4-conductor short-range local I2C convention is:

- RED = 3.3V;
- BLACK / BLK = GND;
- GREEN / GRN = SDA = ESP32 GPIO21;
- WHITE / WHT = SCL = ESP32 GPIO22.

GPIO21 remains SDA. GPIO22 remains SCL. No GPIO assignment changes.

This decision changes documentation and physical wire identification only. It does not change firmware, source code, SQL, schema, configuration, sensor assignment, connector pin numbering, runtime behavior, or electrical design.

Factory sensor-lead exceptions remain cable-specific. SEN0562 BLUE = GND and YELLOW = SCL do not redefine the MBG internal convention.

## Consequences

- Active wiring, architecture, pinout, buildout, service, and current-state documents must use GREEN = GPIO21 / SDA and WHITE = GPIO22 / SCL.
- Historical evidence may retain the colors documented at the time only when an unmistakable dated supersession notice prevents it from being mistaken for current instruction.
- Troubleshooting and service work has one unambiguous internal wire-color authority, eliminating the safety-critical ambiguity while preserving all GPIO, signal, connector, and runtime assignments.
