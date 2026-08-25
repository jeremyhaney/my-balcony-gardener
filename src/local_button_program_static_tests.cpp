#include "local_button_program.h"

namespace {
constexpr uint32_t DEBOUNCE_MS = 50;

constexpr LocalButtonProgramAction settle(
  LocalButtonProgramController &controller,
  uint32_t changedAt,
  bool pressed,
  bool reservoirLiquidDetected = true
) {
  controller.update(changedAt, pressed, reservoirLiquidDetected);
  return controller.update(changedAt + DEBOUNCE_MS, pressed, reservoirLiquidDetected);
}

constexpr LocalButtonProgramAction selectProgram(
  LocalButtonProgramController &controller,
  uint32_t pressedAt,
  uint32_t heldForMs,
  bool reservoirLiquidDetected = true
) {
  settle(controller, pressedAt, true, reservoirLiquidDetected);
  return settle(controller, pressedAt + heldForMs, false, reservoirLiquidDetected);
}

constexpr bool shortProgramBoundaryPasses() {
  LocalButtonProgramController controller(DEBOUNCE_MS);
  controller.begin(0, false);
  LocalButtonProgramAction press = settle(controller, 100, true);
  LocalButtonProgramAction release = settle(controller, 100 + 4999, false);
  return press.type == LocalButtonProgramActionType::None &&
    release.type == LocalButtonProgramActionType::StartProgram &&
    release.requestedDurationMs == 30000;
}

constexpr bool longProgramBoundaryPasses() {
  LocalButtonProgramController controller(DEBOUNCE_MS);
  controller.begin(0, false);
  LocalButtonProgramAction start = selectProgram(controller, 100, 5000);
  return start.type == LocalButtonProgramActionType::StartProgram &&
    start.requestedDurationMs == 60000;
}

constexpr bool heldSelectionNeverStartsBeforeRelease() {
  LocalButtonProgramController controller(DEBOUNCE_MS);
  controller.begin(0, false);
  settle(controller, 100, true);
  LocalButtonProgramAction stillHeld = controller.update(120000, true, true);
  return stillHeld.type == LocalButtonProgramActionType::None &&
    controller.state() == LocalButtonProgramState::SelectingProgram;
}

constexpr bool startupPressedRequiresRelease() {
  LocalButtonProgramController controller(DEBOUNCE_MS);
  controller.begin(0, true);
  LocalButtonProgramAction release = settle(controller, 1000, false);
  return release.type == LocalButtonProgramActionType::None &&
    controller.state() == LocalButtonProgramState::Idle;
}

constexpr bool cancellationReleaseOnlyRearms() {
  LocalButtonProgramController controller(DEBOUNCE_MS);
  controller.begin(0, false);
  selectProgram(controller, 100, 100);
  LocalButtonProgramAction stop = settle(controller, 1000, true);
  LocalButtonProgramAction release = settle(controller, 1200, false);
  return stop.type == LocalButtonProgramActionType::CancelProgram &&
    release.type == LocalButtonProgramActionType::None &&
    controller.state() == LocalButtonProgramState::Idle;
}

constexpr bool programmedCompletionsPass() {
  LocalButtonProgramController shortController(DEBOUNCE_MS);
  shortController.begin(0, false);
  selectProgram(shortController, 100, 100);
  bool shortNotEarly = shortController.update(30249, false, true).type ==
    LocalButtonProgramActionType::None;
  bool shortComplete = shortController.update(30250, false, true).type ==
    LocalButtonProgramActionType::CompleteProgram;

  LocalButtonProgramController longController(DEBOUNCE_MS);
  longController.begin(0, false);
  selectProgram(longController, 100, 5000);
  bool longNotEarly = longController.update(65149, false, true).type ==
    LocalButtonProgramActionType::None;
  bool longComplete = longController.update(65150, false, true).type ==
    LocalButtonProgramActionType::CompleteProgram;
  return shortNotEarly && shortComplete && longNotEarly && longComplete;
}

constexpr bool reservoirSafetyPasses() {
  LocalButtonProgramController blockedController(DEBOUNCE_MS);
  blockedController.begin(0, false);
  LocalButtonProgramAction blocked = selectProgram(blockedController, 100, 100, false);

  LocalButtonProgramController runningController(DEBOUNCE_MS);
  runningController.begin(0, false);
  selectProgram(runningController, 100, 100);
  LocalButtonProgramAction firstLow = runningController.update(1000, false, false);
  LocalButtonProgramAction notYetConfirmed = runningController.update(1019, false, false);
  LocalButtonProgramAction cutoff = runningController.update(1020, false, false);
  return blocked.type == LocalButtonProgramActionType::BlockedByReservoir &&
    firstLow.type == LocalButtonProgramActionType::None &&
    notYetConfirmed.type == LocalButtonProgramActionType::None &&
    cutoff.type == LocalButtonProgramActionType::ReservoirSafetyCutoff;
}

constexpr bool transientReservoirLowIsRejected() {
  LocalButtonProgramController controller(DEBOUNCE_MS);
  controller.begin(0, false);
  selectProgram(controller, 100, 100);
  LocalButtonProgramAction firstLow = controller.update(1000, false, false);
  LocalButtonProgramAction recovered = controller.update(1008, false, true);
  return firstLow.type == LocalButtonProgramActionType::None &&
    recovered.type == LocalButtonProgramActionType::None &&
    controller.state() == LocalButtonProgramState::Watering &&
    !controller.reservoirLossQualificationActive();
}

constexpr bool bounceProducesOneStartAndOneTerminal() {
  LocalButtonProgramController controller(DEBOUNCE_MS);
  controller.begin(0, false);
  int starts = 0;
  int terminals = 0;
  const LocalButtonProgramAction actions[] = {
    controller.update(100, true, true),
    controller.update(120, false, true),
    controller.update(140, true, true),
    controller.update(190, true, true),
    controller.update(250, false, true),
    controller.update(270, true, true),
    controller.update(290, false, true),
    controller.update(340, false, true),
    controller.update(30340, false, true),
    controller.update(30341, false, true),
  };
  for (const LocalButtonProgramAction action : actions) {
    if (action.type == LocalButtonProgramActionType::StartProgram) {
      starts++;
    }
    if (action.type == LocalButtonProgramActionType::CompleteProgram ||
        action.type == LocalButtonProgramActionType::CancelProgram ||
        action.type == LocalButtonProgramActionType::ReservoirSafetyCutoff) {
      terminals++;
    }
  }
  return starts == 1 && terminals == 1;
}

constexpr bool rolloverTimingPasses() {
  LocalButtonProgramController controller(DEBOUNCE_MS);
  uint32_t nearRollover = UINT32_MAX - 100;
  controller.begin(nearRollover, false);
  LocalButtonProgramAction start = selectProgram(controller, nearRollover + 10, 5000);
  uint32_t startAt = nearRollover + 10 + 5000 + DEBOUNCE_MS;
  LocalButtonProgramAction complete = controller.update(startAt + 60000, false, true);
  return start.requestedDurationMs == 60000 &&
    complete.type == LocalButtonProgramActionType::CompleteProgram;
}

static_assert(shortProgramBoundaryPasses(), "4,999 ms must select the 30-second program on release");
static_assert(longProgramBoundaryPasses(), "5,000 ms must select the 60-second program on release");
static_assert(heldSelectionNeverStartsBeforeRelease(), "an indefinitely held selection must not start watering");
static_assert(startupPressedRequiresRelease(), "startup press release must only re-arm");
static_assert(cancellationReleaseOnlyRearms(), "cancellation release must not restart watering");
static_assert(programmedCompletionsPass(), "30/60-second completion timing must be exact");
static_assert(reservoirSafetyPasses(), "reservoir start blocking and active cutoff must remain local");
static_assert(transientReservoirLowIsRejected(), "transient WL01 LOW must not stop an active program");
static_assert(bounceProducesOneStartAndOneTerminal(), "bounce must not duplicate run evidence actions");
static_assert(rolloverTimingPasses(), "button timing must remain correct across millis rollover");
}
