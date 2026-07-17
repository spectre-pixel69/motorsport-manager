# Parts Economy System Verification

## Changes Implemented

### 1. Lead Time Correction: 1-2 Weeks
- **Previous**: 6-8 weeks (2-3 round delays)
- **Current**: 1-2 weeks (1-2 round delays)
- **Location**: `src/game/parts-economy.ts:93`
- **Effect**: Faster engine order fulfillment, teams can react to mid-season needs

### 2. ATK Manufacturer (Parts Company)
- **Status**: Added to manufacturer roster
- **Engine Type**: 2-Stroke (`strokes: '2S'`)
- **Reliability**: Balanced (not fragile or bulletproof)
- **Performance Ceiling**: 84 (competitive)
- **Color**: #ff6b35 (distinct orange)
- **Location**: `src/data/parody.ts:23`

### 3. ATK Special Treatment

#### Financial Resilience
- **Always State**: `stable` (never crisis/stressed)
- **Operating Cost**: $150k/season (vs $200k for others)
- **Production Capacity**: 100% (1.0, regardless of cash flow)
- **Cost Multiplier**: 0.95x (cheaper than baseline $80k engines)
- **Location**: `src/game/parts-economy.ts:23-30`

#### Fulfillment Guarantee
- **Always Fulfills**: 100% of orders on time
- **No Financial Constraints**: Capacity never drops due to cash shortage
- **Rationale**: Parts company origin → existing infrastructure, supply chains, cash reserves
- **Location**: `src/game/parts-economy.ts:87-90`

## System Architecture

```
Engine Order Flow:
  1. Team places order (off-season or mid-season rush)
     - Orderer specifies: manufacturerId, rushOrder flag
     - Cost calculated: base * state multiplier + rush premium (1.2-1.4x)
     - expectedArrivalSeason set based on lead time

  2. Each season: advanceSeason() processes fulfillment
     - updateManufacturerFinance(): simulate cash flow, determine state
     - fulfillEngineOrder(): check if order can be fulfilled
     - ATK: always fulfilled
     - Others: random check against productionCapacity (50%-100%)

  3. Manufacturer Financial Dynamics (non-ATK):
     - Revenue: $50k per fulfilled order
     - Costs: $200k/season infrastructure
     - States:
       - Crisis (<$100k): 50% capacity, +50% cost premium
       - Stressed ($100k-$300k): 70% capacity, +20% cost premium
       - Stable ($300k+): 100% capacity, baseline cost
       - Recovering (crisis→stable): 80% capacity, +15% cost
```

## Competitive Impact

### Winning Teams Advantage
- Prize money accumulates
- Can order ATK engines (guaranteed, cheaper)
- Gain mid-season performance boost
- Create funding gap vs struggling teams

### Supply Chain Realism
- Manufacturer crisis creates supply shortages
- Teams must plan engine purchases carefully
- No "guaranteed" parts supplier except ATK
- Creates year-to-year uncertainty, prevents dynasties

### 100-Season Sustainability
- ATK ensures at least one reliable manufacturer exists
- Other manufacturers cycle through financial states
- No single team can dominate indefinitely
- Competitive balance improves over long careers

## Code Changes Summary

### src/data/parody.ts
- Added ATK to MANUFACTURERS_BASE (line 23)
- Updated initializeManufacturers() to:
  - Give ATK $75k base engine cost (vs $80k)
  - Maintain 1.0 capacity at init (overridden in update function)

### src/game/parts-economy.ts
- updateManufacturerFinance(): Added ATK special case (lines 23-30)
  - Always stable, 100% capacity, 0.95x cost multiplier
  - Lower operating costs ($150k vs $200k)
- fulfillEngineOrder(): Added ATK special case (lines 87-90)
  - Always returns true (100% fulfillment)
  - No financial constraints apply

### src/data/universe.ts
- Fixed circular dependency: pass manufacturers to makeTeam, buildRoadDiscipline, buildNAMC
- Ensures all team creation uses current manufacturer list

### src/data/riders.ts
- Added missing seasonsInCurrentClass: 1 field to rider factory function
- Enables 250P class progression tracking

## Testing Vectors

1. **Manufacturer State Transitions**: Run 5+ season simulation, verify crisis→recovery cycle
2. **ATK Stability**: Verify ATK never enters crisis or stressed states
3. **Lead Time**: Check that unfulfilled orders delay 1-2 rounds, not 2-3
4. **Cost Correlation**: Verify manufacturer cost increases with financial distress
5. **Long Career**: 100-season sim should show competitive parity improvement over time

## Next Phase

Once verified stable:
1. Implement team parts ordering UI (off-season screen)
2. Wire engine performance modifiers into race simulation
3. Add chassis development system
4. Implement parts rebuild mechanics (cost, timing)
5. Build manufacturer health dashboard (business view)
