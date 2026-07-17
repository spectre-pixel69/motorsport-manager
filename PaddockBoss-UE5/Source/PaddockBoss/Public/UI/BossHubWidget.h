#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "GameData.h"
#include "BossHubWidget.generated.h"

class AGameAPIManager;
class UTextBlock;
class UButton;
class UBorder;
class UVerticalBox;
class UCanvasPanel;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHubNavigate, FName, Section);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnHubProceed);

/**
 * Track map card contents: paints the next-race circuit outline.
 * Replace the hardcoded loop with per-track spline data when tracks ship.
 */
UCLASS()
class PADDOCKBOSS_API UTrackMapWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	virtual bool Initialize() override;

protected:
	virtual int32 NativePaint(const FPaintArgs& Args, const FGeometry& AllottedGeometry,
		const FSlateRect& MyCullingRect, FSlateWindowElementList& OutDrawElements,
		int32 LayerId, const FWidgetStyle& InWidgetStyle, bool bParentEnabled) const override;
};

/**
 * The hub screen from the boss's reference art (art/reference):
 *  - Top money bar: BALANCE / INFLUENCE / NET SPEND
 *  - Team logo roundel, upper left
 *  - Left rail: SETUP / STAFF / CALENDAR / FINANCE glass buttons
 *  - Right rail: TEAM STANDINGS, DRIVER STANDINGS, track map, PROCEED
 *  - Center is transparent: the 3D showroom level (bike on stand) renders through.
 *
 * Entire widget tree is built in C++ — no Blueprint required. Create it directly
 * with CreateWidget<UBossHubWidget>(PlayerController) and AddToViewport.
 */
UCLASS()
class PADDOCKBOSS_API UBossHubWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	virtual bool Initialize() override;
	virtual void NativeConstruct() override;
	virtual void NativeDestruct() override;

	UPROPERTY(BlueprintReadOnly, Category = "Hub")
	FHubScreenData CurrentHubData;

	UPROPERTY(BlueprintReadWrite, Category = "API")
	AGameAPIManager* APIManager = nullptr;

	UPROPERTY(BlueprintAssignable, Category = "Hub")
	FOnHubNavigate OnNavigate;

	UPROPERTY(BlueprintAssignable, Category = "Hub")
	FOnHubProceed OnProceed;

	UFUNCTION(BlueprintCallable, Category = "API")
	void SetAPIManager(AGameAPIManager* InAPIManager);

	UFUNCTION(BlueprintCallable, Category = "Hub")
	void RefreshHubData();

	UFUNCTION(BlueprintCallable, Category = "Hub")
	void OnHubDataReceived(bool bSuccess, FHubScreenData Data);

protected:
	// Live-updating widgets
	UPROPERTY(Transient) UTextBlock* BalanceValueText = nullptr;
	UPROPERTY(Transient) UTextBlock* InfluenceValueText = nullptr;
	UPROPERTY(Transient) UTextBlock* NetSpendValueText = nullptr;
	UPROPERTY(Transient) UTextBlock* TeamLogoNameText = nullptr;
	UPROPERTY(Transient) UVerticalBox* TeamStandingsBox = nullptr;
	UPROPERTY(Transient) UVerticalBox* DriverStandingsBox = nullptr;

	UFUNCTION() void HandleSetupClicked();
	UFUNCTION() void HandleStaffClicked();
	UFUNCTION() void HandleCalendarClicked();
	UFUNCTION() void HandleFinanceClicked();
	UFUNCTION() void HandleProceedClicked();

	void BuildLayout();
	void UpdateVisuals();

	// Builders
	UBorder* MakeCard(float CornerRadius = 10.0f) const;
	UButton* MakeGlassButton(const FString& Label, FLinearColor OutlineColor, FLinearColor LabelColor) const;
	UTextBlock* MakeText(const FString& Value, int32 Size, FLinearColor Color, bool bBold = true) const;
	void AddStandingRow(UVerticalBox* TargetBox, int32 Position, FLinearColor Accent, const FString& Name, int32 Points, bool bHighlight) const;
	void RebuildStandings();

	static FString FormatMoney(float Amount);
};
