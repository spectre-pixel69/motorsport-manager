// PBConstants implementation — see Core/PBConstants.h. Computed tables mirror
// namc.ts exactly; rounding uses std::llround (positive-only == JS Math.round).

#include "Core/PBConstants.h"
#include <cmath>

namespace PBConst {

// steps(from, step, n) => [from - step*i]  (port of the namc.ts helper)
static std::vector<double> Steps(double From, double Step, int N)
{
	std::vector<double> Out;
	Out.reserve(N);
	for (int I = 0; I < N; ++I) Out.push_back(From - Step * I);
	return Out;
}

const std::vector<double>& Purse350()
{
	static const std::vector<double> P = []{
		std::vector<double> v = { 75'000, 37'500, 22'500 };
		for (double x : Steps(22'000, 500, 17)) v.push_back(x); // P4-P20
		for (double x : Steps(13'500, 500, 10)) v.push_back(x); // P21-P30
		for (double x : { 8'500, 8'000, 7'500, 7'000, 6'500,    // P31-P35
		                  6'200, 5'900, 5'600, 5'300, 5'000 })  // P36-P40
			v.push_back(x);
		return v;
	}();
	return P;
}

// scaledPurse(winPayout): f=(win-5000)/70000; p -> 5000 + round((p-5000)*f/50)*50
static std::vector<double> ScaledPurse(double WinPayout)
{
	const double F = (WinPayout - 5'000) / (75'000 - 5'000);
	std::vector<double> Out;
	Out.reserve(Purse350().size());
	for (double P : Purse350())
		Out.push_back(5'000 + static_cast<double>(std::llround((P - 5'000) * F / 50.0)) * 50.0);
	return Out;
}

const std::vector<double>& Purse250()   { static const std::vector<double> P = ScaledPurse(40'000); return P; }
const std::vector<double>& PurseWomen() { static const std::vector<double> P = ScaledPurse(20'000); return P; }
const std::vector<double>& Purse250P()  { static const std::vector<double> P = ScaledPurse(20'000); return P; }

const std::vector<double>& PurseFor(const std::string& ClassId)
{
	if (ClassId == "c250")  return Purse250();
	if (ClassId == "c250p") return Purse250P();
	if (ClassId == "women") return PurseWomen();
	return Purse350();
}

double SalaryFloor(const std::string& ClassId)
{
	if (ClassId == "c350")  return 400'000;
	if (ClassId == "c250")  return 200'000;
	if (ClassId == "c250p") return 100'000;
	if (ClassId == "women") return 100'000;
	return 0;
}

const std::vector<double>& TeamChampionshipPurse()
{
	static const std::vector<double> P = []{
		std::vector<double> v = { 400'000, 250'000, 150'000, 100'000, 50'000 };
		for (int I = 0; I < 15; ++I) // 6th-20th: 20k down to 5k
			v.push_back(static_cast<double>(std::llround(20'000 - (15'000.0 * I) / 14.0)));
		return v;
	}();
	return P;
}

const std::vector<double>& TireChampionshipPurse()
{
	static const std::vector<double> P = { 200'000, 125'000, 100'000, 75'000 };
	return P;
}

const std::vector<EClassId>& NamcClassIds()
{
	static const std::vector<EClassId> Ids = { EClassId::C350, EClassId::C250, EClassId::Women, EClassId::C250P };
	return Ids;
}

// ---- points tables (§11.2) ----
const std::vector<double>& NamcMainPoints()
{
	static const std::vector<double> P = {
		75, 60, 52, 37, 36, 35, 34, 33, 32, 31,
		30, 29, 28, 27, 26, 25, 24, 23, 22, 21,
		20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
		10,  9,  8,  7,  6,  5,  4,  3,  2,  1,
	};
	return P;
}
const std::vector<double>& NamcSprintPoints()
{
	static const std::vector<double> P = {
		37.5, 30.0, 26.0, 18.5, 18.0, 17.5, 17.0, 16.5, 16.0, 15.5,
		15.0, 14.5, 14.0, 13.5, 13.0, 12.5, 12.0, 11.5, 11.0, 10.5,
		10.0,  9.5,  9.0,  8.5,  8.0,  7.5,  7.0,  6.5,  6.0,  5.5,
		 5.0,  4.5,  4.0,  3.5,  3.0,  2.5,  2.0,  1.5,  1.0,  0.5,
	};
	return P;
}
const std::vector<int>& RoadPoints()
{
	static const std::vector<int> P = { 25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1 };
	return P;
}
const std::vector<int>& GpMainPoints()
{
	static const std::vector<int> P = []{
		std::vector<int> v = { 25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1 };
		v.resize(40, 0); // P16-40 get 0
		return v;
	}();
	return P;
}
const std::vector<int>& GpSprintPoints()
{
	static const std::vector<int> P = []{
		std::vector<int> v = { 12, 9, 7, 6, 5, 4, 3, 2, 1 };
		v.resize(40, 0); // P10-40 get 0
		return v;
	}();
	return P;
}

double NamcPointsFor(int Pos)       { return (Pos >= 1 && Pos <= 40) ? NamcMainPoints()[Pos - 1] : 0.0; }
double NamcSprintPointsFor(int Pos) { return (Pos >= 1 && Pos <= 40) ? NamcSprintPoints()[Pos - 1] : 0.0; }
int    RoadPointsFor(int Pos)       { return (Pos >= 1 && Pos <= (int)RoadPoints().size()) ? RoadPoints()[Pos - 1] : 0; }
int    GpMainPointsFor(int Pos)     { return (Pos >= 1 && Pos <= 40) ? GpMainPoints()[Pos - 1] : 0; }
int    GpSprintPointsFor(int Pos)   { return (Pos >= 1 && Pos <= 40) ? GpSprintPoints()[Pos - 1] : 0; }

// ---- class definitions (§3.1/§4.3) ----
const std::vector<FClassDef>& Classes()
{
	static const std::vector<FClassDef> C = []{
		std::vector<FClassDef> v;
		auto Add = [&](EClassId Id, const char* Name, const char* Short, EDisciplineId Disc,
		               int Tier, int Grid, double Floor, bool Women = false) {
			FClassDef d; d.Id = Id; d.Name = Name; d.ShortName = Short; d.Discipline = Disc;
			d.Tier = Tier; d.GridSize = Grid; d.SalaryFloor = Floor; d.bWomenOnly = Women;
			v.push_back(d);
		};
		Add(EClassId::GP1,  "GP1 World Championship", "GP1", EDisciplineId::GP, 1, 22, 500'000);
		Add(EClassId::GP2,  "GP2 Intermediate",       "GP2", EDisciplineId::GP, 2, 26, 150'000);
		Add(EClassId::GP3,  "GP3 Lightweight",        "GP3", EDisciplineId::GP, 3, 26,  60'000);
		Add(EClassId::SBK,  "World Superbike",  "SBK",  EDisciplineId::SBK, 1, 22, 250'000);
		Add(EClassId::SS600,"World Supersport", "SS600",EDisciplineId::SBK, 2, 26,  90'000);
		Add(EClassId::SS300,"Supersport 300",   "SS300",EDisciplineId::SBK, 3, 30,  40'000);
		Add(EClassId::C350, "350 Class", "350",  EDisciplineId::NAMC, 1, 40, 400'000);
		Add(EClassId::C250, "250 Class", "250",  EDisciplineId::NAMC, 2, 40, 200'000);
		Add(EClassId::Women,"Women's Pro Class", "WPRO", EDisciplineId::NAMC, 3, 40, 100'000, true);
		Add(EClassId::C250P,"250P Restricted",  "250P", EDisciplineId::NAMC, 4, 40, 100'000);
		return v;
	}();
	return C;
}

const FClassDef& ClassById(EClassId Id)
{
	for (const FClassDef& C : Classes())
		if (C.Id == Id) return C;
	return Classes()[6]; // c350 fallback
}

// ---- 2027 Master Racing Calendar (§10.2) ----
const std::vector<FCalendarVenue>& Namc2027Calendar()
{
	static const std::vector<FCalendarVenue> Cal = {
		{ "fox",         "Fox Raceway",           "Pala, CA",           "USA" },
		{ "estero",      "Estero Beach MX",       "Ensenada, BC",       "MEX" },
		{ "compedge",    "Competitive Edge MX",   "Adelanto, CA",       "USA" },
		{ "motoland",    "Motoland MX Park",      "Casa Grande, AZ",    "USA" },
		{ "hangtown",    "Hangtown MX",           "Rancho Murieta, CA", "USA" },
		{ "washougal",   "Washougal MX Park",     "Washougal, WA",      "USA" },
		{ "motopark",    "Motopark",              "Chilliwack, BC",     "CAN" },
		{ "bigair",      "Big Air Motocross",     "Big Sky, MT",        "USA" },
		{ "thunder",     "Thunder Valley MX",     "Lakewood, CO",       "USA" },
		{ "freestone",   "Freestone MX",          "Wortham, TX",        "USA" },
		{ "springcreek", "Spring Creek MX",       "Millville, MN",      "USA" },
		{ "ironman",     "Ironman Raceway",       "Crawfordsville, IN", "USA" },
		{ "redbud",      "RedBud MX",             "Buchanan, MI",       "USA" },
		{ "southwick",   "Southwick MX",          "Southwick, MA",      "USA" },
		{ "highpoint",   "High Point Raceway",    "Mt. Morris, PA",     "USA" },
		{ "buddscreek",  "Budds Creek MX",        "Mechanicsville, MD", "USA" },
		{ "whistler",    "Whistler MX",           "Whistler, BC",       "CAN" },
		{ "anchorage",   "Anchorage MX",          "Anchorage, AK",      "USA" },
		{ "waikoloa",    "Waikoloa MX",           "Waikoloa, HI",       "USA" },
		{ "glenhelen",   "Glen Helen Raceway",    "Devore, CA",         "USA" }, // FINALE
	};
	return Cal;
}

} // namespace PBConst
