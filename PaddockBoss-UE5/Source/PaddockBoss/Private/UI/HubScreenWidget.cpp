#include "UI/HubScreenWidget.h"
#include "GameAPIManager.h"
#include "Components/TextBlock.h"
#include "Components/Button.h"
#include "Components/ProgressBar.h"
#include "Components/Image.h"
#include "Components/VerticalBox.h"
#include "Components/HorizontalBox.h"
#include "Kismet/GameplayStatics.h"

void UHubScreenWidget::NativePreConstruct()
{
	Super::NativePreConstruct();
}

void UHubScreenWidget::NativeConstruct()
{
	Super::NativeConstruct();

	if (!APIManager)
	{
		APIManager = GetWorld()->SpawnActor<AGameAPIManager>();
	}

	if (APIManager)
	{
		APIManager->OnHubDataLoaded.AddDynamic(this, &UHubScreenWidget::OnHubDataReceived);
	}

	SetupButtonCallbacks();
	RefreshHubData();
}

void UHubScreenWidget::NativeDestruct()
{
	if (APIManager && APIManager->OnHubDataLoaded.IsBound())
	{
		APIManager->OnHubDataLoaded.RemoveDynamic(this, &UHubScreenWidget::OnHubDataReceived);
	}

	Super::NativeDestruct();
}

void UHubScreenWidget::SetupButtonCallbacks()
{
	if (GoRacingButton)
	{
		GoRacingButton->OnClicked.AddDynamic(this, &UHubScreenWidget::OnGoRacingClicked);
	}
	if (ShowroomButton)
	{
		ShowroomButton->OnClicked.AddDynamic(this, &UHubScreenWidget::OnShowroomClicked);
	}
	if (GarageButton)
	{
		GarageButton->OnClicked.AddDynamic(this, &UHubScreenWidget::OnGarageClicked);
	}
	if (TrainingButton)
	{
		TrainingButton->OnClicked.AddDynamic(this, &UHubScreenWidget::OnTrainingClicked);
	}
	if (RDCenterButton)
	{
		RDCenterButton->OnClicked.AddDynamic(this, &UHubScreenWidget::OnRDCenterClicked);
	}
	if (ExitButton)
	{
		ExitButton->OnClicked.AddDynamic(this, &UHubScreenWidget::OnExitClicked);
	}
}

void UHubScreenWidget::RefreshHubData()
{
	if (APIManager)
	{
		APIManager->LoadHubScreenData();
	}
}

void UHubScreenWidget::OnHubDataReceived(bool bSuccess, FHubScreenData Data)
{
	if (bSuccess)
	{
		CurrentHubData = Data;
		UpdateVisuals();
	}
	else
	{
		UE_LOG(LogTemp, Warning, TEXT("Failed to load hub data"));
	}
}

void UHubScreenWidget::UpdateVisuals()
{
	if (TeamNameText)
	{
		TeamNameText->SetText(FText::FromString(CurrentHubData.TeamName));
	}

	if (SeasonInfoText)
	{
		FString SeasonStr = FString::Printf(TEXT("%s • Round %d/20 • NAMC"),
			*CurrentHubData.Season,
			static_cast<int32>(CurrentHubData.SeasonProgress * 20.0f));
		SeasonInfoText->SetText(FText::FromString(SeasonStr));
	}

	if (RankText)
	{
		FString RankStr = FString::Printf(TEXT("%d of %d"), CurrentHubData.Rank, CurrentHubData.TotalTeams);
		RankText->SetText(FText::FromString(RankStr));
	}

	if (BalanceText)
	{
		FString BalanceStr = FString::Printf(TEXT("$%.0fk"), CurrentHubData.TeamVitals.Balance / 1000.0f);
		BalanceText->SetText(FText::FromString(BalanceStr));
		if (BalanceText->GetParent())
		{
			BalanceText->SetColorAndOpacity(GetVitalColor(CurrentHubData.TeamVitals.Balance / 2500000.0f * 100.0f));
		}
	}

	if (PrestigeText)
	{
		FString PrestigeStr = FString::Printf(TEXT("%d"), CurrentHubData.TeamVitals.Prestige);
		PrestigeText->SetText(FText::FromString(PrestigeStr));
		PrestigeText->SetColorAndOpacity(GetVitalColor(CurrentHubData.TeamVitals.Prestige, true));
	}

	if (ReliabilityText)
	{
		FString ReliabilityStr = FString::Printf(TEXT("%.0f%%"), CurrentHubData.TeamVitals.Reliability);
		ReliabilityText->SetText(FText::FromString(ReliabilityStr));
		ReliabilityText->SetColorAndOpacity(GetVitalColor(CurrentHubData.TeamVitals.Reliability, true));
	}

	if (RDLevelText)
	{
		FString RDStr = FString::Printf(TEXT("Lv.%d"), CurrentHubData.TeamVitals.RDLevel);
		RDLevelText->SetText(FText::FromString(RDStr));
	}

	if (SeasonProgressBar)
	{
		SeasonProgressBar->SetPercent(CurrentHubData.SeasonProgress);
	}

	if (NextTrackText)
	{
		NextTrackText->SetText(FText::FromString(CurrentHubData.NextRace.TrackName));
	}

	if (NextRaceInfoText)
	{
		FString InfoStr = FString::Printf(TEXT("%s • %s"),
			*CurrentHubData.NextRace.Discipline,
			*CurrentHubData.NextRace.Location);
		NextRaceInfoText->SetText(FText::FromString(InfoStr));
	}

	PopulateTopRiders();
	PopulateBriefing();
	PopulateTrackDays();
}

void UHubScreenWidget::PopulateTopRiders()
{
	if (!TopRidersPanel)
		return;

	TopRidersPanel->ClearChildren();

	for (const FRiderStanding& Rider : CurrentHubData.TopRiders)
	{
		if (UTextBlock* RiderText = NewObject<UTextBlock>(TopRidersPanel))
		{
			FString RiderStr = FString::Printf(TEXT("#%d %s - %d pts"),
				Rider.Position,
				*Rider.RiderName,
				Rider.Points);

			RiderText->SetText(FText::FromString(RiderStr));
			if (Rider.bIsPlayerRider)
			{
				RiderText->SetColorAndOpacity(FLinearColor::Green);
			}

			TopRidersPanel->AddChild(RiderText);
		}
	}
}

void UHubScreenWidget::PopulateBriefing()
{
	if (!BriefingPanel)
		return;

	BriefingPanel->ClearChildren();

	for (const FMediaFeed& Feed : CurrentHubData.RyansBriefing)
	{
		if (UTextBlock* FeedText = NewObject<UTextBlock>(BriefingPanel))
		{
			FString FeedStr = FString::Printf(TEXT("• %s\n  %s"),
				*Feed.Title,
				*Feed.Content);

			FeedText->SetText(FText::FromString(FeedStr));
			FeedText->SetAutoWrapText(true);
			BriefingPanel->AddChild(FeedText);
		}
	}
}

void UHubScreenWidget::PopulateTrackDays()
{
	if (!TrackDaysPanel)
		return;

	TrackDaysPanel->ClearChildren();

	for (const FMediaFeed& Feed : CurrentHubData.TrackDays)
	{
		if (UTextBlock* FeedText = NewObject<UTextBlock>(TrackDaysPanel))
		{
			FString FeedStr = FString::Printf(TEXT("• %s\n  %s"),
				*Feed.Title,
				*Feed.Content);

			FeedText->SetText(FText::FromString(FeedStr));
			FeedText->SetAutoWrapText(true);
			TrackDaysPanel->AddChild(FeedText);
		}
	}
}

FLinearColor UHubScreenWidget::GetVitalColor(float Value, bool bIsPercentage)
{
	if (bIsPercentage)
	{
		Value = FMath::Clamp(Value, 0.0f, 100.0f) / 100.0f;
	}
	else
	{
		Value = FMath::Clamp(Value, 0.0f, 1.0f);
	}

	if (Value > 0.7f)
	{
		return FLinearColor::Green;
	}
	else if (Value > 0.4f)
	{
		return FLinearColor::Yellow;
	}
	else
	{
		return FLinearColor::Red;
	}
}

void UHubScreenWidget::OnGoRacingClicked()
{
	UE_LOG(LogTemp, Warning, TEXT("Go Racing button clicked"));
	if (APIManager)
	{
		APIManager->StartRace();
	}
}

void UHubScreenWidget::OnShowroomClicked()
{
	UE_LOG(LogTemp, Warning, TEXT("Showroom button clicked"));
}

void UHubScreenWidget::OnGarageClicked()
{
	UE_LOG(LogTemp, Warning, TEXT("Garage button clicked"));
}

void UHubScreenWidget::OnTrainingClicked()
{
	UE_LOG(LogTemp, Warning, TEXT("Training button clicked"));
}

void UHubScreenWidget::OnRDCenterClicked()
{
	UE_LOG(LogTemp, Warning, TEXT("R&D Center button clicked"));
}

void UHubScreenWidget::OnExitClicked()
{
	UE_LOG(LogTemp, Warning, TEXT("Exit button clicked"));
	UGameplayStatics::OpenLevel(GetWorld(), FName(*GetWorld()->GetMapName()), false);
}

void UHubScreenWidget::SetAPIManager(AGameAPIManager* InAPIManager)
{
	APIManager = InAPIManager;
	if (APIManager)
	{
		APIManager->OnHubDataLoaded.AddDynamic(this, &UHubScreenWidget::OnHubDataReceived);
		RefreshHubData();
	}
}
