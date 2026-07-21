// PBConstants — NAMC format, economics and points constants (engine-agnostic).
//
// Port of src/data/namc.ts + src/data/classes.ts. These are the LOCKED
// constants (CLAUDE.md): points table 75/60/52/37..., salary floors, purse
// endpoints, 20-round all-outdoor calendar, unified 40-rider gate. The
// rulebook PDF supersedes on conflict — change values here in ONE place.
//
// Computed tables (scaled purses, team-championship purse) use Math.round-
// equivalent rounding (std::llround; positive-only, so identical to JS).

#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <unordered_map>
#include "Core/PBTypes.h"

namespace PBConst {

// ---- format constants (§3, §10, §11) ----
constexpr int NAMC_ROUNDS = 20;   // all-outdoor championship
constexpr int NAMC_GRID = 40;     // unified 40-rider single gate per class
constexpr int CHARTERS_PER_CHAMPIONSHIP = 20;
constexpr int RIDERS_PER_CLASS_PER_TEAM = 2;
constexpr int BENCH_SIZE = 3;     // 2 male + 1 female (§4.8.1)
constexpr int PRACTICE_SESSIONS_PER_WEEKEND = 2;

// race durations (min) — §3.6: Sprint 12+1lap (0.5x), Main 35+2laps (1.0x)
constexpr int RACE_MIN_PRACTICE = 30;
constexpr int RACE_MIN_SPRINT = 12;
constexpr int RACE_MIN_MAIN = 35;

// ---- rider compensation (§4.3/§4.4) ----
constexpr double APPEARANCE_FEE = 1'000;      // per round
constexpr double RESERVE_RETAINER = 50'000;   // bench riders
constexpr double PRO_DEBUT_BONUS = 25'000;    // newly drafted rider

// ---- league revenue split (§5.3) + team pool (§5.4) ----
constexpr double REVENUE_SPLIT_TEAMS = 0.45;
constexpr double REVENUE_SPLIT_RIDERS = 0.25;
constexpr double REVENUE_SPLIT_TIRES = 0.10;
constexpr double REVENUE_SPLIT_LEAGUE = 0.20;
constexpr double TEAM_POOL_BASE_SHARE = 0.60; // 60% equal, 40% merit
constexpr double WEEKLY_LEAGUE_REVENUE = 8'000'000;

// ---- championship purses (§11.3/§11.4/§11.5) ----
constexpr double DUAL_CHARTER_FIRST_PRIZE = 5'000'000;

/** Tier weighting order: 350 > 250 > Women's > 250P Restricted. */
const std::vector<EClassId>& NamcClassIds();

// Round purse tables (§5.2), keyed by class id string ("c350"/"c250"/...).
const std::vector<double>& Purse350();
const std::vector<double>& Purse250();
const std::vector<double>& PurseWomen();
const std::vector<double>& Purse250P();
const std::vector<double>& PurseFor(const std::string& ClassId);

// Salary floors (annual) by class id string.
double SalaryFloor(const std::string& ClassId);

const std::vector<double>& TeamChampionshipPurse();  // §11.3
const std::vector<double>& TireChampionshipPurse();   // §11.5

// ---- points tables (§11.2) ----
const std::vector<double>& NamcMainPoints();    // 75/60/52/37... (40 positions)
const std::vector<double>& NamcSprintPoints();  // each halved
const std::vector<int>&    RoadPoints();        // GP/SBK top 15
const std::vector<int>&    GpMainPoints();
const std::vector<int>&    GpSprintPoints();

double NamcPointsFor(int Pos);        // 1-based; 0 outside 1..40
double NamcSprintPointsFor(int Pos);
int    RoadPointsFor(int Pos);
int    GpMainPointsFor(int Pos);
int    GpSprintPointsFor(int Pos);

// ---- class definitions (§3.1/§4.3) ----
const std::vector<FClassDef>& Classes();
const FClassDef& ClassById(EClassId Id);

// ---- 2027 Master Racing Calendar (§10.2): id, name, location, nation ----
struct FCalendarVenue { std::string Id, Name, Location, Nation; };
const std::vector<FCalendarVenue>& Namc2027Calendar();

} // namespace PBConst
