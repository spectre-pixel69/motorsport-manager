#include "UI/RaceViewWidget.h"
#include "Blueprint/WidgetTree.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/ScrollBox.h"
#include "Components/ScrollBoxSlot.h"
#include "Components/Border.h"
#include "Components/TextBlock.h"
#include "Components/Button.h"
#include "Components/ButtonSlot.h"
#include "Components/SizeBox.h"
#include "Styling/CoreStyle.h"
#include "Styling/SlateBrush.h"

namespace RaceStyle
{
	// Dark broadcast palette (matches web RaceView / design tokens)
	static const FLinearColor Bg(0.039f, 0.055f, 0.153f, 1.0f);        // #0a0e27
	static const FLinearColor Tower(0.082f, 0.098f, 0.180f, 0.96f);    // #15192e-ish
	static const FLinearColor RowDark(0.06f, 0.075f, 0.14f, 1.0f);
	static const FLinearColor RowP1(0.95f, 0.61f, 0.07f, 0.16f);       // gold tint
	static const FLinearColor RowPlayer(0.906f, 0.298f, 0.235f, 0.16f);// red tint
	static const FLinearColor Ink(1.0f, 1.0f, 1.0f, 1.0f);
	static const FLinearColor Muted(0.53f, 0.57f, 0.63f, 1.0f);
	static const FLinearColor Gold(0.953f, 0.612f, 0.071f, 1.0f);
	static const FLinearColor Red(0.906f, 0.298f, 0.235f, 1.0f);
	static const FLinearColor Blue(0.204f, 0.596f, 0.859f, 1.0f);
	static const FLinearColor Green(0.18f, 0.80f, 0.443f, 1.0f);

	static FSlateBrush Box(const FLinearColor& Fill, float Radius = 0.0f)
	{
		FSlateBrush B;
		B.DrawAs = ESlateBrushDrawType::RoundedBox;
		B.TintColor = FSlateColor(Fill);
		B.OutlineSettings = FSlateBrushOutlineSettings(FVector4(Radius, Radius, Radius, Radius));
		B.OutlineSettings.RoundingType = ESlateBrushRoundingType::FixedRadius;
		return B;
	}
}

bool URaceViewWidget::Initialize()
{
	const bool bOk = Super::Initialize();
	if (bOk && WidgetTree && !WidgetTree->RootWidget)
	{
		BuildLayout();
		RebuildTower();
		RebuildFeed();
	}
	return bOk;
}

void URaceViewWidget::SetBroadcast(const FRaceBroadcast& InBroadcast)
{
	Broadcast = InBroadcast;
	if (TrackText) TrackText->SetText(FText::FromString(Broadcast.TrackName));
	if (WeatherText)
	{
		const FString W = FString::Printf(TEXT("%s  %s"),
			Broadcast.bWet ? TEXT("Wet") : TEXT("Dry"),
			*Broadcast.SessionName);
		WeatherText->SetText(FText::FromString(W));
	}
	if (LapText)
	{
		LapText->SetText(FText::FromString(Broadcast.bFinished
			? FString(TEXT("FINISH"))
			: FString::Printf(TEXT("LAP %d/%d"), Broadcast.Lap, Broadcast.TotalLaps)));
	}
	RebuildTower();
	RebuildFeed();
}

// ---------------------------------------------------------------------------

void URaceViewWidget::BuildLayout()
{
	using namespace RaceStyle;

	UCanvasPanel* Root = WidgetTree->ConstructWidget<UCanvasPanel>(UCanvasPanel::StaticClass(), TEXT("RaceRoot"));
	WidgetTree->RootWidget = Root;

	UBorder* BgBorder = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass(), TEXT("RaceBg"));
	BgBorder->SetBrush(Box(Bg));
	BgBorder->SetPadding(FMargin(16.0f));
	if (UCanvasPanelSlot* S = Cast<UCanvasPanelSlot>(Root->AddChild(BgBorder)))
	{
		S->SetAnchors(FAnchors(0, 0, 1, 1));
		S->SetOffsets(FMargin(0));
	}

	UHorizontalBox* Layout = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass(), TEXT("RaceLayout"));
	BgBorder->SetContent(Layout);

	// ---- Left: timing tower ----
	UBorder* TowerCard = MakeCard(Tower, 10.0f);
	if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Layout->AddChild(TowerCard)))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
		S->SetPadding(FMargin(0, 0, 12, 0));
	}
	UVerticalBox* TowerStack = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	TowerCard->SetContent(TowerStack);

	// tower head
	UHorizontalBox* Head = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	auto AddHead = [&](const FString& Label, ESlateSizeRule::Type Rule, EHorizontalAlignment HA)
	{
		UTextBlock* T = MakeText(Label, 11, Muted);
		if (UHorizontalBoxSlot* HS = Cast<UHorizontalBoxSlot>(Head->AddChild(T)))
		{
			HS->SetSize(FSlateChildSize(Rule));
			HS->SetHorizontalAlignment(HA);
		}
	};
	AddHead(TEXT("POS"), ESlateSizeRule::Automatic, HAlign_Left);
	AddHead(TEXT("RIDER"), ESlateSizeRule::Fill, HAlign_Left);
	AddHead(TEXT("GAP"), ESlateSizeRule::Automatic, HAlign_Right);
	if (UVerticalBoxSlot* HS = Cast<UVerticalBoxSlot>(TowerStack->AddChild(Head)))
	{
		HS->SetPadding(FMargin(6, 4, 6, 6));
	}

	TowerRowsBox = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	UScrollBox* TowerScroll = WidgetTree->ConstructWidget<UScrollBox>(UScrollBox::StaticClass());
	TowerScroll->AddChild(TowerRowsBox);
	if (UVerticalBoxSlot* SS = Cast<UVerticalBoxSlot>(TowerStack->AddChild(TowerScroll)))
	{
		SS->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}

	// ---- Right: main column ----
	UVerticalBox* Main = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass(), TEXT("RaceMain"));
	if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Layout->AddChild(Main)))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}

	// head: track/weather + lap
	UHorizontalBox* RaceHead = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
	UVerticalBox* HeadLeft = WidgetTree->ConstructWidget<UVerticalBox>(UVerticalBox::StaticClass());
	TrackText = MakeText(Broadcast.TrackName.IsEmpty() ? TEXT("—") : Broadcast.TrackName, 22, Ink);
	WeatherText = MakeText(TEXT("Dry"), 12, Muted, false);
	HeadLeft->AddChild(TrackText);
	HeadLeft->AddChild(WeatherText);
	if (UHorizontalBoxSlot* HL = Cast<UHorizontalBoxSlot>(RaceHead->AddChild(HeadLeft)))
	{
		HL->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}
	LapText = MakeText(TEXT("LAP 0/0"), 20, Gold);
	if (UHorizontalBoxSlot* LR = Cast<UHorizontalBoxSlot>(RaceHead->AddChild(LapText)))
	{
		LR->SetVerticalAlignment(VAlign_Center);
	}
	if (UVerticalBoxSlot* S = Cast<UVerticalBoxSlot>(Main->AddChild(RaceHead)))
	{
		S->SetPadding(FMargin(4, 0, 4, 10));
	}

	// feed
	UBorder* FeedCard = MakeCard(Tower, 10.0f);
	FeedScroll = WidgetTree->ConstructWidget<UScrollBox>(UScrollBox::StaticClass());
	FeedCard->SetContent(FeedScroll);
	if (UVerticalBoxSlot* S = Cast<UVerticalBoxSlot>(Main->AddChild(FeedCard)))
	{
		S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
		S->SetPadding(FMargin(0, 0, 0, 10));
	}

	// return button
	UButton* Return = WidgetTree->ConstructWidget<UButton>(UButton::StaticClass());
	FButtonStyle BS;
	BS.Normal = Box(FLinearColor(0.18f, 0.49f, 0.20f, 1.0f), 8.0f);
	BS.Hovered = Box(FLinearColor(0.22f, 0.56f, 0.24f, 1.0f), 8.0f);
	BS.Pressed = Box(FLinearColor(0.15f, 0.42f, 0.17f, 1.0f), 8.0f);
	Return->SetStyle(BS);
	Return->OnClicked.AddDynamic(this, &URaceViewWidget::HandleReturnClicked);
	UTextBlock* RLabel = MakeText(TEXT("Continue"), 16, Ink);
	if (UButtonSlot* BSlot = Cast<UButtonSlot>(Return->AddChild(RLabel)))
	{
		BSlot->SetPadding(FMargin(18, 10));
		BSlot->SetHorizontalAlignment(HAlign_Center);
	}
	if (UVerticalBoxSlot* S = Cast<UVerticalBoxSlot>(Main->AddChild(Return)))
	{
		S->SetHorizontalAlignment(HAlign_Right);
	}
}

void URaceViewWidget::RebuildTower()
{
	using namespace RaceStyle;
	if (!TowerRowsBox) return;
	TowerRowsBox->ClearChildren();

	for (const FRaceTowerRow& R : Broadcast.Tower)
	{
		UBorder* RowBg = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
		const FLinearColor Fill = R.bDnf ? RowDark
			: (R.Position == 1 ? RowP1 : (R.bIsPlayer ? RowPlayer : RowDark));
		RowBg->SetBrush(Box(Fill, 4.0f));
		RowBg->SetPadding(FMargin(6, 3));

		UHorizontalBox* Row = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());
		RowBg->SetContent(Row);

		// position
		UTextBlock* Pos = MakeText((R.bDnf || R.Position <= 0) ? FString(TEXT("–")) : FString::FromInt(R.Position),
			13, R.Position == 1 ? Gold : Muted);
		if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Row->AddChild(Pos)))
		{
			S->SetVerticalAlignment(VAlign_Center);
			S->SetPadding(FMargin(0, 0, 8, 0));
		}

		// team colour bar
		UBorder* Bar = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
		Bar->SetBrush(Box(R.TeamColor, 2.0f));
		USizeBox* BarSize = WidgetTree->ConstructWidget<USizeBox>(USizeBox::StaticClass());
		BarSize->SetWidthOverride(4.0f);
		BarSize->SetHeightOverride(16.0f);
		BarSize->AddChild(Bar);
		if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Row->AddChild(BarSize)))
		{
			S->SetVerticalAlignment(VAlign_Center);
			S->SetPadding(FMargin(0, 0, 8, 0));
		}

		// name
		UTextBlock* Name = MakeText(FString::Printf(TEXT("#%d %s"), R.Number, *R.RiderName),
			13, R.bDnf ? Muted : Ink, false);
		if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Row->AddChild(Name)))
		{
			S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
			S->SetVerticalAlignment(VAlign_Center);
		}

		// gap
		UTextBlock* Gap = MakeText(R.Gap, 12, R.bDnf ? Red : Muted, false);
		if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Row->AddChild(Gap)))
		{
			S->SetHorizontalAlignment(HAlign_Right);
			S->SetVerticalAlignment(VAlign_Center);
		}

		if (UVerticalBoxSlot* S = Cast<UVerticalBoxSlot>(TowerRowsBox->AddChild(RowBg)))
		{
			S->SetPadding(FMargin(0, 1));
		}
	}
}

void URaceViewWidget::RebuildFeed()
{
	using namespace RaceStyle;
	if (!FeedScroll) return;
	FeedScroll->ClearChildren();

	if (Broadcast.Feed.Num() == 0)
	{
		UTextBlock* Empty = MakeText(TEXT("Race starting..."), 12, Muted, false);
		FeedScroll->AddChild(Empty);
		return;
	}

	// newest first
	for (int32 i = Broadcast.Feed.Num() - 1; i >= 0; --i)
	{
		const FRaceFeedItem& Ev = Broadcast.Feed[i];
		UHorizontalBox* Line = WidgetTree->ConstructWidget<UHorizontalBox>(UHorizontalBox::StaticClass());

		UTextBlock* Lap = MakeText(FString::Printf(TEXT("L%d"), Ev.Lap), 11, Muted);
		if (UHorizontalBoxSlot* S = Cast<UHorizontalBoxSlot>(Line->AddChild(Lap)))
		{
			S->SetPadding(FMargin(0, 0, 8, 0));
		}
		UTextBlock* Txt = MakeText(Ev.Text, 12, FeedColor(Ev.Kind), false);
		Line->AddChild(Txt);

		if (UScrollBoxSlot* S = Cast<UScrollBoxSlot>(FeedScroll->AddChild(Line)))
		{
			S->SetPadding(FMargin(4, 2));
		}
	}
}

FLinearColor URaceViewWidget::FeedColor(const FString& Kind)
{
	using namespace RaceStyle;
	if (Kind == TEXT("crash")) return Red;
	if (Kind == TEXT("mechanical")) return Gold;
	if (Kind == TEXT("overtake")) return Blue;
	if (Kind == TEXT("fastLap")) return Green;
	return Muted;
}

UBorder* URaceViewWidget::MakeCard(const FLinearColor& Fill, float Radius) const
{
	UBorder* Card = WidgetTree->ConstructWidget<UBorder>(UBorder::StaticClass());
	Card->SetBrush(RaceStyle::Box(Fill, Radius));
	Card->SetPadding(FMargin(10.0f));
	return Card;
}

UTextBlock* URaceViewWidget::MakeText(const FString& Value, int32 Size, const FLinearColor& Color, bool bBold) const
{
	UTextBlock* T = WidgetTree->ConstructWidget<UTextBlock>(UTextBlock::StaticClass());
	T->SetText(FText::FromString(Value));
	T->SetFont(FCoreStyle::GetDefaultFontStyle(bBold ? "Bold" : "Regular", Size));
	T->SetColorAndOpacity(FSlateColor(Color));
	return T;
}

void URaceViewWidget::HandleReturnClicked()
{
	OnReturnToHub.Broadcast();
}
