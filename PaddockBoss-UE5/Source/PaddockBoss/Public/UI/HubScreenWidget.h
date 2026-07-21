#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "GameData.h"
#include "HubScreenWidget.generated.h"

class AGameAPIManager;
class UTextBlock;
class UButton;
class UProgressBar;
class UImage;
class UVerticalBox;
class UHorizontalBox;

UCLASS()
class PADDOCKBOSS_API UHubScreenWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	virtual void NativeConstruct() override;
	virtual void NativeDestruct() override;

	UPROPERTY(BlueprintReadWrite, Category = "Hub")
	FHubScreenData CurrentHubData;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "API")
	AGameAPIManager* APIManager;

	UFUNCTION(BlueprintCallable, Category = "Hub")
	void RefreshHubData();

	UFUNCTION(BlueprintCallable, Category = "Hub")
	void OnHubDataReceived(bool bSuccess, FHubScreenData Data);

	UFUNCTION(BlueprintCallable, Category = "Actions")
	void OnGoRacingClicked();

	UFUNCTION(BlueprintCallable, Category = "Actions")
	void OnShowroomClicked();

	UFUNCTION(BlueprintCallable, Category = "Actions")
	void OnGarageClicked();

	UFUNCTION(BlueprintCallable, Category = "Actions")
	void OnTrainingClicked();

	UFUNCTION(BlueprintCallable, Category = "Actions")
	void OnRDCenterClicked();

	UFUNCTION(BlueprintCallable, Category = "Actions")
	void OnExitClicked();

	UFUNCTION(BlueprintCallable, Category = "API")
	void SetAPIManager(AGameAPIManager* InAPIManager);

protected:
	virtual void NativePreConstruct() override;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* TeamNameText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* SeasonInfoText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* RankText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* BalanceText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* PrestigeText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* ReliabilityText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* RDLevelText;

	UPROPERTY(meta = (BindWidget))
	UProgressBar* SeasonProgressBar;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* NextTrackText;

	UPROPERTY(meta = (BindWidget))
	UTextBlock* NextRaceInfoText;

	UPROPERTY(meta = (BindWidget))
	UButton* GoRacingButton;

	UPROPERTY(meta = (BindWidget))
	UButton* ShowroomButton;

	UPROPERTY(meta = (BindWidget))
	UButton* GarageButton;

	UPROPERTY(meta = (BindWidget))
	UButton* TrainingButton;

	UPROPERTY(meta = (BindWidget))
	UButton* RDCenterButton;

	UPROPERTY(meta = (BindWidget))
	UButton* ExitButton;

	UPROPERTY(meta = (BindWidget))
	UVerticalBox* TopRidersPanel;

	UPROPERTY(meta = (BindWidget))
	UVerticalBox* BriefingPanel;

	UPROPERTY(meta = (BindWidget))
	UVerticalBox* TrackDaysPanel;

	void SetupButtonCallbacks();
	void UpdateVisuals();
	void PopulateTopRiders();
	void PopulateBriefing();
	void PopulateTrackDays();

	FLinearColor GetVitalColor(float Value, bool bIsPercentage = true);
};
