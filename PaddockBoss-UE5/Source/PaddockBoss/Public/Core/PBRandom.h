// PBRandom — deterministic seeded RNG for Paddock Boss (engine-agnostic core).
//
// Direct C++ port of src/util/rng.ts (mulberry32). This is the single source
// of every simulated outcome: same seed => same season, exactly as the old
// TypeScript engine behaved. The port is bit-for-bit identical because every
// JS operation used by mulberry32 (Math.imul, >>>, | 0, ^) reduces to
// modulo-2^32 integer arithmetic, which uint32_t reproduces natively; the only
// floating step is the final divide by 2^32.
//
// This header intentionally depends on NOTHING from Unreal. It compiles inside
// the UE module and standalone with g++/clang, so the whole game core can be
// run and verified headless. The UE layer (widgets/actors) calls into it.
//
// DO NOT "optimize" the arithmetic here. The exact operation order (and the
// three Next() calls inside PBGauss) is load-bearing for determinism.

#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <algorithm>

/**
 * mulberry32 generator. Construct with a uint32 seed; each Next() advances the
 * state and returns a double in [0, 1). Value-type: copy it to fork a stream.
 */
struct FPBRandom
{
	uint32_t State;

	explicit FPBRandom(uint32_t InSeed = 0)
		: State(InSeed)
	{
	}

	/** Next uniform double in [0, 1). Mirrors mulberry32()() in rng.ts. */
	double Next()
	{
		// a = (a + 0x6d2b79f5) | 0;   (32-bit wrapping add)
		State = State + 0x6d2b79f5u;
		uint32_t A = State;
		// t = Math.imul(a ^ (a >>> 15), 1 | a);
		uint32_t T = Imul(A ^ (A >> 15), 1u | A);
		// t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		T = (T + Imul(T ^ (T >> 7), 61u | T)) ^ T;
		// return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		return static_cast<double>(T ^ (T >> 14)) / 4294967296.0;
	}

	/** 32-bit truncating multiply — the C++ equivalent of JS Math.imul. */
	static inline uint32_t Imul(uint32_t X, uint32_t Y)
	{
		return X * Y; // uint32 multiply wraps mod 2^32, identical bit pattern
	}
};

/** FNV-1a over a string's bytes — port of hashString() in rng.ts. */
uint32_t PBHashString(const std::string& S);

/** Convenience: build an FPBRandom seeded from a string. */
inline FPBRandom PBRandomFromString(const std::string& S)
{
	return FPBRandom(PBHashString(S));
}

// ---- Uniform helpers (ports of pick / irange / gauss / clamp / shuffle) ----

/** arr[floor(rng() * len)] — port of pick(). Array must be non-empty. */
template <typename T>
const T& PBPick(FPBRandom& Rng, const std::vector<T>& Arr)
{
	const size_t Index = static_cast<size_t>(Rng.Next() * Arr.size());
	return Arr[Index];
}

/** Inclusive integer in [Min, Max] — port of irange(). */
inline int PBIRange(FPBRandom& Rng, int Min, int Max)
{
	return Min + static_cast<int>(Rng.Next() * (Max - Min + 1));
}

/**
 * Normal-ish value via sum of three uniforms — port of gauss().
 * Calls Next() exactly three times, in order; do not reorder.
 */
inline double PBGauss(FPBRandom& Rng, double Mean, double Spread)
{
	const double R1 = Rng.Next();
	const double R2 = Rng.Next();
	const double R3 = Rng.Next();
	return Mean + (R1 + R2 + R3 - 1.5) * Spread;
}

/** Clamp helper matching clamp() in rng.ts. */
inline double PBClamp(double V, double Min, double Max)
{
	return std::max(Min, std::min(Max, V));
}

/**
 * In-place Fisher-Yates from the tail — port of shuffle(). Uses the same
 * index math (floor(rng() * (i + 1))) so a shared seed reproduces the order.
 */
template <typename T>
void PBShuffle(FPBRandom& Rng, std::vector<T>& Arr)
{
	for (int I = static_cast<int>(Arr.size()) - 1; I > 0; --I)
	{
		const int J = static_cast<int>(Rng.Next() * (I + 1));
		std::swap(Arr[I], Arr[J]);
	}
}

/** Pick N distinct elements without replacement — port of pickN(). */
template <typename T>
std::vector<T> PBPickN(FPBRandom& Rng, const std::vector<T>& Arr, int N)
{
	std::vector<T> Copy = Arr;
	std::vector<T> Out;
	for (int I = 0; I < N && !Copy.empty(); ++I)
	{
		const size_t Index = static_cast<size_t>(Rng.Next() * Copy.size());
		Out.push_back(Copy[Index]);
		Copy.erase(Copy.begin() + Index);
	}
	return Out;
}
