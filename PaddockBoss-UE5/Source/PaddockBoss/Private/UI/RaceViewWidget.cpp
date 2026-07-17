#include "UI/RaceViewWidget.h"
#include "GameAPIManager.h"
#include "Components/TextBlock.h"
#include "Components/Button.h"
#include "Components/VerticalBox.h"
#include "Components/ScrollBox.h"
#include "Kismet/GameplayStatics.h"

void URaceViewWidget::NativePreConstruct()
{
	Super::NativePreConstruct();
}

void URaceViewWidget::NativeConstruct()
{
	Super::NativeConstruct();

	PrimaryTickableObject::SetTickEnabled(true);

	SetupButtonCallbacks();
	StartBroadcastStream();
}

void URaceViewWidget::NativeDestruct()
{
	if (GetWorld()->GetTimerManager().IsTimerActive(UpdateTimerHandle))
	{
		GetWorld()->GetTimerManager().ClearTimer(UpdateTimerHandle);
	}

	Super::NativeDestruct();
}

void URaceViewWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);

	RaceElapsedTime += InDeltaTime;

	if (LapCounterText)
	{
		FString LapStr = FString::Printf(TEXT("Lap %d / %d"), CurrentLap, TotalLaps);
		LapCounterText->SetText(FText::FromString(LapStr));
	}
}

void URaceViewWidget::SetupButtonCallbacks()
{
	if (ReturnToHubButton)
	{
		ReturnToHubButton->OnClicked.AddDynamic(this, &URaceViewWidget::OnReturnToHubClicked);
	}
}

void URaceViewWidget::StartBroadcastStream()
{
	if (APIManager)
	{
		UpdateRaceData();

		FTimerDelegate TimerDelegate;
		TimerDelegate.BindUFunction(this, FName("UpdateRaceData"));
		GetWorld()->GetTimerManager().SetTimer(UpdateTimerHandle, TimerDelegate, 1.0f, true);
	}
	else
	{
		UE_LOG(LogTemp, Warning, TEXT("No API Manager set for RaceViewWidget"));
	}
}

void URaceViewWidget::UpdateRaceData()
{
	UE_LOG(LogTemp, Warning, TEXT("Requesting race broadcast data"));
}

void URaceViewWidget::OnRaceDataReceived(bool bSuccess, FString Data)
{
	if (bSuccess)
	{
		UE_LOG(LogTemp, Warning, TEXT("Received race data: %s"), *Data);
		UpdateRaceDisplay();
	}
	else
	{
		UE_LOG(LogTemp, Warning, TEXT("Failed to receive race data"));
	}
}

void URaceViewWidget::UpdateRaceDisplay()
{
	if (LeaderNameText)
	{
		LeaderNameText->SetText(FText::FromString(TEXT("Martinez")));
	}

	if (LeaderDistanceText)
	{
		FString DistStr = FString::Printf(TEXT("Leader +%.2f s"), LeaderDistance);
		LeaderDistanceText->SetText(FText::FromString(DistStr));
	}

	PopulateRaceResults();
}

void URaceViewWidget::PopulateRaceResults()
{
	if (!RaceResultsList)
		return;

	RaceResultsList->ClearChildren();
}

void URaceViewWidget::OnReturnToHubClicked()
{
	UE_LOG(LogTemp, Warning, TEXT("Return to Hub clicked"));
	if (GetWorld()->GetTimerManager().IsTimerActive(UpdateTimerHandle))
	{
		GetWorld()->GetTimerManager().ClearTimer(UpdateTimerHandle);
	}
	RemoveFromParent();
}

void URaceViewWidget::SetAPIManager(AGameAPIManager* InAPIManager)
{
	APIManager = InAPIManager;
	if (APIManager)
	{
		StartBroadcastStream();
	}
}
