#pragma once

#include "CoreMinimal.h"
#include "GameData.generated.h"

USTRUCT(BlueprintType)
struct FTeamVitals
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float Balance = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Prestige = 50;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float Reliability = 80.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 RDLevel = 1;
};

USTRUCT(BlueprintType)
struct FRiderStanding
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString RiderName = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Points = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Position = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	bool bIsPlayerRider = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FLinearColor AccentColor = FLinearColor(0.24f, 0.63f, 0.85f, 1.0f);
};

USTRUCT(BlueprintType)
struct FTeamStandingRow
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString TeamName = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Points = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Position = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	bool bIsPlayerTeam = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FLinearColor AccentColor = FLinearColor(0.18f, 0.77f, 0.71f, 1.0f);
};

USTRUCT(BlueprintType)
struct FNextRace
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString TrackName = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString Location = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString Discipline = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Round = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 TotalRounds = 20;
};

USTRUCT(BlueprintType)
struct FMediaFeed
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString Title = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString Content = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString Author = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float Impact = 0.5f;
};

USTRUCT(BlueprintType)
struct FHubScreenData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString TeamName = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString Season = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Rank = 1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 TotalTeams = 20;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FTeamVitals TeamVitals;

	// Top money bar (reference hub screen): BALANCE / INFLUENCE / NET SPEND
	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Influence = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float NetSpend = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float SeasonProgress = 0.4f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FNextRace NextRace;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<FRiderStanding> TopRiders;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<FTeamStandingRow> TeamStandings;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<FRiderStanding> DriverStandings;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<FMediaFeed> RyansBriefing;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<FMediaFeed> TrackDays;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FLinearColor PrimaryColor = FLinearColor(0.18f, 0.12f, 0.35f, 1.0f);

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FLinearColor SecondaryColor = FLinearColor(0.1f, 0.08f, 0.22f, 1.0f);
};

// ============================================================================
// RACE VIEW (live timing tower — mirrors the web RaceView)
// ============================================================================

USTRUCT(BlueprintType)
struct FRaceTowerRow
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Position = 0;                 // 0 or negative renders as "–" (DNF)

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Number = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString RiderName = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString Gap = FString();            // "Leader", "+1.4s", "OUT"

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FLinearColor TeamColor = FLinearColor(0.24f, 0.63f, 0.85f, 1.0f);

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	bool bIsPlayer = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	bool bDnf = false;
};

USTRUCT(BlueprintType)
struct FRaceFeedItem
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Lap = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString Kind = FString();           // crash | mechanical | overtake | fastLap | remount

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString Text = FString();
};

USTRUCT(BlueprintType)
struct FRaceBroadcast
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString TrackName = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString SessionName = FString();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Lap = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 TotalLaps = 20;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	bool bWet = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	bool bFinished = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<FRaceTowerRow> Tower;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TArray<FRaceFeedItem> Feed;
};
