// PBTraining implementation — see Game/PBTraining.h.

#include "Game/PBTraining.h"
#include <algorithm>
#include <cmath>

static constexpr double BASE_GAIN = 0.3;
static constexpr double SESSION_STAMINA_COST = 15;
static constexpr double STAMINA_REGEN_PER_DAY = 10;

double PBGetSkill(const FRiderSkills& S, ESkill Which)
{
	switch (Which) {
	case ESkill::Pace:        return S.Pace;
	case ESkill::Braking:     return S.Braking;
	case ESkill::CornerSpeed: return S.CornerSpeed;
	case ESkill::Racecraft:   return S.Racecraft;
	case ESkill::Consistency: return S.Consistency;
	case ESkill::Starts:      return S.Starts;
	case ESkill::Fitness:     return S.Fitness;
	case ESkill::Wet:         return S.Wet;
	case ESkill::Feedback:    return S.Feedback;
	}
	return 0;
}

void PBSetSkill(FRiderSkills& S, ESkill Which, double Value)
{
	switch (Which) {
	case ESkill::Pace:        S.Pace = Value; break;
	case ESkill::Braking:     S.Braking = Value; break;
	case ESkill::CornerSpeed: S.CornerSpeed = Value; break;
	case ESkill::Racecraft:   S.Racecraft = Value; break;
	case ESkill::Consistency: S.Consistency = Value; break;
	case ESkill::Starts:      S.Starts = Value; break;
	case ESkill::Fitness:     S.Fitness = Value; break;
	case ESkill::Wet:         S.Wet = Value; break;
	case ESkill::Feedback:    S.Feedback = Value; break;
	}
}

static double AgeModifier(int Age)
{
	if (Age < 22) return 1.5;
	if (Age <= 27) return 1.0;
	if (Age <= 31) return 0.6;
	return 0.3;
}

static double HeadroomModifier(double CurrentSkill, double Potential)
{
	const double Headroom = std::max(0.0, Potential - CurrentSkill);
	return std::min(1.0, Headroom / 20.0); // gains -> 0 as skill nears potential
}

static double FacilityModifier(int FacilityLevel)
{
	switch (FacilityLevel) {
	case 1: return 0.8;
	case 2: return 1.0;
	case 3: return 1.2;
	case 4: return 1.4;
	case 5: return 1.6;
	}
	return 1.0;
}

double PBCalculateTrainingGain(const FRider& Rider, ESkill SkillFocus, int FacilityLevel, double CoachQuality)
{
	const double CurrentSkill = PBGetSkill(Rider.Skills, SkillFocus);
	return BASE_GAIN
		* AgeModifier(Rider.Age)
		* HeadroomModifier(CurrentSkill, Rider.Potential)
		* FacilityModifier(FacilityLevel)
		* CoachQuality;
}

FTrainingResult PBTrainRider(FPBRandom& Rng, const FRider& Rider, ESkill SkillFocus, int FacilityLevel, double CoachQuality)
{
	const double Gain = PBCalculateTrainingGain(Rider, SkillFocus, FacilityLevel, CoachQuality);
	const double NewSkill = std::min(99.0, PBGetSkill(Rider.Skills, SkillFocus) + Gain);
	const double StaminaCost = SESSION_STAMINA_COST;
	const double NewStamina = std::max(0.0, Rider.Stamina - StaminaCost);

	FTrainingResult R;
	R.SkillGain = Gain;
	R.NewSkillValue = NewSkill;
	R.StaminaCost = StaminaCost;
	R.bOvertrained = NewStamina < 20.0;
	R.InjuryRisk = R.bOvertrained ? Rng.Next() * 30.0 : 0.0; // 0-30% (seeded)
	return R;
}

double PBRegenStamina(double CurrentStamina, int DaysResting)
{
	return std::min(100.0, CurrentStamina + STAMINA_REGEN_PER_DAY * DaysResting);
}

std::unordered_map<ESkill, double> PBApplyAgeDecline(const FRider& Rider, EDisciplineId /*Discipline*/)
{
	std::unordered_map<ESkill, double> Decline;
	if (Rider.Age < 32) return Decline;

	// Physical decline: 0.1 + (age-32)*0.05, floored at 30
	const ESkill Physical[] = { ESkill::Pace, ESkill::Fitness, ESkill::Starts };
	for (ESkill Sk : Physical) {
		const double DeclineAmount = 0.1 + (Rider.Age - 32) * 0.05;
		Decline[Sk] = std::max(30.0, PBGetSkill(Rider.Skills, Sk) - DeclineAmount);
	}
	// Experience skills decline slower (0.05), floored at 50
	const ESkill Experience[] = { ESkill::Feedback, ESkill::Racecraft, ESkill::Consistency };
	for (ESkill Sk : Experience) {
		Decline[Sk] = std::max(50.0, PBGetSkill(Rider.Skills, Sk) - 0.05);
	}
	return Decline;
}

double PBCalculateOverall(const FRiderSkills& K, EDisciplineId Discipline)
{
	// Faithful port of calculateOverall(). The `/ 1.0` in TS is a no-op and the
	// resulting scale can exceed 100 — reproduced exactly, not "corrected".
	if (Discipline == EDisciplineId::GP) {
		return std::round(
			K.Braking * 1.4 + K.CornerSpeed * 1.4 + K.Pace * 1.3
			+ (K.Consistency + K.Starts + K.Fitness + K.Wet + K.Feedback + K.Racecraft) / 6.0);
	}
	if (Discipline == EDisciplineId::SBK) {
		return std::round(
			K.Braking * 1.3 + K.Consistency * 1.3 + K.Pace * 1.2
			+ (K.CornerSpeed + K.Starts + K.Fitness + K.Wet + K.Feedback + K.Racecraft) / 6.0);
	}
	if (Discipline == EDisciplineId::NAMC) {
		return std::round(
			K.Starts * 1.4 + K.Fitness * 1.4 + K.Consistency * 1.3
			+ (K.Pace + K.Braking + K.CornerSpeed + K.Wet + K.Feedback + K.Racecraft) / 6.0);
	}
	return std::round(
		(K.Pace + K.Braking + K.CornerSpeed + K.Racecraft + K.Consistency
		 + K.Starts + K.Fitness + K.Wet + K.Feedback) / 9.0);
}
