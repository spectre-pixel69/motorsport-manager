#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "PaddockBossGameMode.generated.h"

class UUserWidget;
class URaceViewWidget;
class AGameAPIManager;
class AShowroomStage;

UCLASS()
class PADDOCKBOSS_API APaddockBossGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	APaddockBossGameMode();

	virtual void BeginPlay() override;

	// Optional Blueprint override. Left unset, the native UBossHubWidget
	// (the boss's reference hub) is created directly — no Blueprint needed.
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "UI")
	TSubclassOf<UUserWidget> HubScreenClass;

	UPROPERTY(BlueprintReadWrite, Category = "UI")
	UUserWidget* CurrentHubScreen;

	UPROPERTY(BlueprintReadWrite, Category = "UI")
	URaceViewWidget* CurrentRaceView;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "API")
	AGameAPIManager* APIManager;

	UPROPERTY(BlueprintReadOnly, Category = "Stage")
	AShowroomStage* ShowroomStage;

	UFUNCTION(BlueprintCallable, Category = "UI")
	void ShowHubScreen();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void HideHubScreen();

	UFUNCTION(BlueprintCallable, Category = "API")
	void SetupAPIManager();

	UFUNCTION(BlueprintCallable, Category = "Stage")
	void SetupShowroomStage();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void ShowRaceView();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void HideRaceView();

protected:
	virtual void PostLogin(APlayerController* NewPlayer) override;

	// Hub PROCEED -> race; race Continue -> hub
	UFUNCTION() void HandleHubProceed();
	UFUNCTION() void HandleRaceReturn();
};
