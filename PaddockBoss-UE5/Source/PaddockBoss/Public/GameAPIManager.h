#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "GameData.h"
#include "Interfaces/IHttpRequest.h"
#include "GameAPIManager.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnHubDataLoaded, bool, bSuccess, FHubScreenData, Data);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnRaceStarted, bool, bSuccess, FString, Message);

UCLASS()
class PADDOCKBOSS_API AGameAPIManager : public AActor
{
	GENERATED_BODY()

public:
	AGameAPIManager();

	virtual void BeginPlay() override;

	UPROPERTY(BlueprintAssignable, Category = "Hub")
	FOnHubDataLoaded OnHubDataLoaded;

	UPROPERTY(BlueprintAssignable, Category = "Race")
	FOnRaceStarted OnRaceStarted;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "API")
	FString BackendURL = FString(TEXT("http://localhost:3001"));

	UFUNCTION(BlueprintCallable, Category = "Hub")
	void LoadHubScreenData();

	UFUNCTION(BlueprintCallable, Category = "Race")
	void StartRace();

	UFUNCTION(BlueprintCallable, Category = "API")
	void SetBackendURL(const FString& InURL);

protected:
	FHubScreenData CachedHubData;

	void OnHubDataResponseReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bConnectedSuccessfully);
	void OnRaceResponseReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bConnectedSuccessfully);
};
