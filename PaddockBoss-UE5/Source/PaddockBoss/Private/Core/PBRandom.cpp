// PBRandom implementation — see Core/PBRandom.h for the determinism contract.

#include "Core/PBRandom.h"

uint32 PBHashString(const FString& S)
{
	// FNV-1a, port of hashString() in rng.ts. Iterates UTF-16 code units,
	// matching JS charCodeAt; ASCII seeds (team/rider ids) hash identically.
	uint32 H = 2166136261u;
	for (int32 I = 0; I < S.Len(); ++I)
	{
		H ^= static_cast<uint32>(S[I]);
		H = FPBRandom::Imul(H, 16777619u);
	}
	return H;
}
