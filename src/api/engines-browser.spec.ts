/**
 * ENGINE BROWSER INTERACTION SPEC
 * Progressive disclosure: Hover → Tooltip Preview → Click Zoom → Multi-class Purchase
 */

// ============================================================================
// INTERACTION FLOW
// ============================================================================
/*
FLOW 1: HOVER OVER ENGINE IN SHOWROOM
- User hovers over engine thumbnail (e.g., "Spectre Dual-Rotor")
- Tooltip popup appears (mouse position or fixed)
- Shows:
  * Engine name + manufacturer
  * Horsepower (47-52 HP range)
  * Weight (54-63 lbs)
  * Annual lease cost ($280k-$600k)
  * 350 Pro engine price (class-specific)
  * 250 Men engine price (class-specific)
  * 250P Restricted price (class-specific)
  * Women's 250 price (class-specific)
  * Checkbox: "Select this engine"

FLOW 2: CLICK ENGINE (or checkbox checked)
- Screen zooms/transitions to detail view
- Left side: Large engine visualization, 3D model or high-res image
- Right side: Full stats panel
  * Name, manufacturer, description
  * Horsepower, Weight, Reliability, Base lap time
  * All OVR pillar bonuses (+Tech Line +3, +Race Endurance +2, etc.)

- Below stats: CLASS PURCHASE BOXES (vertical stack or grid)
  * [350 PRO CLASS]
    - Lease cost: $380,000
    - Checkbox: "Assign to 350 Pro"
    - Quantity selector: 1-2 bikes

  * [250 MEN CLASS]
    - Lease cost: $380,000
    - Checkbox: "Assign to 250"
    - Quantity selector: 1-2 bikes

  * [250P RESTRICTED]
    - Lease cost: $280,000 (restricted)
    - Checkbox: "Assign to 250P"
    - Quantity selector: 1-2 bikes
    - NOTE: Some engines locked (only "restricted-450" available)

  * [WOMEN'S 250]
    - Lease cost: varies by engine
    - Checkbox: "Assign to Women's 250"
    - Quantity selector: 1-2 bikes

- Right side budget tracker shows:
  * Total cost if all boxes checked
  * Remaining budget
  * Red warning if over budget

FLOW 3: CONFIRM SELECTION
- "Add to cart" or "Confirm" button
- Returns to showroom view with selected engines highlighted
- Budget updated
- Can select more engines or proceed to chassis selection
*/

// ============================================================================
// API ENDPOINTS FOR ENGINE BROWSER
// ============================================================================

export interface EngineHoverData {
  engineId: string;
  name: string;
  manufacturer: string;
  horsepower: number;
  weight: number; // lbs
  yearlyLeaseCost: number;
  classSpecificCosts: {
    '350-pro': number;
    '250': number;
    '250p': number;
    'womens-250': number;
  };
  description: string;
  ovrBonus: {
    styleOrScrub?: number;
    technicalLine?: number;
    startGateJump?: number;
    raceEndurance?: number;
    trackAwareness?: number;
  };
}

export interface EngineDetailView extends EngineHoverData {
  reliability: number; // 0-100
  baseLapTime: number; // seconds
  compatibleChassis: string[]; // chassis IDs that work with this engine
}

export interface ClassPurchaseOption {
  class: '350-pro' | '250' | '250p' | 'womens-250';
  leasePrice: number; // per bike
  maxBikes: 2; // max 2 per class per charter
  selected: boolean;
  quantity: number;
  totalCost: number;
}

export interface EngineCart {
  engines: {
    engineId: string;
    purchases: ClassPurchaseOption[];
  }[];
  totalCost: number;
  budgetRemaining: number;
}

/*
EXAMPLE API CALLS:

1. GET /api/engines/list
   Returns: EngineHoverData[] for all 11 engines
   Use: Populate showroom thumbnails

2. GET /api/engines/{engineId}/detail
   Returns: EngineDetailView with full stats
   Use: When user clicks to zoom

3. POST /api/team/{teamId}/engines/add
   Body: { engineId, classSelections: { '350-pro': 1, '250': 2, ... } }
   Returns: Updated budget, confirms addition to cart
   Use: When user confirms selections

4. GET /api/team/{teamId}/engines/cart
   Returns: EngineCart with current selections
   Use: Show budget and review before committing

5. POST /api/team/{teamId}/engines/commit
   Finalizes engine selections, deducts from budget
   Returns: Updated team state, moves to next step (chassis selection)
*/
