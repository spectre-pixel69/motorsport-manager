#include "PaddockBossGameMode.h"
#include "UI/HubScreenWidget.h"
#include "GameAPIManager.h"
#include "Blueprint/UserWidget.h"
#include "Kismet/GameplayStatics.h"

APaddockBossGameMode::APaddockBossGameMode()
{
	PrimaryActorTick.bCanEverTick = false;
}

void APaddockBossGameMode::BeginPlay()
{
	Super::BeginPlay();

	UE_LOG(LogTemp, Warning, TEXT("PaddockBossGameMode BeginPlay"));

	SetupAPIManager();
	ShowHubScreen();
}

void APaddockBossGameMode::PostLogin(APlayerController* NewPlayer)
{
	Super::PostLogin(NewPlayer);

	UE_LOG(LogTemp, Warning, TEXT("Player logged in"));
}

void APaddockBossGameMode::SetupAPIManager()
{
	if (!APIManager)
	{
		APIManager = GetWorld()->SpawnActor<AGameAPIManager>();
		if (APIManager)
		{
			UE_LOG(LogTemp, Warning, TEXT("API Manager spawned"));
		}
	}
}

void APaddockBossGameMode::ShowHubScreen()
{
	if (!HubScreenClass)
	{
		UE_LOG(LogTemp, Error, TEXT("HubScreenClass is not set!"));
		return;
	}

	APlayerController* PC = GetWorld()->GetFirstPlayerController();
	if (!PC)
	{
		UE_LOG(LogTemp, Error, TEXT("No player controller found"));
		return;
	}

	if (!CurrentHubScreen)
	{
		CurrentHubScreen = CreateWidget<UHubScreenWidget>(PC, HubScreenClass);
		if (CurrentHubScreen)
		{
			CurrentHubScreen->AddToViewport(0);
			CurrentHubScreen->SetAPIManager(APIManager);
			UE_LOG(LogTemp, Warning, TEXT("Hub Screen created and added to viewport"));
		}
	}
}

void APaddockBossGameMode::HideHubScreen()
{
	if (CurrentHubScreen)
	{
		CurrentHubScreen->RemoveFromParent();
		CurrentHubScreen = nullptr;
	}
}
