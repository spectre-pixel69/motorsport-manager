#include "ShowroomStage.h"
#include "Camera/CameraComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/SpotLightComponent.h"
#include "Components/DirectionalLightComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

namespace
{
	UStaticMesh* GPlaneMesh = nullptr;
	UStaticMesh* GCubeMesh = nullptr;
	UStaticMesh* GCylinderMesh = nullptr;
}

AShowroomStage::AShowroomStage()
{
	PrimaryActorTick.bCanEverTick = false;

	static ConstructorHelpers::FObjectFinder<UStaticMesh> PlaneFinder(TEXT("/Engine/BasicShapes/Plane.Plane"));
	static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeFinder(TEXT("/Engine/BasicShapes/Cube.Cube"));
	static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderFinder(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
	GPlaneMesh = PlaneFinder.Object;
	GCubeMesh = CubeFinder.Object;
	GCylinderMesh = CylinderFinder.Object;

	StageRoot = CreateDefaultSubobject<USceneComponent>(TEXT("StageRoot"));
	RootComponent = StageRoot;

	// Room shell
	Floor = MakeMeshComponent(TEXT("Floor"), GPlaneMesh, FVector(0, 0, 0), FRotator::ZeroRotator, FVector(60, 60, 1));
	BackWall = MakeMeshComponent(TEXT("BackWall"), GCubeMesh, FVector(900, 0, 400), FRotator::ZeroRotator, FVector(0.2f, 40, 8));

	// Display platform
	Platform = MakeMeshComponent(TEXT("Platform"), GCylinderMesh, FVector(0, 0, 8), FRotator::ZeroRotator, FVector(5, 5, 0.16f));

	// Bike placeholder (engine shapes) — swap with the real bike asset in editor
	BikeRearWheel = MakeMeshComponent(TEXT("BikeRearWheel"), GCylinderMesh, FVector(-70, 0, 46), FRotator(0, 0, 90), FVector(0.6f, 0.6f, 0.18f));
	BikeFrontWheel = MakeMeshComponent(TEXT("BikeFrontWheel"), GCylinderMesh, FVector(75, 0, 46), FRotator(0, 0, 90), FVector(0.6f, 0.6f, 0.18f));
	BikeBody = MakeMeshComponent(TEXT("BikeBody"), GCubeMesh, FVector(0, 0, 80), FRotator(0, 0, 0), FVector(1.35f, 0.24f, 0.34f));
	BikeTank = MakeMeshComponent(TEXT("BikeTank"), GCubeMesh, FVector(15, 0, 100), FRotator(-8, 0, 0), FVector(0.55f, 0.2f, 0.16f));

	// Lighting — bright, clean showroom
	KeyLight = CreateDefaultSubobject<UDirectionalLightComponent>(TEXT("KeyLight"));
	KeyLight->SetupAttachment(StageRoot);
	KeyLight->SetRelativeRotation(FRotator(-55.0f, -30.0f, 0.0f));
	KeyLight->SetIntensity(4.0f);
	KeyLight->SetMobility(EComponentMobility::Movable);

	PlatformSpotA = CreateDefaultSubobject<USpotLightComponent>(TEXT("PlatformSpotA"));
	PlatformSpotA->SetupAttachment(StageRoot);
	PlatformSpotA->SetRelativeLocation(FVector(-150, 200, 420));
	PlatformSpotA->SetRelativeRotation(FRotator(-70.0f, -50.0f, 0.0f));
	PlatformSpotA->SetIntensity(40000.0f);
	PlatformSpotA->SetOuterConeAngle(42.0f);
	PlatformSpotA->SetMobility(EComponentMobility::Movable);

	PlatformSpotB = CreateDefaultSubobject<USpotLightComponent>(TEXT("PlatformSpotB"));
	PlatformSpotB->SetupAttachment(StageRoot);
	PlatformSpotB->SetRelativeLocation(FVector(200, -180, 420));
	PlatformSpotB->SetRelativeRotation(FRotator(-70.0f, 130.0f, 0.0f));
	PlatformSpotB->SetIntensity(40000.0f);
	PlatformSpotB->SetOuterConeAngle(42.0f);
	PlatformSpotB->SetMobility(EComponentMobility::Movable);

	// Hub camera — frames the bike center-screen between the UI rails
	HubCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("HubCamera"));
	HubCamera->SetupAttachment(StageRoot);
	HubCamera->SetRelativeLocation(FVector(-420, 300, 170));
	HubCamera->SetRelativeRotation(FRotator(-11.0f, -35.5f, 0.0f));
	HubCamera->SetFieldOfView(50.0f);
}

void AShowroomStage::BeginPlay()
{
	Super::BeginPlay();

	const FLinearColor ShowroomWhite(0.92f, 0.92f, 0.93f);
	const FLinearColor PlatformGray(0.72f, 0.73f, 0.75f);
	const FLinearColor BikeDark(0.08f, 0.08f, 0.10f);
	const FLinearColor BikeBlue(0.10f, 0.22f, 0.55f);

	TintMesh(Floor, ShowroomWhite);
	TintMesh(BackWall, ShowroomWhite);
	TintMesh(Platform, PlatformGray);
	TintMesh(BikeFrontWheel, BikeDark);
	TintMesh(BikeRearWheel, BikeDark);
	TintMesh(BikeBody, BikeBlue);
	TintMesh(BikeTank, ShowroomWhite);
}

UStaticMeshComponent* AShowroomStage::MakeMeshComponent(const TCHAR* Name, UStaticMesh* Mesh,
	const FVector& Location, const FRotator& Rotation, const FVector& Scale)
{
	UStaticMeshComponent* Component = CreateDefaultSubobject<UStaticMeshComponent>(Name);
	Component->SetupAttachment(StageRoot);
	if (Mesh)
	{
		Component->SetStaticMesh(Mesh);
	}
	Component->SetRelativeLocation(Location);
	Component->SetRelativeRotation(Rotation);
	Component->SetRelativeScale3D(Scale);
	Component->SetMobility(EComponentMobility::Movable);
	Component->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	return Component;
}

void AShowroomStage::TintMesh(UStaticMeshComponent* Mesh, const FLinearColor& Color)
{
	if (!Mesh)
	{
		return;
	}
	if (UMaterialInstanceDynamic* MID = Mesh->CreateAndSetMaterialInstanceDynamic(0))
	{
		MID->SetVectorParameterValue(TEXT("Color"), Color);
	}
}
