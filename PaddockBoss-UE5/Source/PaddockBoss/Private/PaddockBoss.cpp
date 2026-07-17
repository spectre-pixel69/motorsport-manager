#include "PaddockBoss.h"
#include "Modules/ModuleManager.h"

#define LOCTEXT_NAMESPACE "FPaddockBossModule"

void FPaddockBossModule::StartupModule()
{
	UE_LOG(LogTemp, Warning, TEXT("PaddockBoss module started"));
}

void FPaddockBossModule::ShutdownModule()
{
	UE_LOG(LogTemp, Warning, TEXT("PaddockBoss module shutdown"));
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_MODULE(FPaddockBossModule, PaddockBoss)
