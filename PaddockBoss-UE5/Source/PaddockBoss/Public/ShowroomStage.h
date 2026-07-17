#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ShowroomStage.generated.h"

class UStaticMeshComponent;
class UCameraComponent;
class USpotLightComponent;
class UDirectionalLightComponent;

/**
 * White showroom stage rendered behind the hub UI (reference: art/reference hub screens).
 * Everything here is engine basic shapes as placeholder set dressing — swap the bike
 * placeholder and room for the photoreal showroom assets on the workstation, keeping
 * this actor as the camera + framing rig.
 */
UCLASS()
class PADDOCKBOSS_API AShowroomStage : public AActor
{
	GENERATED_BODY()

public:
	AShowroomStage();

	virtual void BeginPlay() override;

	UPROPERTY(VisibleAnywhere, Category = "Stage")
	USceneComponent* StageRoot;

	UPROPERTY(VisibleAnywhere, Category = "Stage")
	UCameraComponent* HubCamera;

	UPROPERTY(VisibleAnywhere, Category = "Stage")
	UStaticMeshComponent* Floor;

	UPROPERTY(VisibleAnywhere, Category = "Stage")
	UStaticMeshComponent* BackWall;

	UPROPERTY(VisibleAnywhere, Category = "Stage")
	UStaticMeshComponent* Platform;

	// Bike placeholder pieces — replaced by the real bike asset on the workstation
	UPROPERTY(VisibleAnywhere, Category = "Bike")
	UStaticMeshComponent* BikeFrontWheel;

	UPROPERTY(VisibleAnywhere, Category = "Bike")
	UStaticMeshComponent* BikeRearWheel;

	UPROPERTY(VisibleAnywhere, Category = "Bike")
	UStaticMeshComponent* BikeBody;

	UPROPERTY(VisibleAnywhere, Category = "Bike")
	UStaticMeshComponent* BikeTank;

	UPROPERTY(VisibleAnywhere, Category = "Lighting")
	UDirectionalLightComponent* KeyLight;

	UPROPERTY(VisibleAnywhere, Category = "Lighting")
	USpotLightComponent* PlatformSpotA;

	UPROPERTY(VisibleAnywhere, Category = "Lighting")
	USpotLightComponent* PlatformSpotB;

protected:
	UStaticMeshComponent* MakeMeshComponent(const TCHAR* Name, UStaticMesh* Mesh,
		const FVector& Location, const FRotator& Rotation, const FVector& Scale);

	void TintMesh(UStaticMeshComponent* Mesh, const FLinearColor& Color);
};
