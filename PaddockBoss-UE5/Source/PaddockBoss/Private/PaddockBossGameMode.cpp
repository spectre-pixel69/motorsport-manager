#include "PaddockBossGameMode.h"
#include "UI/BossHubWidget.h"
#include "UI/HubScreenWidget.h"
#include "GameAPIManager.h"
#include "ShowroomStage.h"
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
	SetupShowroomStage();
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

void APaddockBossGameMode::SetupShowroomStage()
{
	if (!ShowroomStage)
	{
		ShowroomStage = GetWorld()->SpawnActor<AShowroomStage>(FVector::ZeroVector, FRotator::ZeroRotator);
	}

	APlayerController* PC = GetWorld()->GetFirstPlayerController();
	if (PC && ShowroomStage)
	{
		PC->SetViewTarget(ShowroomStage);
	}
}

void APaddockBossGameMode::ShowHubScreen()
{
	APlayerController* PC = GetWorld()->GetFirstPlayerController();
	if (!PC)
	{
		UE_LOG(LogTemp, Error, TEXT("No player controller found"));
		return;
	}

	if (!CurrentHubScreen)
	{
		if (HubScreenClass)
		{
			CurrentHubScreen = CreateWidget<UUserWidget>(PC, HubScreenClass);
		}
		else
		{
			// Native reference hub — no Blueprint required.
			CurrentHubScreen = CreateWidget<UBossHubWidget>(PC);
		}

		if (CurrentHubScreen)
		{
			CurrentHubScreen->AddToViewport(0);

			if (UBossHubWidget* BossHub = Cast<UBossHubWidget>(CurrentHubScreen))
			{
				BossHub->SetAPIManager(APIManager);
			}
			else if (UHubScreenWidget* LegacyHub = Cast<UHubScreenWidget>(CurrentHubScreen))
			{
				LegacyHub->SetAPIManager(APIManager);
			}

			PC->SetShowMouseCursor(true);
			FInputModeGameAndUI InputMode;
			InputMode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
			InputMode.SetHideCursorDuringCapture(false);
			PC->SetInputMode(InputMode);

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
