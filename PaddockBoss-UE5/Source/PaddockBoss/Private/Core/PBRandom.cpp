// PBRandom implementation — see Core/PBRandom.h for the determinism contract.

#include "Core/PBRandom.h"

uint32_t PBHashString(const std::string& S)
{
	// FNV-1a, port of hashString() in rng.ts. Iterates bytes, matching JS
	// charCodeAt for ASCII seeds (team/rider ids), which hash identically.
	uint32_t H = 2166136261u;
	for (unsigned char C : S)
	{
		H ^= static_cast<uint32_t>(C);
		H = FPBRandom::Imul(H, 16777619u);
	}
	return H;
}
