#include "PaddockBossGameMode.h"
#include "UI/BossHubWidget.h"
#include "UI/HubScreenWidget.h"
#include "UI/RaceViewWidget.h"
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
				BossHub->OnProceed.AddDynamic(this, &APaddockBossGameMode::HandleHubProceed);
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

void APaddockBossGameMode::HandleHubProceed()
{
	HideHubScreen();
	ShowRaceView();
}

void APaddockBossGameMode::HandleRaceReturn()
{
	HideRaceView();
	ShowHubScreen();
}

void APaddockBossGameMode::ShowRaceView()
{
	APlayerController* PC = GetWorld()->GetFirstPlayerController();
	if (!PC || CurrentRaceView)
	{
		return;
	}

	CurrentRaceView = CreateWidget<URaceViewWidget>(PC);
	if (!CurrentRaceView)
	{
		return;
	}
	CurrentRaceView->SetAPIManager(APIManager);
	CurrentRaceView->OnReturnToHub.AddDynamic(this, &APaddockBossGameMode::HandleRaceReturn);
	CurrentRaceView->AddToViewport(0);

	// Placeholder broadcast until the sim broadcast endpoint is piped through —
	// mirrors how the hub self-seeds. Real data replaces this via SetBroadcast().
	FRaceBroadcast B;
	B.TrackName = TEXT("Travis Peak");
	B.SessionName = TEXT("MAIN EVENT");
	B.Lap = 1;
	B.TotalLaps = 18;
	B.bWet = false;
	const TCHAR* Names[] = { TEXT("Martinez"), TEXT("Chen"), TEXT("Williams"), TEXT("Davis"), TEXT("Taylor") };
	const int32 Nums[] = { 21, 7, 34, 12, 5 };
	for (int32 i = 0; i < 5; ++i)
	{
		FRaceTowerRow R;
		R.Position = i + 1;
		R.Number = Nums[i];
		R.RiderName = Names[i];
		R.Gap = i == 0 ? FString(TEXT("Leader")) : FString::Printf(TEXT("+%.1fs"), i * 1.3f);
		R.bIsPlayer = (i == 3);
		B.Tower.Add(R);
	}
	FRaceFeedItem Holeshot;
	Holeshot.Lap = 1;
	Holeshot.Kind = TEXT("fastLap");
	Holeshot.Text = TEXT("Martinez grabs the holeshot!");
	B.Feed.Add(Holeshot);
	CurrentRaceView->SetBroadcast(B);

	if (APIManager)
	{
		APIManager->StartRace();
	}
}

void APaddockBossGameMode::HideRaceView()
{
	if (CurrentRaceView)
	{
		CurrentRaceView->RemoveFromParent();
		CurrentRaceView = nullptr;
	}
}
