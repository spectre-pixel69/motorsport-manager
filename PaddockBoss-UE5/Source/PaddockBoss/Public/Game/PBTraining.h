// PBTraining — skill development, stamina, age decline, overall rating.
//
// Port of src/game/training.ts. calculateOverall reproduces the TS weighting
// verbatim (including its unusual >100 scale) — faithful port, not a redesign.
// Determinism fix: overtrain injury risk now takes the seeded FPBRandom.

#pragma once

#include <unordered_map>
#include "Core/PBTypes.h"
#include "Core/PBRandom.h"

/** The 9 trainable skills (keyof RiderSkills in TS). */
enum class ESkill { Pace, Braking, CornerSpeed, Racecraft, Consistency, Starts, Fitness, Wet, Feedback };

double  PBGetSkill(const FRiderSkills& S, ESkill Which);
void    PBSetSkill(FRiderSkills& S, ESkill Which, double Value);

struct FTrainingResult {
	double SkillGain = 0;
	double NewSkillValue = 0;
	double StaminaCost = 0;
	bool bOvertrained = false;   // stamina dropped below 20
	double InjuryRisk = 0;       // if overtrained, 0-100 chance
};

double PBCalculateTrainingGain(const FRider& Rider, ESkill SkillFocus, int FacilityLevel, double CoachQuality);

FTrainingResult PBTrainRider(FPBRandom& Rng, const FRider& Rider, ESkill SkillFocus, int FacilityLevel, double CoachQuality);

double PBRegenStamina(double CurrentStamina, int DaysResting);

/** Age decline (32+): map of changed skills -> new value. Empty if under 32. */
std::unordered_map<ESkill, double> PBApplyAgeDecline(const FRider& Rider, EDisciplineId Discipline);

/** Discipline-weighted headline rating. Mirrors calculateOverall() exactly. */
double PBCalculateOverall(const FRiderSkills& Skills, EDisciplineId Discipline);
