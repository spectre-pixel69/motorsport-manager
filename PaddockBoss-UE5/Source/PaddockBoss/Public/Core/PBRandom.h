// PBRandom — deterministic seeded RNG for Paddock Boss.
//
// Direct C++ port of src/util/rng.ts (mulberry32). This is the single source
// of every simulated outcome: same seed => same season, exactly as in the
// TypeScript engine. The port is bit-for-bit identical because every JS
// operation used by mulberry32 (Math.imul, >>>, | 0, ^) reduces to modulo-2^32
// integer arithmetic, which uint32 reproduces natively; the only floating step
// is the final divide by 2^32.
//
// DO NOT "optimize" the arithmetic here. The exact operation order (and the
// three Next() calls inside Gauss) is load-bearing for determinism.

#pragma once

#include "CoreMinimal.h"

/**
 * mulberry32 generator. Construct with a uint32 seed; each Next() advances the
 * state and returns a double in [0, 1). Value-type: copy it to fork a stream.
 */
struct PADDOCKBOSS_API FPBRandom
{
	uint32 State;

	explicit FPBRandom(uint32 InSeed = 0)
		: State(InSeed)
	{
	}

	/** Next uniform double in [0, 1). Mirrors mulberry32()() in rng.ts. */
	double Next()
	{
		// a = (a + 0x6d2b79f5) | 0;   (32-bit wrapping add)
		State = State + 0x6d2b79f5u;
		uint32 A = State;
		// t = Math.imul(a ^ (a >>> 15), 1 | a);
		uint32 T = Imul(A ^ (A >> 15), 1u | A);
		// t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		T = (T + Imul(T ^ (T >> 7), 61u | T)) ^ T;
		// return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		return static_cast<double>(T ^ (T >> 14)) / 4294967296.0;
	}

	/** 32-bit truncating multiply — the C++ equivalent of JS Math.imul. */
	static FORCEINLINE uint32 Imul(uint32 X, uint32 Y)
	{
		return X * Y; // uint32 multiply wraps mod 2^32, identical bit pattern
	}
};

/** FNV-1a over a string's code units — port of hashString() in rng.ts. */
PADDOCKBOSS_API uint32 PBHashString(const FString& S);

/** Convenience: build an FPBRandom seeded from a string (hashString + mulberry32). */
PADDOCKBOSS_API FORCEINLINE FPBRandom PBRandomFromString(const FString& S)
{
	return FPBRandom(PBHashString(S));
}

// ---- Uniform helpers (ports of pick / irange / gauss / clamp / shuffle) ----

/** arr[floor(rng() * len)] — port of pick(). Array must be non-empty. */
template <typename T>
const T& PBPick(FPBRandom& Rng, const TArray<T>& Arr)
{
	const int32 Index = static_cast<int32>(Rng.Next() * Arr.Num());
	return Arr[Index];
}

/** Inclusive integer in [Min, Max] — port of irange(). */
PADDOCKBOSS_API FORCEINLINE int32 PBIRange(FPBRandom& Rng, int32 Min, int32 Max)
{
	return Min + static_cast<int32>(Rng.Next() * (Max - Min + 1));
}

/**
 * Normal-ish value via sum of three uniforms — port of gauss().
 * Calls Next() exactly three times, in order; do not reorder.
 */
PADDOCKBOSS_API FORCEINLINE double PBGauss(FPBRandom& Rng, double Mean, double Spread)
{
	const double R1 = Rng.Next();
	const double R2 = Rng.Next();
	const double R3 = Rng.Next();
	return Mean + (R1 + R2 + R3 - 1.5) * Spread;
}

/** Clamp helper matching clamp() in rng.ts. */
PADDOCKBOSS_API FORCEINLINE double PBClamp(double V, double Min, double Max)
{
	return FMath::Max(Min, FMath::Min(Max, V));
}

/**
 * In-place Fisher-Yates from the tail — port of shuffle(). Uses the same
 * index math (floor(rng() * (i + 1))) so a shared seed reproduces the TS order.
 */
template <typename T>
void PBShuffle(FPBRandom& Rng, TArray<T>& Arr)
{
	for (int32 I = Arr.Num() - 1; I > 0; --I)
	{
		const int32 J = static_cast<int32>(Rng.Next() * (I + 1));
		Arr.Swap(I, J);
	}
}

/** Pick N distinct elements without replacement — port of pickN(). */
template <typename T>
TArray<T> PBPickN(FPBRandom& Rng, const TArray<T>& Arr, int32 N)
{
	TArray<T> Copy = Arr;
	TArray<T> Out;
	for (int32 I = 0; I < N && Copy.Num() > 0; ++I)
	{
		const int32 Index = static_cast<int32>(Rng.Next() * Copy.Num());
		Out.Add(Copy[Index]);
		Copy.RemoveAt(Index);
	}
	return Out;
}
