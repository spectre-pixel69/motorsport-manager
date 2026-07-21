// PBReliability implementation — see Game/PBReliability.h. Deterministic under
// the seeded FPBRandom (the TS original used Math.random here).

#include "Game/PBReliability.h"
#include <algorithm>
#include <cctype>
#include <cmath>

static constexpr double FAILURE_BASE_CALC = 0.0025; // documented constant

double PBEngineModeMultiplier(EEngineMode Mode)
{
	switch (Mode) {
	case EEngineMode::Conserve: return 0.6;
	case EEngineMode::Standard: return 1.0;
	case EEngineMode::Push:     return 1.6;
	case EEngineMode::Attack:   return 2.2;
	}
	return 1.0;
}

double PBEngineModePace(EEngineMode Mode)
{
	switch (Mode) {
	case EEngineMode::Conserve: return 0.10;
	case EEngineMode::Standard: return 0.0;
	case EEngineMode::Push:     return -0.12;
	case EEngineMode::Attack:   return -0.25;
	}
	return 0.0;
}

std::unordered_map<std::string, FBikeComponent> PBDefaultBikeComponents(double BaseReliability)
{
	struct Spec { const char* Id; const char* Type; double Offset; };
	static const Spec Specs[] = {
		{ "engine",      "engine",      0 },
		{ "gearbox",     "gearbox",     4 },
		{ "suspension",  "suspension",  6 },
		{ "brakes",      "brakes",      8 },
		{ "chassis",     "chassis",     10 },
		{ "electronics", "electronics", 2 },
	};
	std::unordered_map<std::string, FBikeComponent> Out;
	for (const Spec& S : Specs) {
		FBikeComponent C;
		C.Id = S.Id;
		std::string Name = S.Id;
		if (!Name.empty()) Name[0] = static_cast<char>(std::toupper(Name[0]));
		C.Name = Name;
		C.Type = S.Type;
		C.Reliability = std::min(98.0, BaseReliability + S.Offset);
		C.Wear = 0;
		C.MileageMiles = 0;
		Out[S.Id] = C;
	}
	return Out;
}

double PBCalculateBaseFail(double Reliability)
{
	// rel 100 = 1% · rel 80 = 5% · rel 50 = 12.5% · rel 0 = 25%
	return std::max(1.0, (100.0 - Reliability) * 0.25);
}

double PBCalculateFailureChance(
	const FBikeComponent& Component,
	EEngineMode EngineMode,
	bool bIsHotRace,
	bool bHasRecklessTrait,
	int ReliabilityRdLevel,
	double CrewQuality)
{
	double Chance = PBCalculateBaseFail(Component.Reliability);
	Chance *= PBEngineModeMultiplier(EngineMode);

	// Wear multiplier (0% wear = 1.0, 100% wear = 1.8)
	const double WearMultiplier = 1.0 + (Component.Wear / 100.0) * 0.8;
	Chance *= WearMultiplier;

	if (bIsHotRace)        Chance *= 1.2;
	if (bHasRecklessTrait) Chance *= 1.15;

	// R&D investment and crew quality reduce chance (R&D up to 50%)
	const double SafetyMod = CrewQuality * (1.0 - ReliabilityRdLevel * 0.1);
	Chance *= SafetyMod;

	return std::min(100.0, std::max(0.1, Chance));
}

bool PBRollFailure(FPBRandom& Rng, double FailChance)
{
	return Rng.Next() * 100.0 < FailChance;
}

EPartFailureSeverity PBRollFailureSeverity(FPBRandom& Rng)
{
	const double Roll = Rng.Next() * 100.0;
	if (Roll < 50.0) return EPartFailureSeverity::Minor;    // 50%
	if (Roll < 80.0) return EPartFailureSeverity::Moderate; // 30%
	return EPartFailureSeverity::Terminal;                  // 20%
}

double PBCalculatePerformanceLoss(FPBRandom& Rng, EPartFailureSeverity Severity)
{
	switch (Severity) {
	case EPartFailureSeverity::Minor:    return 15.0 + Rng.Next() * 25.0; // 15-40%
	case EPartFailureSeverity::Moderate: return 35.0 + Rng.Next() * 25.0; // 35-60%
	case EPartFailureSeverity::Terminal: return 100.0;                    // DNF
	}
	return 0.0;
}

FFailureEvent PBCheckPartFailure(
	FPBRandom& Rng,
	const FBikeComponent& Component,
	EEngineMode EngineMode,
	const FRider& Rider,
	bool bIsHotRace,
	int ReliabilityRdLevel,
	double CrewQuality)
{
	const bool bHasReckless =
		std::find(Rider.Traits.begin(), Rider.Traits.end(), ERiderTrait::Reckless) != Rider.Traits.end();

	const double FailChance = PBCalculateFailureChance(
		Component, EngineMode, bIsHotRace, bHasReckless, ReliabilityRdLevel, CrewQuality);

	if (!PBRollFailure(Rng, FailChance)) {
		FFailureEvent E; E.Component = Component.Id; return E; // no failure
	}

	const EPartFailureSeverity Severity = PBRollFailureSeverity(Rng);
	FFailureEvent E;
	E.bOccurred = true;
	E.Severity = Severity;
	E.Component = Component.Id;
	E.PerformanceLoss = PBCalculatePerformanceLoss(Rng, Severity);
	E.bIsTerminal = (Severity == EPartFailureSeverity::Terminal);
	return E;
}

FBikeComponent PBApplyWear(const FBikeComponent& Component, double MileageThisRound)
{
	const double WearIncrease = (MileageThisRound / 500.0) * 5.0; // ~1 wear per 100 miles
	FBikeComponent Out = Component;
	Out.Wear = std::min(100.0, Component.Wear + WearIncrease);
	Out.MileageMiles = Component.MileageMiles + MileageThisRound;
	return Out;
}

FBikeComponent PBRebuildComponent(const FBikeComponent& Component, int RoundNumber)
{
	FBikeComponent Out = Component;
	Out.Wear = 0;
	Out.MileageMiles = 0;
	Out.LastRebuild = RoundNumber;
	return Out;
}

double PBEstimateRebuildCost(const FBikeComponent& Component, double BaseEngineCost)
{
	double Mult = 0.5;
	if      (Component.Type == "engine")      Mult = 1.0;
	else if (Component.Type == "gearbox")     Mult = 0.6;
	else if (Component.Type == "suspension")  Mult = 0.4;
	else if (Component.Type == "brakes")      Mult = 0.3;
	else if (Component.Type == "chassis")     Mult = 0.5;
	else if (Component.Type == "electronics") Mult = 0.35;
	return static_cast<double>(std::llround(BaseEngineCost * 0.3 * Mult));
}
