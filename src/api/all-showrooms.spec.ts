/**
 * UNIFIED SHOWROOM PATTERN
 * All component browsers follow: Hover Preview → Click Zoom → Multi-class Purchase
 *
 * SHOWROOMS:
 * 1. Engines (11 options) - DONE
 * 2. Chassis (11 options)
 * 3. Tires (4 options)
 * 4. Electronics (4 options)
 * 5. Exhaust (4 options)
 * 6. Staff Hiring (6+ roles, 3 tiers each)
 *
 * Each follows identical UX: Hover → Tooltip → Click → Detail Zoom → Multi-select Purchase
 */

// ============================================================================
// 2. CHASSIS SHOWROOM (11 manufacturers)
// ============================================================================

/*
HOVER TOOLTIP:
- Name + Manufacturer
- Weight (lbs)
- Rigidity rating (0-100)
- Annual lease cost
- Class-specific pricing (scaled 90%-110% per class)
- Description (one-liner)
- Strengths/Weaknesses (2-3 bullets each)
- ☐ Select this chassis

CLICK ZOOM:
- Left: Chassis frame visualization (STL model or high-res image)
- Right panel:
  * Full specs: weight, rigidity, compatibleEngines[]
  * OVR bonuses (+Tech Line +1, etc.)
  * Detailed description
  * Strengths (expanded bullets)
  * Weaknesses (expanded bullets)

- MULTI-CLASS PURCHASE BOXES:
  [350 PRO] Lease: $310,000 | Qty: [1][+][-] ☐
  [250 MEN] Lease: $310,000 | Qty: [1][+][-] ☐
  [250P]    Lease: $279,000 | Qty: [1][+][-] ☐ (cheaper)
  [WOMEN]   Lease: $279,000 | Qty: [1][+][-] ☐

  TOTAL: $598,000 | BUDGET: $2.5M | REMAINING: $1,902,000
  [ADD TO CART] [BACK]
*/

// ============================================================================
// 3. TIRES SHOWROOM (4 manufacturers)
// ============================================================================

/*
HOVER TOOLTIP:
- Name (Dust Devil, Ironclad, Parrilla, Michelin)
- Manufacturer
- Grip rating (0-100)
- Wear rate (0-1, higher = faster wear)
- Cost per set
- Best for surfaces (loam, sand, hardpack, wet)
- One-liner description
- ☐ Select this tire

CLICK ZOOM:
- Left: Tire product shot (side profile, tread pattern visible)
- Right panel:
  * Full specs: grip, wear rate, durability (puncture resistance)
  * OVR bonuses (+Tech Line +1, etc.)
  * Detailed description
  * Strengths (expanded bullets)
  * Weaknesses (expanded bullets)
  * Best for surfaces (highlighted)

- MULTI-CLASS PURCHASE BOXES:
  [350 PRO] Cost: $180/set × 20 rounds = $3,600 | Qty: [1][+][-] ☐
  [250 MEN] Cost: $180/set × 20 rounds = $3,600 | Qty: [1][+][-] ☐
  [250P]    Cost: $180/set × 20 rounds = $3,600 | Qty: [1][+][-] ☐
  [WOMEN]   Cost: $180/set × 20 rounds = $3,600 | Qty: [1][+][-] ☐

  TOTAL: $14,400 | BUDGET: $2.5M | REMAINING: $1,887,600
  [ADD TO CART] [BACK]
*/

// ============================================================================
// 4. ELECTRONICS SHOWROOM (4 systems)
// ============================================================================

/*
HOVER TOOLTIP:
- System name (Factory-Spec, Vortex, GET, JD Jetting)
- Manufacturer/type
- Annual lease cost ($45k-$110k)
- Launch control type (automatic, manual, basic)
- Data logging capability (full, limited, none)
- Reliability rating
- One-liner description
- ☐ Select this system

CLICK ZOOM:
- Left: ECU/Electronics unit image (dashboard, wiring, components)
- Right panel:
  * Full specs: launch control, data logging, reliability
  * OVR bonuses (+Track Awareness +2, etc.)
  * Detailed description
  * Key features (expanded bullets)
  * Limitations (expanded bullets)
  * R&D unlock potential (e.g., "Unlock AI Traction Control with Tier 3 designer")

- MULTI-CLASS PURCHASE BOXES:
  [350 PRO] Annual: $110,000 (÷20 = $5,500/round) ☐
  [250 MEN] Annual: $110,000 (÷20 = $5,500/round) ☐
  [250P]    Annual: $110,000 (÷20 = $5,500/round) ☐ (same for restricted)
  [WOMEN]   Annual: $110,000 (÷20 = $5,500/round) ☐

  TOTAL: $440,000 | BUDGET: $2.5M | REMAINING: $1,447,600
  [ADD TO CART] [BACK]
*/

// ============================================================================
// 5. EXHAUST SHOWROOM (4 systems: 1 OEM + 3 Aftermarket)
// ============================================================================

/*
HOVER TOOLTIP:
- System name (Factory OEM, Pro Circuit, FMF, Akrapovič)
- Manufacturer
- Material (steel, titanium, composite)
- Weight reduction (lbs saved vs OEM)
- Torque character (low-end, mid-range, top-end)
- Cost per bike
- Durability rating
- One-liner description
- ☐ Select this exhaust

CLICK ZOOM:
- Left: Exhaust product (header, pipe, silencer visible)
- Right panel:
  * Full specs: weight, torque character, durability, maintenance cost/round
  * OVR bonuses (+Start Gate Jump +2, etc.)
  * Detailed description
  * Performance traits (expanded bullets)
  * Trade-offs (expanded bullets)
  * R&D potential (e.g., "Custom torque map library unlock")

- MULTI-CLASS PURCHASE BOXES:
  [350 PRO] Per-bike: $2,000 | Qty: [1][+][-] ☐
  [250 MEN] Per-bike: $2,000 | Qty: [1][+][-] ☐
  [250P]    Per-bike: $2,000 | Qty: [1][+][-] ☐
  [WOMEN]   Per-bike: $2,000 | Qty: [1][+][-] ☐

  TOTAL: $8,000 | BUDGET: $2.5M | REMAINING: $1,439,600
  [ADD TO CART] [BACK]
*/

// ============================================================================
// 6. SUSPENSION SHOWROOM (5 preset profiles per track type)
// ============================================================================

/*
NOTE: Suspension is slightly different - it's "track-specific setup profiles"
not hardware purchase. Players select a preset, possibly unlock advanced tuning
via R&D, but don't "buy" suspension per class.

HOVER TOOLTIP:
- Profile name (Deep Sand, Hardpack Stadium, Wet Recovery, etc.)
- Track surface focus
- High-speed vs Low-speed compression settings
- OVR bonuses (+Technical Line +1, etc.)
- Rider fatigue factor
- One-liner description
- ☐ Select this profile

CLICK ZOOM:
- Left: Suspension component visualization (damper, spring, valve stack)
- Right panel:
  * Full profile specs: compression values, rebound, spring rate
  * OVR bonuses
  * Detailed description
  * Best for conditions (expanded bullets)
  * Rider feel (expanded bullets)
  * R&D potential (e.g., "Proprietary damping valving unlock")

- SINGLE-SELECT OPTION:
  Unlike engines/chassis/tires, suspension is ONE profile per season base build
  (but can switch per-round in race setup mode).

  ☐ Use this suspension profile as baseline
  
  (If they want advanced tuning: "Unlock track-specific suspension with Tier 3 Designer")
  
  [CONFIRM] [BACK]
*/

// ============================================================================
// 7. STAFF SHOWROOM (6 roles, 3 tiers each = 18 options)
// ============================================================================

/*
HOVER TOOLTIP:
- Role + Experience Tier (Chief Designer / Expert, Experienced, Junior)
- Name
- Annual salary
- Specialties (e.g., "Engine-Tuner, Suspension-Specialist, Telemetry-Analyst")
- R&D unlock tier (Tier 1, 2, or 3 capabilities)
- One-liner description
- ☐ Hire this staff member

CLICK ZOOM:
- Left: Staff photo/avatar or role icon
- Right panel:
  * Full resume: background, experience, specialties
  * Annual salary (clear cost)
  * R&D unlock tier (what they unlock)
  * OVR bonuses (+Race Endurance +1, etc.)
  * Key qualifications (expanded bullets)
  * Available specialties they cover
  * Career highlights

- SINGLE-SELECT PER ROLE (or multi-hire if budget allows):
  You're hiring a "team", so:
  
  FOR CHIEF DESIGNER:
  ☑ Antonio Rossi (Expert) - $500,000/year
  ☐ Lisa Henderson (Experienced) - $250,000/year
  ☐ Alex Morgan (Junior) - $100,000/year

  FOR LEAD MECHANIC:
  ☑ Dr. Kevin Caruso (Expert) - $200,000/year
  ☐ Marcus Webb (Experienced) - $120,000/year
  ☐ Tyler Rodriguez (Junior) - $60,000/year

  FOR ELECTRONICS TECH:
  ☐ Dr. Akira Yamamoto (Expert) - $150,000/year
  ☑ Jake Patterson (Experienced) - $90,000/year
  ☐ Sam Chen (Junior) - $45,000/year

  TOTAL STAFF COST: $840,000/year
  BUDGET: $2.5M | REMAINING: $1,660,000
  [CONFIRM] [BACK]
*/

// ============================================================================
// API PATTERN FOR ALL SHOWROOMS
// ============================================================================

/*
For each showroom, these endpoints:

1. GET /api/{component}/list
   Returns: Array of all options with hover preview data
   
2. GET /api/{component}/{id}/detail
   Returns: Full detail view data (specs, OVR, description, strengths/weaknesses)
   
3. POST /api/team/{teamId}/{component}/add
   Body: { id, classSelections?: {...} } or { id, staffRole?: 'chief-designer', ... }
   Returns: Confirmation, updated budget, remaining funds
   
4. GET /api/team/{teamId}/{component}/cart
   Returns: Current selections for this component category
   
5. POST /api/team/{teamId}/{component}/commit
   Finalizes selection, deducts from budget, locks in choice

EXAMPLE ENDPOINTS:
- /api/chassis/list
- /api/chassis/yamaha-star-racing/detail
- /api/team/{teamId}/chassis/add
- /api/tires/list
- /api/tires/michelin/detail
- /api/team/{teamId}/tires/add
- /api/electronics/list
- /api/staff/list
- /api/team/{teamId}/staff/hire (different naming for hiring vs purchasing)
*/
