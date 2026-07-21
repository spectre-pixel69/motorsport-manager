#include "UI/BossHubWidget.h"
#include "GameAPIManager.h"
#include "Blueprint/WidgetTree.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/Border.h"
#include "Components/TextBlock.h"
#include "Components/Button.h"
#include "Components/ButtonSlot.h"
#include "Components/Spacer.h"
#include "Components/SizeBox.h"
#include "Styling/CoreStyle.h"
#include "Styling/SlateBrush.h"
#include "Rendering/DrawElements.h"

namespace PaddockHubStyle
{
	static const FLinearColor BarFill(0.97f, 0.97f, 0.98f, 0.95f);
	static const FLinearColor CardFill(0.985f, 0.985f, 0.99f, 0.96f);
	static const FLinearColor CardEdge(0.78f, 0.80f, 0.82f, 1.0f);
	static const FLinearColor InkDark = FLinearColor(FColor::FromHex(TEXT("#1c1c1e")));
	static const FLinearColor InkMid = FLinearColor(FColor::FromHex(TEXT("#4a4a4e")));
	static const FLinearColor MoneyGreen = FLinearColor(FColor::FromHex(TEXT("#2f9e44")));
	static const FLinearColor InfluenceBlue = FLinearColor(FColor::FromHex(TEXT("#2b7fc1")));
	static const FLinearColor SpendRed = FLinearColor(FColor::FromHex(TEXT("#b32424")));
	static const FLinearColor GlassEdgeCyan = FLinearColor(FColor::FromHex(TEXT("#7ad1e6")));
	static const FLinearColor ProceedGreen = FLinearColor(FColor::FromHex(TEXT("#2e7d32")));
	static const FLinearColor CircuitInk = FLinearColor(FColor::FromHex(TEXT("#2b2b2e")));

	static FSlateBrush RoundedBrush(const FLinearColor& Fill, float Radius,
		const FLinearColor& Outline = FLinearColor::Transparent, float OutlineWidth = 0.0f)
	{
		FSlateBrush Brush;
		Brush.DrawAs = ESlateBrushDrawType::RoundedBox;
		Brush.TintColor = FSlateColor(Fill);
		Brush.OutlineSettings = FSlateBrushOutlineSettings(FVector4(Radius, Radius, Radius, Radius), Outline, OutlineWidth);
		Brush.OutlineSettings.RoundingType = ESlateBrushRoundingType::FixedRadius;
		return Brush;
	}
}

// ============================================================================
// UTrackMapWidget
// ============================================================================

bool UTrackMapWidget::Initialize()
{
	const bool bOk = Super::Initialize();
	if (bOk && WidgetTree && !WidgetTree->RootWidget)
	{
		WidgetTree->RootWidget = WidgetTree->ConstructWidget<USpacer>(USpacer::StaticClass(), TEXT("TrackMapFill"));
	}
	return bOk;
}

int32 UTrackMapWidget::NativePaint(const FPaintArgs& Args, const FGeometry& AllottedGeometry,
	const FSlateRect& MyCullingRect, FSlateWindowElementList& OutDrawElements,
	int32 LayerId, const FWidgetStyle& InWidgetStyle, bool bParentEnabled) const
{
	const int32 MaxLayer = Super::NativePaint(Args, AllottedGeometry, MyCullingRect, OutDrawElements, LayerId, InWidgetStyle, bParentEnabled);

	const FVector2D Size = AllottedGeometry.GetLocalSize();
	if (Size.X < 8.0f || Size.Y < 8.0f)
	{
		return MaxLayer;
	}

	static const float CircuitPoints[][2] = {
		{0.16f, 0.78f}, {0.10f, 0.58f}, {0.14f, 0.38f}, {0.26f, 0.24f}, {0.42f, 0.20f},
		{0.52f, 0.30f}, {0.46f, 0.44f}, {0.54f, 0.56f}, {0.68f, 0.50f}, {0.74f, 0.34f},
		{0.86f, 0.26f}, {0.92f, 0.42f}, {0.86f, 0.60f}, {0.72f, 0.74f}, {0.52f, 0.80f},
		{0.32f, 0.82f}, {0.16f, 0.78f}
	};

	TArray<FVector2D> Points;
	Points.Reserve(UE_ARRAY_COUNT(CircuitPoints));
	for (const auto& P : CircuitPoints)
	{
		Points.Add(FVector2D(P[0] * Size.X, P[1] * Size.Y));
	}

	FSlateDrawElement::MakeLines(OutDrawElements, MaxLayer + 1, AllottedGeometry.ToPaintGeometry(),
		Points, ESlateDrawEffect::None, PaddockHubStyle::CircuitInk, true, 3.5f);

	TArray<FVector2D> StartLine;
	StartLine.Add(FVector2D(0.12f * Size.X, 0.66f * Size.Y));
	StartLine.Add(FVector2D(0.19f * Size.X, 0.69f * Size.Y));
	FSlateDrawElement::MakeLines(OutDrawElements, MaxLayer + 2, AllottedGeometry.ToPaintGeometry(),
		StartLine, ESlateDrawEffect::None, PaddockHubStyle::ProceedGreen, true, 5.0f);

	return MaxLayer + 2;
}

// ============================================================================
// UBossHubWidget
// ============================================================================

bool UBossHubWidget::Initialize()
{
	const bool bOk = Super::Initialize();
	if (bOk && WidgetTree && !WidgetTree->RootWidget)
	{
		// Seed with the reference-art values so the screen is fully dressed
		// before (or without) a backend connection.
		CurrentHubData.TeamName = TEXT("Paddock Boss");
		CurrentHubData.TeamVitals.Balance = 2707725.0f;
		CurrentHubData.Influence = 83;
		CurrentHubData.NetSpend = -1843000.0f;

		BuildLayout();
		UpdateVisuals();
	}
	return bOk;
}

void UBossHubWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (APIManager)
	{
		RefreshHubData();
	}
}

void UBossHubWidget::NativeDestruct()
{
	if (APIManager)
	{
		APIManager->OnHubDataLoaded.RemoveDynamic(this, &UBossHubWidget::OnHubDataReceived);
	}
	Super::NativeDestruct();
}

void UBossHubWidget::SetAPIManager(AGameAPIManager* InAPIManager)
{
	if (APIManager)
	{
		APIManager->OnHubDataLoaded.RemoveDynamic(this, &UBossHubWidget::OnHubDataReceived);
	}
	APIManager = InAPIManager;
	if (APIManager)
	{
		APIManager->OnHubDataLoaded.AddDynamic(this, &UBossHubWidget::OnHubDataReceived);
		RefreshHubData();
	}
}

void UBossHubWidget::RefreshHubData()
{
	if (APIManager)
	{
		APIManager->LoadHubScreenData();
	}
}

void UBossHubWidget::OnHubDataReceived(bool bSuccess, FHubScreenData Data)
{
	if (!bSuccess)
	{
		UE_LOG(LogTemp, Warning, TEXT("BossHub: hub data load failed, keeping current values"));
		return;
	}
	CurrentHubData = Data;
	if (CurrentHubData.Influence <= 0)
	{
		CurrentHubData.Influence = CurrentHubData.TeamVitals.Prestige;
	}
	UpdateVisuals();
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

void UBossHubWidget::BuildLayout()
{
	using namespace PaddockHubStyle;

	UCanvasPanel* Root = WidgetTree->ConstructWidget<UCanvasPanel>(UCanvasPanel::StaticClass(), TEXT("RootCanvas"));
	WidgetTree->RootWidget = Root;

	// ---- Top money bar: BALANCE / INFLUENCE / NET SPEND ----
	UBorder* TopBar = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass(), TEXT("TopBar"));
	TopBar->SetBrush(RoundedBrush(BarFill, 0.0f));
	TopBar->SetPadding(FMargin(48.0f, 8.0f));
	TopBar->SetHorizontalAlignment(HAlign_Fill);
	TopBar->SetVerticalAlignment(VAlign_Center);
	if (UCanvasPanelSlot* S = Cast<UCanvasPanelSlot>(Root->AddChild(TopBar)))
	{
		S->SetAnchors(FAnchors(0.0f, 0.0f, 1.0f, 0.0f));
		S->SetOffsets(FMargin(0.0f, 0.0f, 0.0f, 54.0f));
	}

	UHorizontalBox* BarRow = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass(), TEXT("TopBarRow"));
	TopBar->SetContent(BarRow);

	auto AddBarStat = [&](const FString& Label, FLinearColor ValueColor, UTextBlock*& OutValue, bool bDividerAfter)
	{
		UHorizontalBox* Pair = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());

		UTextBlock* LabelText = MakeText(Label, 21, InkDark);
		if (UHorizontalBoxSlot* LS = Cast<UHorizontalBoxSlot>(Pair->AddChild(LabelText)))
		{
			LS->SetVerticalAlignment(VAlign_Center);
			LS->SetPadding(FMargin(0.0f, 0.0f, 10.0f, 0.0f));
		}

		OutValue = MakeText(TEXT("--"), 21, ValueColor);
		if (UHorizontalBoxSlot* VS = Cast<UHorizontalBoxSlot>(Pair->AddChild(OutValue)))
		{
			VS->SetVerticalAlignment(VAlign_Center);
		}

		if (UHorizontalBoxSlot* PS = Cast<UHorizontalBoxSlot>(BarRow->AddChild(Pair)))
		{
			PS->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
			PS->SetHorizontalAlignment(HAlign_Center);
			PS->SetVerticalAlignment(VAlign_Center);
		}

		if (bDividerAfter)
		{
			UBorder* Divider = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
			Divider->SetBrush(RoundedBrush(FLinearColor(0.0f, 0.0f, 0.0f, 0.18f), 0.0f));
			USizeBox* DividerSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
			DividerSize->SetWidthOverride(1.5f);
			DividerSize->SetHeightOverride(26.0f);
			DividerSize->AddChild(Divider);
			if (UHorizontalBoxSlot* DS = Cast<UHorizontalBoxSlot>(BarRow->AddChild(DividerSize)))
			{
				DS->SetVerticalAlignment(VAlign_Center);
			}
		}
	};

	AddBarStat(TEXT("BALANCE:"), MoneyGreen, BalanceValueText, true);
	AddBarStat(TEXT("INFLUENCE:"), InfluenceBlue, InfluenceValueText, true);
	AddBarStat(TEXT("NET SPEND:"), SpendRed, NetSpendValueText, false);

	// ---- Team logo roundel ----
	UBorder* Roundel = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass(), TEXT("LogoRoundel"));
	Roundel->SetBrush(RoundedBrush(FLinearColor(1.0f, 1.0f, 1.0f, 0.95f), 80.0f, FLinearColor(0.72f, 0.75f, 0.78f, 1.0f), 3.0f));
	Roundel->SetHorizontalAlignment(HAlign_Center);
	Roundel->SetVerticalAlignment(VAlign_Center);
	if (UCanvasPanelSlot* S = Cast<UCanvasPanelSlot>(Root->AddChild(Roundel)))
	{
		S->SetAnchors(FAnchors(0.0f, 0.0f));
		S->SetOffsets(FMargin(56.0f, 84.0f, 160.0f, 160.0f));
		S->SetAlignment(FVector2D(0.0f, 0.0f));
	}

	UVerticalBox* RoundelStack = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	Roundel->SetContent(RoundelStack);

	TeamLogoNameText = MakeText(TEXT("Paddock\nBoss"), 19, InkDark);
	TeamLogoNameText->SetJustification(ETextJustify::Center);
	if (UVerticalBoxSlot* S = Cast<UVerticalBoxSlot>(RoundelStack->AddChild(TeamLogoNameText)))
	{
		S->SetHorizontalAlignment(HAlign_Center);
	}
	UTextBlock* LogoSub = MakeText(TEXT("TEAM LOGO"), 11, InkMid, false);
	LogoSub->SetJustification(ETextJustify::Center);
	if (UVerticalBoxSlot* S = Cast<UVerticalBoxSlot>(RoundelStack->AddChild(LogoSub)))
	{
		S->SetHorizontalAlignment(HAlign_Center);
		S->SetPadding(FMargin(0.0f, 4.0f, 0.0f, 0.0f));
	}

	// ---- Left nav rail: SETUP / STAFF / CALENDAR / FINANCE ----
	UVerticalBox* NavRail = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass(), TEXT("NavRail"));
	if (UCanvasPanelSlot* S = Cast<UCanvasPanelSlot>(Root->AddChild(NavRail)))
	{
		S->SetAnchors(FAnchors(0.0f, 0.5f));
		S->SetOffsets(FMargin(56.0f, 40.0f, 226.0f, 330.0f));
		S->SetAlignment(FVector2D(0.0f, 0.5f));
	}

	UButton* SetupButton = MakeGlassButton(TEXT("SETUP"), GlassEdgeCyan, InkDark);
	UButton* StaffButton = MakeGlassButton(TEXT("STAFF"), GlassEdgeCyan, InkDark);
	UButton* CalendarButton = MakeGlassButton(TEXT("CALENDAR"), GlassEdgeCyan, InkDark);
	UButton* FinanceButton = MakeGlassButton(TEXT("FINANCE"), GlassEdgeCyan, InkDark);
	SetupButton->OnClicked.AddDynamic(this, &UBossHubWidget::HandleSetupClicked);
	StaffButton->OnClicked.AddDynamic(this, &UBossHubWidget::HandleStaffClicked);
	CalendarButton->OnClicked.AddDynamic(this, &UBossHubWidget::HandleCalendarClicked);
	FinanceButton->OnClicked.AddDynamic(this, &UBossHubWidget::HandleFinanceClicked);

	UButton* NavButtons[] = { SetupButton, StaffButton, CalendarButton, FinanceButton };
	for (UButton* NavButton : NavButtons)
	{
		if (UVerticalBoxSlot* S = Cast<UVerticalBoxSlot>(NavRail->AddChild(NavButton)))
		{
			S->SetHorizontalAlignment(HAlign_Fill);
			S->SetPadding(FMargin(0.0f, 0.0f, 0.0f, 20.0f));
		}
	}

	// ---- Right rail: standings, track map, PROCEED ----
	UVerticalBox* RightRail = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass(), TEXT("RightRail"));
	if (UCanvasPanelSlot* S = Cast<UCanvasPanelSlot>(Root->AddChild(RightRail)))
	{
		S->SetAnchors(FAnchors(1.0f, 0.0f, 1.0f, 1.0f));
		S->SetOffsets(FMargin(-20.0f, 78.0f, 330.0f, 24.0f));
		S->SetAlignment(FVector2D(1.0f, 0.0f));
	}

	auto AddRailCard = [&](const FString& Title, UVerticalBox*& OutRowsBox)
	{
		UBorder* Card = MakeCard();
		UVerticalBox* CardStack = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		Card->SetContent(CardStack);

		UTextBlock* Header = MakeText(Title, 16, InkDark);
		if (UVerticalBoxSlot* HS = Cast<UVerticalBoxSlot>(CardStack->AddChild(Header)))
		{
			HS->SetPadding(FMargin(0.0f, 0.0f, 0.0f, 8.0f));
		}

		OutRowsBox = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
		CardStack->AddChild(OutRowsBox);

		if (UVerticalBoxSlot* CS = Cast<UVerticalBoxSlot>(RightRail->AddChild(Card)))
		{
			CS->SetHorizontalAlignment(HAlign_Fill);
			CS->SetPadding(FMargin(0.0f, 0.0f, 0.0f, 14.0f));
		}
	};

	AddRailCard(TEXT("TEAM STANDINGS"), TeamStandingsBox);
	AddRailCard(TEXT("DRIVER STANDINGS"), DriverStandingsBox);

	// Track map card
	UBorder* TrackCard = MakeCard();
	USizeBox* TrackSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	TrackSize->SetHeightOverride(150.0f);
	UTrackMapWidget* TrackMap = CreateWidget<UTrackMapWidget>(this);
	TrackSize->AddChild(TrackMap);
	TrackCard->SetContent(TrackSize);
	if (UVerticalBoxSlot* S = Cast<UVerticalBoxSlot>(RightRail->AddChild(TrackCard)))
	{
		S->SetHorizontalAlignment(HAlign_Fill);
		S->SetPadding(FMargin(0.0f, 0.0f, 0.0f, 14.0f));
	}

	// PROCEED
	UButton* ProceedButton = MakeGlassButton(TEXT("PROCEED"), ProceedGreen, ProceedGreen);
	ProceedButton->OnClicked.AddDynamic(this, &UBossHubWidget::HandleProceedClicked);
	if (UVerticalBoxSlot* S = Cast<UVerticalBoxSlot>(RightRail->AddChild(ProceedButton)))
	{
		S->SetHorizontalAlignment(HAlign_Fill);
	}
}

UBorder* UBossHubWidget::MakeCard(float CornerRadius) const
{
	using namespace PaddockHubStyle;
	UBorder* Card = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
	Card->SetBrush(RoundedBrush(CardFill, CornerRadius, CardEdge, 1.0f));
	Card->SetPadding(FMargin(14.0f, 12.0f));
	return Card;
}

UButton* UBossHubWidget::MakeGlassButton(const FString& Label, FLinearColor OutlineColor, FLinearColor LabelColor) const
{
	using namespace PaddockHubStyle;
	UButton* Button = WidgetTree->ConstructWidget<UButton>(UButton::StaticClass());

	FButtonStyle Style;
	Style.Normal = RoundedBrush(FLinearColor(1.0f, 1.0f, 1.0f, 0.90f), 9.0f, OutlineColor, 2.0f);
	Style.Hovered = RoundedBrush(FLinearColor(1.0f, 1.0f, 1.0f, 1.0f), 9.0f, OutlineColor, 2.5f);
	Style.Pressed = RoundedBrush(FLinearColor(0.90f, 0.94f, 0.95f, 1.0f), 9.0f, OutlineColor, 2.0f);
	Style.NormalPadding = FMargin(0.0f);
	Style.PressedPadding = FMargin(0.0f, 1.5f, 0.0f, -1.5f);
	Button->SetStyle(Style);

	UTextBlock* Text = MakeText(Label, 20, LabelColor);
	if (UButtonSlot* S = Cast<UButtonSlot>(Button->AddChild(Text)))
	{
		S->SetPadding(FMargin(20.0f, 13.0f));
		S->SetHorizontalAlignment(HAlign_Center);
		S->SetVerticalAlignment(VAlign_Center);
	}
	return Button;
}

UTextBlock* UBossHubWidget::MakeText(const FString& Value, int32 Size, FLinearColor Color, bool bBold) const
{
	UTextBlock* Text = WidgetTree->ConstructWidget<UTextBlock>(UTextBlock::StaticClass());
	Text->SetText(FText::FromString(Value));
	Text->SetFont(FCoreStyle::GetDefaultFontStyle(bBold ? "Bold" : "Regular", Size));
	Text->SetColorAndOpacity(FSlateColor(Color));
	return Text;
}

void UBossHubWidget::AddStandingRow(UVerticalBox* TargetBox, int32 Position, FLinearColor Accent,
	const FString& Name, int32 Points, bool bHighlight) const
{
	using namespace PaddockHubStyle;

	UHorizontalBox* Row = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());

	UTextBlock* RankText = MakeText(FString::FromInt(Position), 14, InkMid);
	if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Row->AddChild(RankText)))
	{
		S->SetVerticalAlignment(VAlign_Center);
		S->SetPadding(FMargin(0.0f, 0.0f, 8.0f, 0.0f));
	}

	UBorder* Tick = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
	Tick->SetBrush(RoundedBrush(Accent, 2.0f));
	USizeBox* TickSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
	TickSize->SetWidthOverride(5.0f);
	TickSize->SetHeightOverride(16.0f);
	TickSize->AddChild(Tick);
	if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Row->AddChild(TickSize)))
	{
		S->SetVerticalAlignment(VAlign_Center);
		S->SetPadding(FMargin(0.0f, 0.0f, 8.0f, 0.0f));
	}

	UTextBlock* NameText = MakeText(Name, 15, bHighlight ? MoneyGreen : InkDark);
	if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Row->AddChild(NameText)))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
		S->SetVerticalAlignment(VAlign_Center);
	}

	UTextBlock* PointsText = MakeText(FString::FromInt(Points), 15, InkDark);
	if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Row->AddChild(PointsText)))
	{
		S->SetHorizontalAlignment(HAlign_Right);
		S->SetVerticalAlignment(VAlign_Center);
	}

	if (UVerticalBoxSlot* S = Cast<UVerticalBoxSlot>(TargetBox->AddChild(Row)))
	{
		S->SetPadding(FMargin(0.0f, 3.0f));
	}
}

// ---------------------------------------------------------------------------
// Data -> visuals
// ---------------------------------------------------------------------------

void UBossHubWidget::UpdateVisuals()
{
	if (BalanceValueText)
	{
		BalanceValueText->SetText(FText::FromString(FormatMoney(CurrentHubData.TeamVitals.Balance)));
	}
	if (InfluenceValueText)
	{
		const int32 Influence = CurrentHubData.Influence > 0 ? CurrentHubData.Influence : CurrentHubData.TeamVitals.Prestige;
		InfluenceValueText->SetText(FText::FromString(FString::FromInt(Influence)));
	}
	if (NetSpendValueText)
	{
		NetSpendValueText->SetText(FText::FromString(FormatMoney(CurrentHubData.NetSpend)));
	}
	if (TeamLogoNameText && !CurrentHubData.TeamName.IsEmpty())
	{
		FString Wrapped = CurrentHubData.TeamName;
		Wrapped.ReplaceInline(TEXT(" "), TEXT("\n"));
		TeamLogoNameText->SetText(FText::FromString(Wrapped));
	}
	RebuildStandings();
}

void UBossHubWidget::RebuildStandings()
{
	using namespace PaddockHubStyle;

	if (!TeamStandingsBox || !DriverStandingsBox)
	{
		return;
	}

	TeamStandingsBox->ClearChildren();
	DriverStandingsBox->ClearChildren();

	if (CurrentHubData.TeamStandings.Num() > 0)
	{
		int32 Pos = 1;
		for (const FTeamStandingRow& Row : CurrentHubData.TeamStandings)
		{
			AddStandingRow(TeamStandingsBox, Row.Position > 0 ? Row.Position : Pos, Row.AccentColor, Row.TeamName, Row.Points, Row.bIsPlayerTeam);
			++Pos;
		}
	}
	else
	{
		// Placeholder rows (reference art) until the backend career session connects.
		AddStandingRow(TeamStandingsBox, 1, FLinearColor(FColor::FromHex(TEXT("#2ec4b6"))), TEXT("Motocycing"), 334, false);
		AddStandingRow(TeamStandingsBox, 2, FLinearColor(FColor::FromHex(TEXT("#e63946"))), TEXT("Kero Team"), 216, false);
		AddStandingRow(TeamStandingsBox, 3, FLinearColor(FColor::FromHex(TEXT("#f4a261"))), TEXT("Bractica"), 166, false);
		AddStandingRow(TeamStandingsBox, 4, FLinearColor(FColor::FromHex(TEXT("#457b9d"))), TEXT("New Team"), 92, false);
		AddStandingRow(TeamStandingsBox, 5, FLinearColor(FColor::FromHex(TEXT("#f28482"))), TEXT("Bussolier"), 0, false);
	}

	const TArray<FRiderStanding>& Drivers = CurrentHubData.DriverStandings.Num() > 0
		? CurrentHubData.DriverStandings
		: CurrentHubData.TopRiders;

	if (Drivers.Num() > 0)
	{
		int32 Pos = 1;
		for (const FRiderStanding& Row : Drivers)
		{
			AddStandingRow(DriverStandingsBox, Row.Position > 0 ? Row.Position : Pos, Row.AccentColor, Row.RiderName, Row.Points, Row.bIsPlayerRider);
			++Pos;
		}
	}
	else
	{
		AddStandingRow(DriverStandingsBox, 1, FLinearColor(FColor::FromHex(TEXT("#2ec4b6"))), TEXT("Martinez"), 456, false);
		AddStandingRow(DriverStandingsBox, 2, FLinearColor(FColor::FromHex(TEXT("#e63946"))), TEXT("Chen"), 423, false);
		AddStandingRow(DriverStandingsBox, 3, FLinearColor(FColor::FromHex(TEXT("#f4a261"))), TEXT("Williams"), 401, false);
		AddStandingRow(DriverStandingsBox, 4, FLinearColor(FColor::FromHex(TEXT("#457b9d"))), TEXT("Davis"), 378, false);
		AddStandingRow(DriverStandingsBox, 5, FLinearColor(FColor::FromHex(TEXT("#f28482"))), TEXT("Taylor"), 356, false);
	}
}

FString UBossHubWidget::FormatMoney(float Amount)
{
	const bool bNegative = Amount < 0.0f;
	const int64 Value = static_cast<int64>(FMath::RoundToDouble(FMath::Abs(Amount)));
	const FString Digits = FString::Printf(TEXT("%lld"), Value);

	FString Result;
	int32 Count = 0;
	for (int32 Index = Digits.Len() - 1; Index >= 0; --Index)
	{
		Result.InsertAt(0, Digits[Index]);
		if (++Count % 3 == 0 && Index > 0)
		{
			Result.InsertAt(0, TEXT(","));
		}
	}
	return (bNegative ? TEXT("-$") : TEXT("$")) + Result;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

void UBossHubWidget::HandleSetupClicked()
{
	UE_LOG(LogTemp, Log, TEXT("BossHub: SETUP"));
	OnNavigate.Broadcast(TEXT("Setup"));
}

void UBossHubWidget::HandleStaffClicked()
{
	UE_LOG(LogTemp, Log, TEXT("BossHub: STAFF"));
	OnNavigate.Broadcast(TEXT("Staff"));
}

void UBossHubWidget::HandleCalendarClicked()
{
	UE_LOG(LogTemp, Log, TEXT("BossHub: CALENDAR"));
	OnNavigate.Broadcast(TEXT("Calendar"));
}

void UBossHubWidget::HandleFinanceClicked()
{
	UE_LOG(LogTemp, Log, TEXT("BossHub: FINANCE"));
	OnNavigate.Broadcast(TEXT("Finance"));
}

void UBossHubWidget::HandleProceedClicked()
{
	UE_LOG(LogTemp, Log, TEXT("BossHub: PROCEED"));
	OnProceed.Broadcast();
	if (APIManager)
	{
		APIManager->StartRace();
	}
}
