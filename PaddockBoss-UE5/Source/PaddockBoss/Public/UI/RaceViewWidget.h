#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "GameData.h"
#include "RaceViewWidget.generated.h"

class AGameAPIManager;
class UTextBlock;
class UButton;
class UImage;
class UVerticalBox;
class UHorizontalBox;
class UScrollBox;

UCLASS()
class PADDOCKBOSS_API URaceViewWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	virtual void NativeConstruct() override;
	virtual void NativeDestruct() override;

	UPROPERTY(BlueprintReadWrite, Category = "Race")
	int32 CurrentLap = 0;

	UPROPERTY(BlueprintReadWrite, Category = "Race")
	int32 TotalLaps = 20;

	UPROPERTY(BlueprintReadWrite, Category = "Race")
	float LeaderDistance = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "API")
	AGameAPIManager* APIManager;

	UFUNCTION(BlueprintCallable, Category = "Race")
	void StartBroadcastStream();

	UFUNCTION(BlueprintCallable, Category = "Race")
	void UpdateRaceData();

	UFUNCTION(BlueprintCallable, Category = "Race")
	void OnRaceDataReceived(bool bSuccess, FString Data);

	UFUNCTION(BlueprintCallable, Category = "Actions")
	void OnReturnToHubClicked();

	UFUNCTION(BlueprintCallable, Category = "API")
	void SetAPIManager(AGameAPIManager* InAPIManager);

protected:
	virtual void NativePreConstruct() override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* RaceHeaderText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* LapCounterText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* LeaderNameText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* LeaderDistanceText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* PlayerPositionText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* PlayerTimeGapText;

	UPROPERTY(meta = (BindWidget))
	UScrollBox* RaceResultsScroll;

	UPROPERTY(meta = (BindWidget))
	UVerticalBox* RaceResultsList;

	UPROPERTY(meta = (BindWidget))
	UButton* ReturnToHubButton;

	float RaceElapsedTime = 0.0f;
	FTimerHandle UpdateTimerHandle;

	void SetupButtonCallbacks();
	void UpdateRaceDisplay();
	void PopulateRaceResults();
};
