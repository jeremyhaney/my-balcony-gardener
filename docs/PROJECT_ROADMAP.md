# My Balcony Gardener Project Roadmap

> **Jeremy's control panel:** Read this document to understand where the product is, what matters most, what can be worked on now, and why. Detailed implementation history and evidence live in [`PHASE_BACKLOG.md`](./PHASE_BACKLOG.md) and the linked phase records.

**Roadmap updated:** 2026-08-27  
**Product stage:** Working Gen2 product moving from engineering proof toward a customer-ready experience  
**Current focus:** Build the lightweight brand foundation and first business card while field conditions delay watering-threshold evidence

---

## The 60-Second View

My Balcony Gardener currently has a commissioned Gen2 controller, local firmware-owned watering safety, trusted measurement and event evidence, and read-only hosted Customer and Support experiences. Prototype02 provides a pump-free bench path for controller and sensor work. The main remaining gap is no longer whether the system can collect and present evidence; it is whether the product is understandable, trustworthy, and ready for someone other than Jeremy to use.

### The two priorities that are both true

| Priority lens | #1 priority | Why it is here | What happens now |
| --- | --- | --- | --- |
| **Product priority** | **Establish an evidence-based watering threshold** | Moisture-guided watering is the most important product learning still unresolved. | **WAITING ON NATURE.** Basket dry-down evidence is required, but near-daily storms prevent a clean observation window. Collect evidence when conditions permit; do not invent a threshold to keep the roadmap moving. |
| **Execution priority** | **Create the brand foundation and first business card** | The graph repair is locally complete, and this independent customer-facing outcome can move while field learning waits on weather. | **DO NOW.** Define a lightweight reusable visual foundation and produce a practical first leave-behind without locking premature permanent branding. |

> **Roadmap rule:** Weather can block evidence, but it does not block progress. The threshold remains the highest-value outcome while brand foundation and the first business card become the next executable task.

## Current State

### What is working

- Balcony02 is the commissioned Gen2 field controller with locally owned watering decisions and reservoir safety.
- Prototype02 is commissioned as a Support-only, pump-free bench unit for safe controller-path and sensor validation.
- Hosted Customer, public example, and authenticated Support boundaries exist and remain read-only.
- Measurement-quality gates, evidence-state handling, environmental interpretation, watering-event evidence, Dew Point, Feels Like, and the revised Relative Moisture Index presentation are implemented at their recorded validation levels.
- Unsupported Gen1 runtime, frontend, firmware, identity/data, and schema paths have been retired.

### What is not yet good enough

- The product does not yet have enough clean basket dry-down evidence to establish or present a defensible watering threshold.
- Phase 8G.4 established the durable service-side identity model, but routine firmware payload cleanup remains deliberately deferred.
- MBG does not yet have a small, coherent brand foundation or a physical leave-behind for introducing the product to potential customers and partners.
- The customer journey and interface have grown from engineering needs and have not yet been modernized around real customer use.
- The current public example is live and temporary; the final Demo should eventually be deterministic and curated.

## Priority Flow

```text
HIGHEST PRODUCT LEARNING
Watering threshold evidence
        |
        +-- waiting for a useful basket dry-down window
        |
        +-- when weather permits: observe -> evaluate -> decide -> design presentation

HIGHEST EXECUTABLE WORK
Brand foundation and business card
        -> real customer adoption and UI modernization
        -> deterministic Demo

OPTIONAL SECONDARY DIRECTION
Local scheduling
        -> sensor-assisted scheduled watering
```

## NOW — Active Attention

### 1. Watering-Threshold Evidence Watch

**Lane:** Highest product priority; environmentally blocked  
**Workstream:** Product learning / Sensors / Future control  
**Recommended tool:** **Codex — `gpt-5.6-sol`, xhigh effort, design-first.** This phase crosses field evidence, firmware, safety, and device validation; use ChatGPT only for preliminary brainstorming or explaining alternatives.  
**Why now:** A trustworthy threshold is foundational to future moisture-informed behavior and honest customer presentation.

**Dependency:** A useful basket dry-down period. Near-daily storms currently reset or contaminate the experiment.

**While waiting:**

- Keep current readings and weather context observable without changing watering authority.
- Define the minimum evidence that will make the next dry-down window useful.
- Avoid choosing a threshold from convenience, isolated readings, or calendar pressure.
- Carry the deferred Phase 8G.4 firmware contract cleanup as part of this future firmware phase rather than scheduling a separate device upload.

**Planned firmware companion work:**

- Keep sending stable `sensor_key` as the logical measurement identity.
- Stop repeating manually maintained `physical_sensor_id` in routine `/measurements` payloads.
- Limit `/capabilities` physical identity to genuinely discoverable hardware UIDs, such as a DS18B20 ROM.
- Build and bench-validate the combined change, then obtain separate per-device upload approval.

Bundling is preferred because the watering-threshold implementation is already expected to require firmware builds and device uploads. This reduces avoidable firmware/upload cycles without making identity cleanup a prerequisite to Phase 8G.4 completion or silently expanding watering authority.

**Resume trigger:** A forecast and basket condition that allow a meaningful uninterrupted dry-down observation window.

**Done means:** The evidence supports a documented threshold or range, uncertainty is explicit, and any display or control implication receives separate design and approval.

### 2. Brand Foundation and First Marketing Material

**Objective:** Create a small, usable MBG brand foundation and apply it to the first practical marketing deliverable, especially a business card.  
**Why now:** It is customer-facing, relatively independent of the technical roadmap, and gives Jeremy something tangible to use when describing and marketing MBG before the broader customer-adoption phase.  
**Desired outcome:** A clear, professional business card plus a compact visual foundation—potentially including a provisional logo, basic typography/color choices, short product description, and a useful digital/QR destination—that can also inform later frontend modernization.  
**Important boundaries:** A provisional logo is acceptable. Do not let a full brand exercise delay the business card; do not treat provisional branding as permanently locked; confirm Jeremy's name, role, contact details, call to action, QR destination, print specifications, and any printing expense before final production or ordering.  
**Done means:** Jeremy has reviewed print-ready and digital business-card deliverables, the logo/visual assets used by the card are reusable, the essential message and call to action are clear, and any provisional brand decisions are labeled for later refinement.

**Workstream:** Brand / Marketing / Product / Frontend visual foundation  
**Recommended tool:** **ChatGPT — GPT-5.6 with high thinking effort and image generation.** Use Codex later if approved brand assets need to be organized in the repository or applied to the frontend.

## NEXT — Prioritized Queue

### 3. Phase 8H — Customer Adoption and Customer-Led UI Modernization

**Workstream:** Product / Frontend UI/UX / Customer experience  
**Recommended tool:** **ChatGPT — GPT-5.6 with high thinking effort** for customer-journey discovery and product decisions; then **Codex — `gpt-5.6-sol`, high effort** for bounded repository implementation.  
**Why next:** A real authorized customer journey should determine which parts of the interface deserve modernization instead of redesigning from engineering assumptions.

**Outcome:** Onboard a real customer-visible commissioned device, observe the journey, and divide improvements into small 8H.x slices based on actual friction.

**Likely focus areas:** Navigation, information hierarchy, plain-language status, responsive behavior, accessibility, setup expectations, and the separation between customer meaning and Support diagnostics.

### 4. Phase 8I — Deterministic Demo

**Workstream:** Product / Frontend / Sales demonstration  
**Recommended tool:** **Codex — `gpt-5.6-sol`, high effort.** Use ChatGPT first only if the demo story, audience, or sample scenario still needs product-level definition.  
**Why after 8H:** The Demo should showcase the customer experience that survives real use, not freeze today's temporary product direction.

**Outcome:** Replace the temporary live public example with curated, stable, non-live demonstration data that has no protected or live-device dependency.

## LATER — Important, Not Yet Scheduled

| Direction | Workstream | Why it is later | Promotion trigger |
| --- | --- | --- | --- |
| Local sampling, control evaluation, and telemetry cadence separation | Firmware / I/O / Reliability | Valuable optimization and control foundation, but not the current customer-facing constraint | Evidence shows current cadence limits reliability, cost, or future control design |
| Hydraulic delivery and distribution characterization | Hardware / Product learning | Needed for quantified watering, but requires deliberate physical testing | Threshold learning or customer deployment requires delivered-volume confidence |
| Reservoir marking and calibration | Hardware / Serviceability | Helpful operational improvement, not a current roadmap blocker | Field servicing or customer instructions need repeatable volume guidance |
| Installed soak and reliability observation | Reliability / Field learning | Ongoing evidence stream rather than a single build task | A pattern produces a bounded problem or release criterion |
| Alerts and notifications | Product / Operations | Premature until customer needs and alert truth are better understood | Phase 8H identifies a valuable, actionable alert |
| Future threshold/window intelligence | Data / Product intelligence | Requires sufficient trusted history and an approved product boundary | Evidence volume and quality justify a model or rules design |

## PARKED — Deliberately Not Now

### Phase 9A — Local Schedule Foundation

Optional local schedule configuration with controller-side persistence. This is a secondary product direction, not required to complete the current Gen2 customer path.

### Phase 9B — Sensor-Assisted Scheduled Watering

Conservative fixed-sensor skip/allow behavior after scheduling, measurement confidence, safety behavior, and fallback rules are separately designed and approved.

### Guardrail

Hosted services remain read-only evidence and presentation systems. Local ESP32 firmware owns watering decisions and pump shutoff. Remote Water Now, Supabase command/control, and unproven moisture-triggered automation are not implied by this roadmap.

## Workstream Map

Use this view when the question is not “what comes next?” but “where does this idea belong?”

| Workstream | Current focus | Next horizon | Future / wish list |
| --- | --- | --- | --- |
| **Product and customer** | Watering-threshold learning | Real customer adoption | Alerts, broader onboarding, commercial readiness |
| **Brand and marketing** | Define a lightweight visual foundation and business card | Reuse tested brand elements in customer adoption | Broader collateral after message and audience are proven |
| **Frontend UI/UX** | Post-push graph validation; preserve the repaired stable plot | Customer-led modernization | Deterministic Demo and broader visual system |
| **Hardware and firmware** | Preserve safe local authority | Bundle deferred 8G.4 payload cleanup with threshold firmware work | Hydraulic proof, service-friendly production design |
| **Sensors and field learning** | Wait for clean basket dry-down | Threshold/range decision | Confidence models and richer microclimate learning |
| **Data, database, and I/O** | Phase 8G.4 service-side identity model complete | Consume durable installation history without routine manual physical IDs | Cadence separation and evidence-based intelligence |
| **Reliability and operations** | Continue soak observation | Turn repeated patterns into bounded work | Alerts, support tooling, production hardening |
| **Technical debt** | Retire routine firmware `physical_sensor_id` duplication during threshold work | Address bounded customer-visible debt during modernization | Address debt when it impairs customers, safety, or delivery |
| **Documentation** | Keep this roadmap current | Keep detailed evidence in phase records | Simplify old records only when navigation suffers |

## Recently Completed

Only the three most recent meaningful outcomes stay here. Older completion evidence belongs in [`PHASE_BACKLOG.md`](./PHASE_BACKLOG.md).

1. **Watering-event graph visibility repair:** The fixed-height measurement plot no longer shrinks as watering evidence accumulates. Every watering retains its dashed line; a single watering is named over its line, dense windows show one centered exact-count summary, and complete evidence remains in Watering History. Jeremy accepted the local desktop single- and 17-watering presentations; phone-sized and post-push hosted validation remain follow-ups.
2. **Phase 8G.4 — Physical Sensor Identity and Service Lifecycle:** The service-side identity model, production schema, MS02 asset registration, digital QR, and documentation are complete without a firmware update. P02 remains a simulation unit with no installation interval. Deferred firmware payload cleanup is explicitly carried into the future watering-threshold firmware phase.
3. **Phase 8G.3.2 — Public live customer example:** `/demo` now provides a constrained public customer-facing example without exposing Support diagnostics; locally validated, with production deployment and hosted validation not yet claimed.

## How to Start a Roadmap Item with ChatGPT

Use this only after an idea has been deliberately promoted into `NOW` or `NEXT`. The roadmap communicates current priority and product intent; it does not replace repository inspection, a bounded phase record, or separate approval for consequential actions.

### Actionable-item fields

An item ready to begin should make its five core execution fields and tool routing clear:

```text
Objective:
Why now:
Desired outcome:
Important boundaries:
Done means:
Recommended tool — ChatGPT or Codex; include the model and reasoning effort when Codex is recommended.
```

These fields are different from the `Idea Intake` form below. Idea Intake captures a thought before priority is assigned. These fields communicate an approved roadmap item's intended result and route it to the right working environment before ChatGPT or Codex discovers and proposes the exact implementation boundary.

### Tool-routing rule of thumb

- Use **ChatGPT** for idea development, positioning, messaging, customer thinking, creative exploration, and deciding what should be built.
- Use **Codex** when the work must inspect or change the repository, run tests, create implementation records, validate a local interface, or coordinate firmware/database work.
- Use both in sequence when product or creative decisions should settle before repository implementation.
- `gpt-5.6-sol` with **high** effort is the normal Codex recommendation for consequential product implementation. Use **xhigh** when safety, firmware, production data, or several interacting technical boundaries materially increase the reasoning burden. Lower the effort for routine mechanical follow-up work.

### Reusable kickoff prompt

Copy the relevant roadmap item, then use:

```text
Please begin this roadmap item:

[PASTE THE ROADMAP ITEM HERE]

Treat the roadmap as the current authority for priority and product intent, but not as a complete implementation specification or automatic approval for every possible change.

First:

1. Inspect the current repository state and the relevant backlog, product records, ADRs, and implementation.
2. Reconcile this roadmap item with anything completed or changed since it was written.
3. Identify dependencies, uncertainties, safety boundaries, and potentially stale assumptions.
4. Confirm whether the roadmap's recommended tool, model, and effort still fit the work, then define a clearly bounded phase or phase slice with its objective, included work, exclusions, implementation approach, validation, acceptance criteria, documentation effects, and expected firmware, frontend, database, hardware, deployment, or device-upload effects.
5. Identify only the decisions that genuinely require Jeremy's input.

Proceed with safe work clearly within the requested phase. Do not assume authorization for destructive database changes, production deployment, firmware upload, physical-device mutation, changes to watering authority, or hosted command/control. Call those out separately when relevant.
```

Add a short current observation after the pasted item when one prompted the work—for example, which graph window exposes a layout problem or what happened during a field test. Fresh evidence is more useful than writing a new full technical prompt.

### Design-first variation

For watering logic, firmware behavior, production SQL, authentication, hardware changes, or another consequential boundary, add this final instruction:

```text
Complete the inspection and phase design first. Do not implement, deploy, mutate production data, or upload firmware until I approve the proposed boundary.
```

## Idea Intake — Do Not Prioritize in Your Head

When a new thought appears, capture only enough to keep it out of your head and make its possible value understandable. This is an intake form, not a test, classification exercise, business case, or kickoff prompt. Short answers, uncertainty, and `I don't know yet` are valid. ChatGPT can help refine the idea, suggest its workstream, and determine whether it belongs in `NEXT`, `LATER`, or `PARKED`.

```text
Idea — What would you like to create, change, explore, or fix?
Desired result — What would be different if this worked?
Why now — Why is this on your mind, and is there a useful opportunity or pain today?
For whom — Who would notice or benefit? (Optional if unknown.)
Known dependencies — What might need to happen first? “None known” is a valid answer.
Notes or constraints — Anything you do or do not want? (Optional.)
```

You do not need to choose a workstream or prove the idea's priority during intake. Candidate grand ideas belong in `LATER` or `PARKED`, not mixed into the active queue. The roadmap is allowed to say “important, but not now.”

## How This Roadmap Changes

- Keep one primary executable item whenever possible.
- Keep the evidence-blocked product priority visible without pretending it is executable.
- Promote an item from `NEXT` only when the current item is complete, blocked, or consciously displaced.
- Give promoted `NOW` and `NEXT` items the actionable-item fields and a recommended tool/model/effort before kickoff; keep unprioritized thoughts in Idea Intake.
- Move completed work to `Recently Completed`; retain only the latest three entries.
- Put design, acceptance criteria, validation detail, and historical evidence in a phase record or [`PHASE_BACKLOG.md`](./PHASE_BACKLOG.md), not here.
- Revisit priority when weather opens a dry-down window, customer evidence changes the product direction, a safety risk appears, or a dependency clears.
