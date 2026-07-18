// PBReliability — parts failure, wear, engine-mode effects (engine-agnostic).
//
// Port of src/game/reliability.ts. This is the SINGLE SOURCE OF TRUTH for
// engine-mode pace deltas and failure/wear multipliers — the race sim and the
// garage UI both read from here (CLAUDE.md).
//
// DETERMINISM FIX vs the TS original: the roll functions used Math.random(),
// which breaks the "same seed => same season" contract. Here they take a
// seeded FPBRandom& so outcomes are replayable, honoring the locked rule.

#pragma once

#include <string>
#include <unordered_map>
#include "Core/PBTypes.h"
#include "Core/PBRandom.h"

struct FFailureEvent {
	bool bOccurred = false;
	std::optional<EPartFailureSeverity> Severity; // empty if no failure
	std::string Component;
	double PerformanceLoss = 0;  // 0-100: pace lost
	bool bIsTerminal = false;    // DNF if true
};

/** Failure-rate + wear multiplier per engine mode (conserve/std/push/attack). */
double PBEngineModeMultiplier(EEngineMode Mode); // 0.6 / 1.0 / 1.6 / 2.2

/** Lap-pace effect per engine mode (sec/lap; negative = faster). */
double PBEngineModePace(EEngineMode Mode);       // 0.10 / 0 / -0.12 / -0.25

/** Standard six-component loadout from a team's headline bike reliability. */
std::unordered_map<std::string, FBikeComponent> PBDefaultBikeComponents(double BaseReliability);

/** baseFail% = max(1, (100 - reliability) * 0.25). */
double PBCalculateBaseFail(double Reliability);

double PBCalculateFailureChance(
	const FBikeComponent& Component,
	EEngineMode EngineMode,
	bool bIsHotRace,
	bool bHasRecklessTrait,
	int ReliabilityRdLevel, // 0-5 R&D investment
	double CrewQuality);    // 0.7-1.0

bool PBRollFailure(FPBRandom& Rng, double FailChance);
EPartFailureSeverity PBRollFailureSeverity(FPBRandom& Rng); // 50% minor / 30% mod / 20% terminal
double PBCalculatePerformanceLoss(FPBRandom& Rng, EPartFailureSeverity Severity);

FFailureEvent PBCheckPartFailure(
	FPBRandom& Rng,
	const FBikeComponent& Component,
	EEngineMode EngineMode,
	const FRider& Rider,
	bool bIsHotRace,
	int ReliabilityRdLevel,
	double CrewQuality);

FBikeComponent PBApplyWear(const FBikeComponent& Component, double MileageThisRound);
FBikeComponent PBRebuildComponent(const FBikeComponent& Component, int RoundNumber);
double PBEstimateRebuildCost(const FBikeComponent& Component, double BaseEngineCost);
