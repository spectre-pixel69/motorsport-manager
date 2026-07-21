// PBTypes string conversions — spellings mirror the TS string-literal unions
// exactly (ids/keys are hashed for seeding and serialized in saves).

#include "Core/PBTypes.h"

std::string PBToString(EDisciplineId V)
{
	switch (V) {
	case EDisciplineId::GP:   return "gp";
	case EDisciplineId::SBK:  return "sbk";
	case EDisciplineId::NAMC: return "namc";
	}
	return "namc";
}

std::string PBToString(EClassId V)
{
	switch (V) {
	case EClassId::GP1:   return "gp1";
	case EClassId::GP2:   return "gp2";
	case EClassId::GP3:   return "gp3";
	case EClassId::SBK:   return "sbk";
	case EClassId::SS600: return "ss600";
	case EClassId::SS300: return "ss300";
	case EClassId::C350:  return "c350";
	case EClassId::C250:  return "c250";
	case EClassId::C250P: return "c250p";
	case EClassId::Women: return "women";
	}
	return "c350";
}

std::string PBToString(EChampionshipId V)
{
	switch (V) {
	case EChampionshipId::Road:       return "road";
	case EChampionshipId::FourStroke: return "fourStroke";
	case EChampionshipId::TwoStroke:  return "twoStroke";
	}
	return "road";
}

std::string PBToString(EEngineMode V)
{
	switch (V) {
	case EEngineMode::Conserve: return "conserve";
	case EEngineMode::Standard: return "standard";
	case EEngineMode::Push:     return "push";
	case EEngineMode::Attack:   return "attack";
	}
	return "standard";
}

EDisciplineId PBDisciplineFromString(const std::string& S)
{
	if (S == "gp")  return EDisciplineId::GP;
	if (S == "sbk") return EDisciplineId::SBK;
	return EDisciplineId::NAMC;
}

EClassId PBClassFromString(const std::string& S)
{
	if (S == "gp1")   return EClassId::GP1;
	if (S == "gp2")   return EClassId::GP2;
	if (S == "gp3")   return EClassId::GP3;
	if (S == "sbk")   return EClassId::SBK;
	if (S == "ss600") return EClassId::SS600;
	if (S == "ss300") return EClassId::SS300;
	if (S == "c350")  return EClassId::C350;
	if (S == "c250")  return EClassId::C250;
	if (S == "c250p") return EClassId::C250P;
	if (S == "women") return EClassId::Women;
	return EClassId::C350;
}

EChampionshipId PBChampionshipFromString(const std::string& S)
{
	if (S == "fourStroke") return EChampionshipId::FourStroke;
	if (S == "twoStroke")  return EChampionshipId::TwoStroke;
	return EChampionshipId::Road;
}

EEngineMode PBEngineModeFromString(const std::string& S)
{
	if (S == "conserve") return EEngineMode::Conserve;
	if (S == "push")     return EEngineMode::Push;
	if (S == "attack")   return EEngineMode::Attack;
	return EEngineMode::Standard;
}
