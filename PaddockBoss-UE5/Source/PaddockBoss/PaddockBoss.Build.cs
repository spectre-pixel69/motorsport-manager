using UnrealBuildTool;

public class PaddockBoss : ModuleRules
{
	public PaddockBoss(ReadOnlyTargetRules Target) : base(Target)
	{
		Type = ModuleType.Runtime;
		DefaultBuildSettings = BuildSettingsVersion.V4;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;

		PublicDependencyModuleNames.AddRange(new string[] {
			"Core",
			"CoreUObject",
			"Engine",
			"InputCore",
			"UMG",
			"Slate",
			"SlateCore",
			"CommonGame",
			"CommonUI",
			"GameplayAbilities",
			"GameplayTags",
			"GameplayTasks",
			"HTTP",
			"Json",
			"JsonUtilities"
		});

		PrivateDependencyModuleNames.AddRange(new string[] {
			"CommonInput",
			"EnhancedInput"
		});
	}
}
