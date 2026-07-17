#include "GameAPIManager.h"
#include "Http.h"
#include "Json.h"
#include "JsonUtilities.h"

AGameAPIManager::AGameAPIManager()
{
	PrimaryActorTick.bCanEverTick = false;
}

void AGameAPIManager::BeginPlay()
{
	Super::BeginPlay();
	UE_LOG(LogTemp, Warning, TEXT("GameAPIManager initialized at %s"), *BackendURL);
}

void AGameAPIManager::LoadHubScreenData()
{
	if (!FModuleManager::Get().IsModuleLoaded("HTTP"))
	{
		FModuleManager::Get().LoadModule("HTTP");
	}

	FHttpModule& HttpModule = FHttpModule::Get();
	FString URL = BackendURL + TEXT("/api/hub");

	TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = HttpModule.CreateRequest();
	Request->SetURL(URL);
	Request->SetVerb(TEXT("GET"));
	Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
	Request->OnProcessRequestComplete().BindDynamic(this, &AGameAPIManager::OnHubDataResponseReceived);

	UE_LOG(LogTemp, Warning, TEXT("Requesting hub data from: %s"), *URL);
	Request->ProcessRequest();
}

void AGameAPIManager::OnHubDataResponseReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bConnectedSuccessfully)
{
	bool bSuccess = false;
	FHubScreenData HubData;

	if (bConnectedSuccessfully && Response.IsValid())
	{
		int32 ResponseCode = Response->GetResponseCode();
		FString ResponseStr = Response->GetContentAsString();

		UE_LOG(LogTemp, Warning, TEXT("Hub API Response Code: %d"), ResponseCode);
		UE_LOG(LogTemp, Warning, TEXT("Hub API Response: %s"), *ResponseStr);

		if (ResponseCode == 200)
		{
			TSharedPtr<FJsonObject> JsonObject;
			TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(ResponseStr);

			if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
			{
				HubData.TeamName = JsonObject->GetStringField(TEXT("teamName"));
				HubData.Season = JsonObject->GetStringField(TEXT("season"));
				HubData.Rank = JsonObject->GetIntegerField(TEXT("rank"));
				HubData.TotalTeams = JsonObject->GetIntegerField(TEXT("totalTeams"));
				HubData.SeasonProgress = JsonObject->GetNumberField(TEXT("seasonProgress"));

				if (JsonObject->HasField(TEXT("teamVitals")))
				{
					TSharedPtr<FJsonObject> VitalsObj = JsonObject->GetObjectField(TEXT("teamVitals"));
					HubData.TeamVitals.Balance = VitalsObj->GetNumberField(TEXT("balance"));
					HubData.TeamVitals.Prestige = VitalsObj->GetIntegerField(TEXT("prestige"));
					HubData.TeamVitals.Reliability = VitalsObj->GetNumberField(TEXT("reliability"));
					HubData.TeamVitals.RDLevel = VitalsObj->GetIntegerField(TEXT("rdLevel"));
				}

				// Top money bar (reference hub): influence + net spend
				int32 Influence = 0;
				if (JsonObject->TryGetNumberField(TEXT("influence"), Influence))
				{
					HubData.Influence = Influence;
				}
				else
				{
					HubData.Influence = HubData.TeamVitals.Prestige;
				}

				double NetSpend = 0.0;
				if (JsonObject->TryGetNumberField(TEXT("netSpend"), NetSpend))
				{
					HubData.NetSpend = static_cast<float>(NetSpend);
				}

				if (JsonObject->HasField(TEXT("nextRace")))
				{
					TSharedPtr<FJsonObject> RaceObj = JsonObject->GetObjectField(TEXT("nextRace"));
					RaceObj->TryGetStringField(TEXT("trackName"), HubData.NextRace.TrackName);
					RaceObj->TryGetStringField(TEXT("location"), HubData.NextRace.Location);
					RaceObj->TryGetStringField(TEXT("discipline"), HubData.NextRace.Discipline);
					RaceObj->TryGetNumberField(TEXT("round"), HubData.NextRace.Round);
					RaceObj->TryGetNumberField(TEXT("totalRounds"), HubData.NextRace.TotalRounds);
				}

				auto ParseAccent = [](const TSharedPtr<FJsonObject>& Obj, FLinearColor& OutColor)
				{
					FString Hex;
					if (Obj->TryGetStringField(TEXT("color"), Hex) && !Hex.IsEmpty())
					{
						OutColor = FLinearColor(FColor::FromHex(Hex));
					}
				};

				const TArray<TSharedPtr<FJsonValue>>* TeamsArray = nullptr;
				if (JsonObject->TryGetArrayField(TEXT("teamStandings"), TeamsArray))
				{
					for (const TSharedPtr<FJsonValue>& Value : *TeamsArray)
					{
						const TSharedPtr<FJsonObject>* RowObj = nullptr;
						if (Value->TryGetObject(RowObj))
						{
							FTeamStandingRow Row;
							(*RowObj)->TryGetStringField(TEXT("teamName"), Row.TeamName);
							(*RowObj)->TryGetNumberField(TEXT("points"), Row.Points);
							(*RowObj)->TryGetNumberField(TEXT("position"), Row.Position);
							(*RowObj)->TryGetBoolField(TEXT("isPlayerTeam"), Row.bIsPlayerTeam);
							ParseAccent(*RowObj, Row.AccentColor);
							HubData.TeamStandings.Add(Row);
						}
					}
				}

				auto ParseRiders = [&ParseAccent](const TArray<TSharedPtr<FJsonValue>>& Values, TArray<FRiderStanding>& OutRiders)
				{
					for (const TSharedPtr<FJsonValue>& Value : Values)
					{
						const TSharedPtr<FJsonObject>* RowObj = nullptr;
						if (Value->TryGetObject(RowObj))
						{
							FRiderStanding Row;
							(*RowObj)->TryGetStringField(TEXT("riderName"), Row.RiderName);
							(*RowObj)->TryGetNumberField(TEXT("points"), Row.Points);
							(*RowObj)->TryGetNumberField(TEXT("position"), Row.Position);
							(*RowObj)->TryGetBoolField(TEXT("bIsPlayerRider"), Row.bIsPlayerRider);
							ParseAccent(*RowObj, Row.AccentColor);
							OutRiders.Add(Row);
						}
					}
				};

				const TArray<TSharedPtr<FJsonValue>>* RidersArray = nullptr;
				if (JsonObject->TryGetArrayField(TEXT("topRiders"), RidersArray))
				{
					ParseRiders(*RidersArray, HubData.TopRiders);
				}

				const TArray<TSharedPtr<FJsonValue>>* DriversArray = nullptr;
				if (JsonObject->TryGetArrayField(TEXT("driverStandings"), DriversArray))
				{
					ParseRiders(*DriversArray, HubData.DriverStandings);
				}

				CachedHubData = HubData;
				bSuccess = true;
			}
		}
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to connect to backend"));
	}

	OnHubDataLoaded.Broadcast(bSuccess, HubData);
}

void AGameAPIManager::OnRaceResponseReceived(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bConnectedSuccessfully)
{
	bool bSuccess = false;
	FString Message = TEXT("Race failed to start");

	if (bConnectedSuccessfully && Response.IsValid() && Response->GetResponseCode() == 200)
	{
		bSuccess = true;
		Message = TEXT("Race started successfully");
	}

	OnRaceStarted.Broadcast(bSuccess, Message);
}

void AGameAPIManager::StartRace()
{
	if (!FModuleManager::Get().IsModuleLoaded("HTTP"))
	{
		FModuleManager::Get().LoadModule("HTTP");
	}

	FHttpModule& HttpModule = FHttpModule::Get();
	FString URL = BackendURL + TEXT("/api/race/start");

	TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = HttpModule.CreateRequest();
	Request->SetURL(URL);
	Request->SetVerb(TEXT("POST"));
	Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
	Request->OnProcessRequestComplete().BindDynamic(this, &AGameAPIManager::OnRaceResponseReceived);

	UE_LOG(LogTemp, Warning, TEXT("Starting race via: %s"), *URL);
	Request->ProcessRequest();
}

void AGameAPIManager::SetBackendURL(const FString& InURL)
{
	BackendURL = InURL;
	UE_LOG(LogTemp, Warning, TEXT("Backend URL set to: %s"), *BackendURL);
}
