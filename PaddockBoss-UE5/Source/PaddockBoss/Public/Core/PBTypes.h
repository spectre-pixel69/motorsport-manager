// PBTypes — core data model for Paddock Boss (engine-agnostic).
//
// Direct C++ port of src/data/types.ts, the data-model source of truth. Uses
// only the standard library so the whole game core compiles + runs headless
// and inside Unreal alike. Enums that were string-literal unions in TS keep a
// string form (see PBTypes.cpp) because ids/keys are hashed for seeding and
// serialized in saves; the string spelling is load-bearing.
//
// UPROPERTY/Blueprint-facing mirrors of these live in the UE adapter layer,
// not here — the core stays engine-free.

#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <unordered_map>
#include <optional>

// ============================================================================
// ID ENUMS (string-backed — see To/FromString in PBTypes.cpp)
// ============================================================================

enum class EDisciplineId { GP, SBK, NAMC };

/** GP: gp3->gp2->gp1 ; SBK: ss300->ss600->sbk ; NAMC: c250p->c250->c350 (+women) */
enum class EClassId { GP1, GP2, GP3, SBK, SS600, SS300, C350, C250, C250P, Women };

/** NAMC runs two parallel championships. Road disciplines use Road. */
enum class EChampionshipId { Road, FourStroke, TwoStroke };

enum class EEngineMode { Conserve, Standard, Push, Attack };
enum class EPartFailureSeverity { Minor, Moderate, Terminal };
enum class EManufacturerReliability { Fragile, Balanced, Bulletproof };
enum class EManufacturerFinancialState { Stable, Stressed, Crisis, Recovering };
enum class EConcessionTier { A, B, C, D };
enum class ELegacyPlate { None, Gold, Platinum, Diamond };

std::string PBToString(EDisciplineId V);
std::string PBToString(EClassId V);
std::string PBToString(EChampionshipId V);
std::string PBToString(EEngineMode V);
EDisciplineId PBDisciplineFromString(const std::string& S);
EClassId PBClassFromString(const std::string& S);
EChampionshipId PBChampionshipFromString(const std::string& S);
EEngineMode PBEngineModeFromString(const std::string& S);

// ============================================================================
// PENALTY SYSTEM (v15.3 §13.1, §13.5, §12.4)
// ============================================================================

/** 1=warning, 2=fine, 3=suspension, 4=charter revocation. */
using EPenaltyTier = int;

enum class EPenaltyReason {
	AggressiveRiding, RecklessConduct, Unsportsmanlike,
	BallastManipulation, NonHomologatedEngine, TechnicalViolation,
	RulesInfraction, PitLaneInfraction, DriverAidViolation
};

struct FPenalty {
	std::string Id;
	int IssuedRound = 0;
	EPenaltyTier Tier = 1;
	EPenaltyReason Reason = EPenaltyReason::RulesInfraction;
	std::string Description;
	double FineAmount = 0.0;                     // Tier 2 (all to Welfare Fund)
	int SuspensionRounds = 0;                    // Tier 3 (1-4 consecutive)
	int SuspensionStart = 0;
	int PointsForfeited = 0;
	int ResolvedRound = -1;                       // when suspension ends
	// Terminal Technical Violations (§12.4)
	bool bIsTerminalViolation = false;
	std::vector<std::string> AffectedRiders;      // riderId[] DQ'd this round
	std::unordered_map<std::string, int> PointsForfeitedByRound; // riderId -> pts lost
};
using FCharterPenalty = FPenalty; // §13.1 charter-record alias

struct FWelfareFineEntry {
	int Round = 0;
	std::string TeamId;
	double Amount = 0.0;
	std::string Reason;
};
struct FRiderWelfareFund {
	double TotalAccumulated = 0.0;
	std::vector<FWelfareFineEntry> FineHistory;
};

// ============================================================================
// RIDERS
// ============================================================================

enum class ERiderTrait {
	WetMaster, HoleshotKing, LateBraker, IceVeins, DevelopmentGuru, FanFavorite,
	Fragile, Reckless, SlowStarter
};

struct FRiderSkills {
	double Pace = 0, Braking = 0, CornerSpeed = 0, Racecraft = 0, Consistency = 0;
	double Starts = 0, Fitness = 0, Wet = 0, Feedback = 0; // each 0-100 exact
};

struct FRiderStats { // legacy 6-stat block, kept for compatibility
	double Pace = 0, Consistency = 0, Starts = 0, Aggression = 0, Fitness = 0, Wet = 0;
};

struct FRiderContract {
	double Salary = 0;         // per season
	int Length = 1;            // 1-4 years
	double SigningBonus = 0;
	double WinBonus = 0;
	double PodiumBonus = 0;
	double TitleBonus = 0;
	double PurseShareTeamPct = 0; // 0-25 HARD CAP
	bool bIsNo1Rider = false;
	double ReleaseClause = 0;  // 0 = none
	bool bHasTeammateVeto = false;
};

struct FGatePreferenceProfile {
	double HoleshotPreferenceScore = 0;
	double InsideOutsideBias = 0;        // -100..+100
	double ConditionAdaptationSkill = 0;
	double RiskTolerance = 0;
	std::string TrackTypePreference = "balanced"; // hardpack|loam|clay|sandy|balanced
	double WetWeatherGateAdjustment = 0;
	double MentalPreparationRigor = 0;
	double PhysicalGateComfort = 0;
	double DirtQualitySensitivity = 0;
	double CompetitiveAggressionIndex = 0;
	std::string GateArchetype = "conservative"; // holeshot-king|gambler|smooth-operator|...
};

/** Mental state — incremental, never whiplash (no single event moves a dial >±3). */
struct FRiderMentalState {
	double Confidence = 50; // baseline 50
	double Tilt = 0;        // baseline 0
	double Fatigue = 0;     // baseline 0
	double AngerCharge = 0; // baseline 0, halves each round
	int ConsecutiveWins = 0;
	int ConsecutivePodiums = 0;
	bool bPeakForm = false;
	std::vector<std::string> LastEvents;
};

struct FRider {
	std::string Id;
	std::string Name;
	int Age = 0;
	std::string Nationality;
	int Number = 0;
	FRiderStats Stats;
	FRiderSkills Skills;
	double Overall = 0;    // derived headline rating
	double Potential = 0;  // HIDDEN growth ceiling
	double Stamina = 0;    // 0-100 training resource
	std::vector<ERiderTrait> Traits;
	double Salary = 0;
	FRiderContract Contract;
	FGatePreferenceProfile GatePreference;
	std::optional<FRiderMentalState> Mental; // lazily initialized
	double Morale = 0;     // 0-100
	int InjuredForRounds = 0;
	int CareerWins = 0;
	int CareerPodiums = 0;
	int Championships = 0;
	ELegacyPlate LegacyPlate = ELegacyPlate::None;
	bool bIsFemale = false;
	std::optional<std::string> TeamId;   // null => free agent
	std::optional<EClassId> ClassId;     // class they race in
	EChampionshipId Championship = EChampionshipId::Road;
	int SeasonsInCurrentClass = 0;       // 250P max 2-season limit (§3.2)
	bool bBench = false;
	std::optional<std::string> SubbingFor;
	double BallastKg = 0;                // BOP success ballast
	int SuspendedForRounds = 0;          // §13.1 countdown
	std::string SuspensionReason;
	std::optional<EConcessionTier> ConcessionTier; // GP
	int GridPenaltyPositions = 0;        // GP
	int Race2GridPenalty = 0;            // SBK
	double LastRaceAverageFuelPerLap = 0;// SBK
};

// ============================================================================
// BIKES
// ============================================================================

struct FBikeComponent {
	std::string Id;
	std::string Name;
	std::string Type;      // engine|gearbox|suspension|brakes|chassis|electronics
	double Reliability = 0;// 0-100 base failure rate
	double Wear = 0;       // 0-100 accumulates, multiplies failure chance
	double MileageMiles = 0;
	int LastRebuild = -1;  // round of last rebuild
};

struct FBikeSetup {
	EEngineMode EngineMode = EEngineMode::Standard;
	std::unordered_map<std::string, FBikeComponent> Components; // keyed by type
	double MileageThisRound = 0;
};

struct FBikeDev {
	double Engine = 0;      // 1-100
	double Handling = 0;
	double Reliability = 0;
};

// ============================================================================
// TEAMS / ORGS
// ============================================================================

struct FLogoSpec {
	int MarkId = 0;        // 0-29 base emblem
	int ContainerId = 0;   // 0-5
	int StyleId = 0;       // 0-3
	std::string Primary;   // hex
	std::string Secondary;
	std::string Accent;
	std::string Initials;
	std::optional<std::string> Custom; // uploaded logo dataURL
};

struct FTeam {
	std::string Id;
	std::string Name;
	std::string ShortName;  // 3-4 letters for timing tower
	EDisciplineId Discipline = EDisciplineId::NAMC;
	EChampionshipId Championship = EChampionshipId::Road;
	std::string OrgId;      // shared across dual-charter halves
	bool bDualCharter = false;
	std::string ColorPrimary;
	std::string ColorSecondary;
	FLogoSpec Logo;
	std::string ManufacturerId;
	std::string TireBrandId; // NAMC only
	FBikeDev Bike;
	FBikeSetup BikeSetup;
	double Budget = 0;       // cash on hand
	double Prestige = 0;     // 1-100
	bool bIsPlayer = false;
	int Strikes = 0;         // legacy three-strike
	std::vector<EClassId> ClassIds;
	int FacilityLevel = 1;   // 1-5
	double CoachQuality = 1; // 0.8-1.5
	std::vector<FCharterPenalty> Penalties; // §13.1 charter record
	bool bCharterRevoked = false;
	int DevelopmentTokensUsed = 0;   // GP
	double FuelConsumptionBaseline = 0; // SBK
};

struct FManufacturer {
	std::string Id;
	std::string Name;
	std::string Color;
	std::string Strokes;   // "2S" | "4S" | "both"
	EManufacturerReliability ReliabilityBias = EManufacturerReliability::Balanced;
	double PerformanceCeiling = 0;
	double CashOnHand = 0;
	EManufacturerFinancialState FinancialState = EManufacturerFinancialState::Stable;
	double ProductionCapacity = 1; // 0-1 fraction of orders fulfilled
	double BaseEngineCost = 0;
	double CostMultiplier = 1;     // crisis 1.5 / stressed 1.2 / stable 1.0
};

struct FSponsor {
	std::string Id;
	std::string Name;
	std::string Color;
	std::string Tier; // title|major|minor
};

struct FTireBrand {
	std::string Id;
	std::string Name;
	std::string Color;
	double Grip = 0;       // 1-100 hidden
	double Durability = 0;
};

// ============================================================================
// TRACKS / CLASSES / CALENDAR
// ============================================================================

struct FTrack {
	std::string Id;
	std::string Name;
	std::string Location;
	EDisciplineId Discipline = EDisciplineId::NAMC;
	std::string Kind;      // road|stadium|outdoor
	double LengthKm = 0;
	double BaseLapSec = 0; // reference lap for a 100-rated rider
	double WeatherBias = 0;// deprecated: use TrackDetails
	std::optional<double> BaseGrip;  // 0.7-1.2 (motocross)
	std::optional<double> Dustiness; // 0.0-0.4 (motocross)
};

struct FClassDef {
	EClassId Id = EClassId::C350;
	std::string Name;
	std::string ShortName;
	EDisciplineId Discipline = EDisciplineId::NAMC;
	int Tier = 1;          // 1 = premier
	int GridSize = 0;
	double SalaryFloor = 0;
	bool bWomenOnly = false;
};

struct FEngineOrder {
	std::string Id;
	std::string TeamId;
	std::string ManufacturerId;
	int OrderedSeason = 0;
	int ExpectedArrivalSeason = 0;
	double Cost = 0;
	bool bRushOrder = false;   // 40% premium
	bool bFulfilled = false;
	int DelayedRounds = 0;
};

enum class ERaceSessionType { Practice, Qualifying, Sprint, Superpole, Main, Race1, Race2 };

struct FCalendarSession {
	ERaceSessionType SessionType = ERaceSessionType::Main;
	bool bEarnPoints = true;
	double PointScale = 1.0;          // 1.0 main, 0.5 sprint
	std::string GridType;             // combined | reversed-top-6
};

struct FCalendarRound {
	int Round = 0;
	std::string TrackId;
	std::string Kind;                 // road|stadium|outdoor
	std::vector<FCalendarSession> Sessions;
};

// ============================================================================
// CHAMPIONSHIP-SPECIFIC EXTENSIONS
// ============================================================================

struct FBoPAdjustmentRecord {
	double RpmLimit = 0;
	double FuelFlowMax = 0;
	double AirRingSize = 0;
	double MinWeight = 0;
};

struct FMotoGPExtension {
	std::unordered_map<std::string, EConcessionTier> ConcessionTiers; // manuf -> tier
	std::unordered_map<std::string, int> DevelopmentTokensUsed;       // manuf -> count
};

struct FSBKExtension {
	std::unordered_map<std::string, FBoPAdjustmentRecord> BopAdjustments; // manuf -> BoP
	int BopLastAdjustedRound = 0;
	bool bGridReversalActive = false;
};

// ============================================================================
// NEWS + TRACK DAYS ARCHIVES
// ============================================================================

enum class ENewsEventType {
	Signing, Injury, Breakout, Rivalry, TransferRumor, ChampionshipDrama,
	TeamConflict, CoachingChange, Comeback, RookieSensation
};

struct FNewsEvent {
	std::string Id;
	int Round = 0;
	double Timestamp = 0;                 // when in season (0-20 NAMC)
	ENewsEventType Type = ENewsEventType::Signing;
	EDisciplineId Discipline = EDisciplineId::NAMC;
	std::optional<std::string> SubjectRiderId;
	std::optional<std::string> SubjectTeamId;
	std::optional<std::string> SecondaryRiderId;
	std::string Headline;
	std::string Body;
	std::unordered_map<std::string, double> RiderMoraleShift; // teamId -> delta
	std::optional<double> PlayerTeamSentiment;                // -10..+10
};

enum class ETrackDaysEventType {
	EngineOptimization, SetupBreakthrough, PartsUpgrade, ReliabilityConcern,
	PerformanceDelta, TireStrategy, WearAnalysis, FuelEfficiency, TechnicalInsight
};

struct FTrackDaysEvent {
	std::string Id;
	int Round = 0;
	ETrackDaysEventType Type = ETrackDaysEventType::TechnicalInsight;
	std::string TeamId;
	std::optional<std::string> RiderId;
	std::string ComponentType;
	std::string Headline;
	std::string Body;
	std::optional<double> PerformanceGain;   // lap ms (can be negative)
	std::optional<double> ReliabilityScore;  // 0-100
	std::optional<double> EstimatedMileage;
	std::vector<std::string> SetupAdjustments;
};

// ============================================================================
// UNIVERSE (seeded world)
// ============================================================================

struct FUniverse {
	uint32_t Seed = 0;
	int Season = 0; // year
	std::unordered_map<std::string, FRider> Riders;
	std::unordered_map<std::string, FTeam> Teams;
	std::unordered_map<std::string, FManufacturer> Manufacturers;
	std::unordered_map<std::string, FSponsor> Sponsors;
	std::unordered_map<std::string, FTireBrand> TireBrands;
	std::unordered_map<std::string, FTrack> Tracks;
	std::unordered_map<EDisciplineId, std::vector<FCalendarRound>> Calendars;
	std::vector<FEngineOrder> EngineOrders;
	std::optional<FMotoGPExtension> GPExtension;
	std::optional<FSBKExtension> SBKExtension;
	std::vector<FNewsEvent> NewsArchive;
	std::vector<FTrackDaysEvent> TrackDaysArchive;
};
