#ifndef LOCAL_BUTTON_PROGRAM_H
#define LOCAL_BUTTON_PROGRAM_H

#include <stdint.h>

enum class LocalButtonProgramState : uint8_t {
  AwaitingRelease,
  Idle,
  SelectingProgram,
  Watering
};

enum class LocalButtonProgramActionType : uint8_t {
  None,
  StartProgram,
  CompleteProgram,
  CancelProgram,
  ReservoirSafetyCutoff,
  BlockedByReservoir
};

struct LocalButtonProgramAction {
  LocalButtonProgramActionType type;
  uint32_t requestedDurationMs;
};

class LocalButtonProgramController {
 public:
  static constexpr uint32_t LONG_PRESS_THRESHOLD_MS = 5000;
  static constexpr uint32_t SHORT_PROGRAM_DURATION_MS = 30000;
  static constexpr uint32_t LONG_PROGRAM_DURATION_MS = 60000;
  static constexpr uint32_t RESERVOIR_LOSS_CONFIRMATION_MS = 20;

  constexpr explicit LocalButtonProgramController(uint32_t debounceMs)
    : debounceMs_(debounceMs) {}

  constexpr void begin(uint32_t now, bool rawPressed) {
    lastRawPressed_ = rawPressed;
    debouncedPressed_ = rawPressed;
    lastRawChangeTime_ = now;
    pressStartedAt_ = now;
    wateringStartedAt_ = now;
    requestedDurationMs_ = 0;
    reservoirLossQualificationActive_ = false;
    reservoirLossObservedAt_ = now;
    state_ = rawPressed
      ? LocalButtonProgramState::AwaitingRelease
      : LocalButtonProgramState::Idle;
  }

  constexpr LocalButtonProgramAction update(uint32_t now, bool rawPressed, bool reservoirLiquidDetected) {
    if (state_ == LocalButtonProgramState::Watering) {
      if (!reservoirLiquidDetected) {
        if (!reservoirLossQualificationActive_) {
          reservoirLossQualificationActive_ = true;
          reservoirLossObservedAt_ = now;
        } else if (static_cast<uint32_t>(now - reservoirLossObservedAt_) >=
                   RESERVOIR_LOSS_CONFIRMATION_MS) {
          return stop(
            LocalButtonProgramActionType::ReservoirSafetyCutoff,
            rawPressed || debouncedPressed_
          );
        }
      } else if (reservoirLossQualificationActive_) {
        reservoirLossQualificationActive_ = false;
      }
    }

    if (rawPressed != lastRawPressed_) {
      lastRawPressed_ = rawPressed;
      lastRawChangeTime_ = now;
    }

    if (static_cast<uint32_t>(now - lastRawChangeTime_) >= debounceMs_ &&
        rawPressed != debouncedPressed_) {
      debouncedPressed_ = rawPressed;

      if (state_ == LocalButtonProgramState::AwaitingRelease) {
        if (!debouncedPressed_) {
          state_ = LocalButtonProgramState::Idle;
        }
        return none();
      }

      if (state_ == LocalButtonProgramState::Idle && debouncedPressed_) {
        // Measure the gesture between the raw edge times that subsequently
        // survive debounce, so equal debounce windows do not shift 4,999 ms
        // across the 5,000 ms program boundary.
        pressStartedAt_ = lastRawChangeTime_;
        state_ = LocalButtonProgramState::SelectingProgram;
        return none();
      }

      if (state_ == LocalButtonProgramState::SelectingProgram && !debouncedPressed_) {
        requestedDurationMs_ = static_cast<uint32_t>(lastRawChangeTime_ - pressStartedAt_) >= LONG_PRESS_THRESHOLD_MS
          ? LONG_PROGRAM_DURATION_MS
          : SHORT_PROGRAM_DURATION_MS;

        if (!reservoirLiquidDetected) {
          state_ = LocalButtonProgramState::Idle;
          return {LocalButtonProgramActionType::BlockedByReservoir, requestedDurationMs_};
        }

        wateringStartedAt_ = now;
        reservoirLossQualificationActive_ = false;
        state_ = LocalButtonProgramState::Watering;
        return {LocalButtonProgramActionType::StartProgram, requestedDurationMs_};
      }

      if (state_ == LocalButtonProgramState::Watering && debouncedPressed_) {
        return stop(LocalButtonProgramActionType::CancelProgram, true);
      }
    }

    if (state_ == LocalButtonProgramState::Watering &&
        static_cast<uint32_t>(now - wateringStartedAt_) >= requestedDurationMs_) {
      return stop(LocalButtonProgramActionType::CompleteProgram, rawPressed || debouncedPressed_);
    }

    return none();
  }

  constexpr LocalButtonProgramState state() const { return state_; }
  constexpr bool debouncedPressed() const { return debouncedPressed_; }
  constexpr uint32_t requestedDurationMs() const { return requestedDurationMs_; }
  constexpr bool reservoirLossQualificationActive() const {
    return reservoirLossQualificationActive_;
  }

 private:
  constexpr LocalButtonProgramAction none() const {
    return {LocalButtonProgramActionType::None, requestedDurationMs_};
  }

  constexpr LocalButtonProgramAction stop(LocalButtonProgramActionType type, bool requireRelease) {
    reservoirLossQualificationActive_ = false;
    state_ = requireRelease
      ? LocalButtonProgramState::AwaitingRelease
      : LocalButtonProgramState::Idle;
    return {type, requestedDurationMs_};
  }

  uint32_t debounceMs_;
  LocalButtonProgramState state_ = LocalButtonProgramState::Idle;
  bool lastRawPressed_ = false;
  bool debouncedPressed_ = false;
  uint32_t lastRawChangeTime_ = 0;
  uint32_t pressStartedAt_ = 0;
  uint32_t wateringStartedAt_ = 0;
  uint32_t requestedDurationMs_ = 0;
  bool reservoirLossQualificationActive_ = false;
  uint32_t reservoirLossObservedAt_ = 0;
};

#endif
