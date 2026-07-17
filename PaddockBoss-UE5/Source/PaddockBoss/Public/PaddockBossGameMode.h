#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "PaddockBossGameMode.generated.h"

class UHubScreenWidget;
class AGameAPIManager;

UCLASS()
class PADDOCKBOSS_API APaddockBossGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	APaddockBossGameMode();

	virtual void BeginPlay() override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "UI")
	TSubclassOf<UHubScreenWidget> HubScreenClass;

	UPROPERTY(BlueprintReadWrite, Category = "UI")
	UHubScreenWidget* CurrentHubScreen;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "API")
	AGameAPIManager* APIManager;

	UFUNCTION(BlueprintCallable, Category = "UI")
	void ShowHubScreen();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void HideHubScreen();

	UFUNCTION(BlueprintCallable, Category = "API")
	void SetupAPIManager();

protected:
	virtual void PostLogin(APlayerController* NewPlayer) override;
};
