#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "GameData.h"
#include "RaceViewWidget.generated.h"

class AGameAPIManager;
class UTextBlock;
class UButton;
class UBorder;
class UVerticalBox;
class UScrollBox;

DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnReturnToHub);

/**
 * Live race timing screen, native C++ UMG (no Blueprint required) — mirrors the
 * web RaceView: left timing tower (position, team colour bar, rider, gap; DNFs
 * and below-cut player riders pinned), right column with track/weather/lap head,
 * scrolling incident feed, and a Return-to-Hub button. Dark broadcast theme.
 *
 * Create with CreateWidget<URaceViewWidget>(PC), call SetBroadcast() with data,
 * AddToViewport.
 */
UCLASS()
class PADDOCKBOSS_API URaceViewWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	virtual bool Initialize() override;

	UPROPERTY(BlueprintReadOnly, Category = "Race")
	FRaceBroadcast Broadcast;

	UPROPERTY(BlueprintReadWrite, Category = "API")
	AGameAPIManager* APIManager = nullptr;

	UPROPERTY(BlueprintAssignable, Category = "Race")
	FOnReturnToHub OnReturnToHub;

	/** Replace the broadcast state and repaint (call each lap tick). */
	UFUNCTION(BlueprintCallable, Category = "Race")
	void SetBroadcast(const FRaceBroadcast& InBroadcast);

	UFUNCTION(BlueprintCallable, Category = "API")
	void SetAPIManager(AGameAPIManager* InAPIManager) { APIManager = InAPIManager; }

protected:
	UPROPERTY(Transient) UVerticalBox* TowerRowsBox = nullptr;
	UPROPERTY(Transient) UScrollBox* FeedScroll = nullptr;
	UPROPERTY(Transient) UTextBlock* TrackText = nullptr;
	UPROPERTY(Transient) UTextBlock* WeatherText = nullptr;
	UPROPERTY(Transient) UTextBlock* LapText = nullptr;

	UFUNCTION() void HandleReturnClicked();

	void BuildLayout();
	void RebuildTower();
	void RebuildFeed();

	UBorder* MakeCard(const FLinearColor& Fill, float Radius) const;
	UTextBlock* MakeText(const FString& Value, int32 Size, const FLinearColor& Color, bool bBold = true) const;
	static FLinearColor FeedColor(const FString& Kind);
};
