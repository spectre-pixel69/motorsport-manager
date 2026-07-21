/**
 * SEASONAL WEATHER MODEL
 * Based on Farmers Almanac regional patterns + NAMC calendar
 *
 * Determines realistic weatherBias for each track based on:
 * 1. Geographic region (Pacific NW, Southwest, Midwest, Northeast, etc.)
 * 2. Month of race (January = winter, July = summer, etc.)
 * 3. Historical precipitation patterns
 *
 * Keeps weather random but regionally/seasonally authentic.
 * Example: Arizona won't have monsoons in July, Pacific NW will be wet in January.
 */

export type Region =
  | 'pacific-nw'    // Washington, BC (wet climate)
  | 'southwest'     // Arizona, California desert (dry)
  | 'northern-ca'   // Northern California (dry summer, wet winter)
  | 'midwest'       // Colorado, Minnesota, Indiana (variable)
  | 'northeast'     // Massachusetts, Maryland, Pennsylvania (four seasons)
  | 'hawaii'        // Hawaii (tropical, year-round)
  | 'texas'         // Texas (hot, dry, occasional storms);

/**
 * REGIONAL WEATHER PATTERNS (based on Farmers Almanac)
 * Key: Jan=1, Feb=2, ..., Nov=11, Dec=12
 * Value: weatherBias (0.0-1.0 probability of wet)
 */
export const REGIONAL_WEATHER_PATTERNS: Record<Region, Record<number, number>> = {
  // Pacific Northwest: Wet fall/winter, drier summer
  'pacific-nw': {
    1: 0.55, 2: 0.50, 3: 0.45, 4: 0.35, 5: 0.25, 6: 0.20,
    7: 0.15, 8: 0.18, 9: 0.25, 10: 0.45, 11: 0.55, 12: 0.60,
  },

  // Southwest (Arizona, California desert): Dry year-round, rare monsoons July-Sept
  'southwest': {
    1: 0.08, 2: 0.06, 3: 0.05, 4: 0.04, 5: 0.03, 6: 0.03,
    7: 0.18, 8: 0.20, 9: 0.15, 10: 0.08, 11: 0.05, 12: 0.06,
  },

  // Northern California: Mediterranean climate (dry summer, wet winter)
  'northern-ca': {
    1: 0.40, 2: 0.38, 3: 0.32, 4: 0.20, 5: 0.10, 6: 0.05,
    7: 0.03, 8: 0.04, 9: 0.08, 10: 0.20, 11: 0.35, 12: 0.42,
  },

  // Midwest: Cold winters, humid summers, spring storms
  'midwest': {
    1: 0.28, 2: 0.25, 3: 0.30, 4: 0.38, 5: 0.35, 6: 0.32,
    7: 0.30, 8: 0.28, 9: 0.25, 10: 0.22, 11: 0.28, 12: 0.30,
  },

  // Northeast: Four distinct seasons, wet spring, variable winter (rain/snow)
  'northeast': {
    1: 0.32, 2: 0.30, 3: 0.35, 4: 0.40, 5: 0.38, 6: 0.35,
    7: 0.32, 8: 0.30, 9: 0.28, 10: 0.30, 11: 0.35, 12: 0.35,
  },

  // Hawaii: Tropical year-round, but seasonal variation (wet Nov-Feb, dry May-Sept)
  'hawaii': {
    1: 0.35, 2: 0.33, 3: 0.28, 4: 0.25, 5: 0.20, 6: 0.18,
    7: 0.20, 8: 0.22, 9: 0.25, 10: 0.30, 11: 0.38, 12: 0.40,
  },

  // Texas: Hot, dry most of year, occasional thunderstorms (spring/summer)
  'texas': {
    1: 0.12, 2: 0.10, 3: 0.15, 4: 0.20, 5: 0.22, 6: 0.18,
    7: 0.15, 8: 0.15, 9: 0.18, 10: 0.12, 11: 0.10, 12: 0.10,
  },
};

/**
 * TRACK-TO-REGION MAPPING
 * Maps each NAMC track to its regional weather pattern
 */
export const TRACK_REGIONS: Record<string, Region> = {
  fox: 'northern-ca',        // Pala, CA
  estero: 'pacific-nw',      // Ensenada, BC
  compedge: 'northern-ca',   // Adelanto, CA
  motoland: 'southwest',     // Casa Grande, AZ
  hangtown: 'northern-ca',   // Rancho Murieta, CA
  washougal: 'pacific-nw',   // Washougal, WA
  motopark: 'pacific-nw',    // Chilliwack, BC
  bigair: 'midwest',         // Big Sky, MT
  thunder: 'midwest',        // Lakewood, CO
  freestone: 'texas',        // Wortham, TX
  springcreek: 'midwest',    // Millville, MN
  ironman: 'midwest',        // Crawfordsville, IN
  redbud: 'midwest',         // Buchanan, MI
  southwick: 'northeast',    // Southwick, MA
  highpoint: 'northeast',    // Mt. Morris, PA
  buddscreek: 'northeast',   // Mechanicsville, MD
  whistler: 'pacific-nw',    // Whistler, BC
  anchorage: 'pacific-nw',   // Anchorage, AK
  waikoloa: 'hawaii',        // Waikoloa, HI
  glenhelen: 'northern-ca',  // Devore, CA
};

/**
 * Get seasonal weather bias for a track based on month
 * @param trackId - NAMC track ID
 * @param month - 1-12 (Jan-Dec)
 * @returns weatherBias (0.0-1.0)
 */
export function getSeasonalWeatherBias(trackId: string, month: number): number {
  const region = TRACK_REGIONS[trackId];
  if (!region) return 0.20; // fallback: neutral weather

  const pattern = REGIONAL_WEATHER_PATTERNS[region];
  const bias = pattern[month];

  if (bias === undefined) return 0.20; // fallback
  return Math.max(0.01, Math.min(0.99, bias)); // clamp to valid range
}

/**
 * Derive month from round number in NAMC calendar (Jan opener through Nov finale)
 * NAMC 2027 starts in January, runs through November (20 rounds across ~11 months)
 * Roughly: 2 rounds per month on average
 * @param roundNumber - 1-20
 * @returns month 1-12
 */
export function roundToMonth(roundNumber: number): number {
  // Spread 20 rounds across Jan(1) to Nov(11), roughly 2 per month
  // Round 1 = Jan, Rounds 2-3 = Feb, etc.
  const monthFloat = 1 + (roundNumber - 1) * (11 / 20);
  return Math.round(monthFloat);
}

/**
 * Get weather bias for a track at a specific round, accounting for seasonal patterns
 * @param trackId - NAMC track ID
 * @param roundNumber - 1-20 (NAMC season round)
 * @returns seasonally-adjusted weatherBias (0.0-1.0)
 */
export function getWeatherBiasForRound(trackId: string, roundNumber: number): number {
  const month = roundToMonth(roundNumber);
  return getSeasonalWeatherBias(trackId, month);
}
