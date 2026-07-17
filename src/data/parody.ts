// The parody universe: fictional manufacturers, sponsors, tire brands,
// factory teams, star riders and tracks. Names are original creations that
// evoke — but never copy — the real world. All logos are our own shapes.

import type { Manufacturer, Sponsor, TireBrand } from './types';

// ---------------------------------------------------------------- makers
export const MANUFACTURERS: Manufacturer[] = [
  { id: 'ducetti', name: 'Ducetti', color: '#d0021b', strokes: '4S', reliabilityBias: 'fragile', performanceCeiling: 95 },
  { id: 'hondra', name: 'Hondra', color: '#e8501e', strokes: 'both', reliabilityBias: 'balanced', performanceCeiling: 88 },
  { id: 'yamawa', name: 'Yamawa', color: '#1a49c4', strokes: 'both', reliabilityBias: 'balanced', performanceCeiling: 90 },
  { id: 'ktx', name: 'KTX', color: '#f07000', strokes: 'both', reliabilityBias: 'balanced', performanceCeiling: 87 },
  { id: 'apriya', name: 'Apriya', color: '#111111', strokes: '4S', reliabilityBias: 'fragile', performanceCeiling: 93 },
  { id: 'kawazuki', name: 'Kawazuki', color: '#3fae2a', strokes: 'both', reliabilityBias: 'bulletproof', performanceCeiling: 82 },
  { id: 'suzaka', name: 'Suzaka', color: '#2a6bd4', strokes: '4S', reliabilityBias: 'bulletproof', performanceCeiling: 80 },
  { id: 'bvm', name: 'BVM Motorrad', color: '#2f9de0', strokes: '4S', reliabilityBias: 'balanced', performanceCeiling: 85 },
  { id: 'stellar', name: 'Stellar Husk', color: '#e8e8e8', strokes: 'both', reliabilityBias: 'bulletproof', performanceCeiling: 78 },
  { id: 'gasgaz', name: 'GasGaz', color: '#cc1f2f', strokes: '2S', reliabilityBias: 'fragile', performanceCeiling: 92 },
  { id: 'triumf', name: 'Triumf', color: '#0e2a3a', strokes: '4S', reliabilityBias: 'bulletproof', performanceCeiling: 81 },
  { id: 'betta', name: 'Betta', color: '#b01d2e', strokes: '2S', reliabilityBias: 'balanced', performanceCeiling: 86 },
];

// ---------------------------------------------------------------- sponsors
export const SPONSORS: Sponsor[] = [
  { id: 'redballs', name: 'Red Balls', color: '#c8102e', tier: 'title' },
  { id: 'monsta', name: 'Monsta Energy', color: '#59c118', tier: 'title' },
  { id: 'repsoul', name: 'Repsoul', color: '#ff7a00', tier: 'title' },
  { id: 'goldwing', name: 'GoldWing Casinos', color: '#d4af37', tier: 'title' },
  { id: 'voltcola', name: 'Volt Cola', color: '#ffd400', tier: 'title' },
  { id: 'petronix', name: 'Petronix', color: '#00b3ad', tier: 'title' },
  { id: 'gobro', name: 'GoBro Cameras', color: '#222222', tier: 'major' },
  { id: 'oakly', name: 'Oakly Optics', color: '#3a3a3a', tier: 'major' },
  { id: 'alpinstarz', name: 'AlpineStarz', color: '#111111', tier: 'major' },
  { id: 'tizzot', name: 'Tizzot Watches', color: '#8a0f1f', tier: 'major' },
  { id: 'flowmax', name: 'FlowMax Filters', color: '#1e62c9', tier: 'minor' },
  { id: 'grithard', name: 'GritHard Tools', color: '#e0501a', tier: 'minor' },
  { id: 'sunbelt', name: 'SunBelt RV', color: '#f0a020', tier: 'minor' },
  { id: 'chugga', name: 'Chugga Coffee', color: '#5a3a20', tier: 'minor' },
  { id: 'burly', name: 'Burly Beef Jerky', color: '#7a2a12', tier: 'minor' },
  { id: 'hydrus', name: 'Hydrus Water', color: '#25a2d8', tier: 'minor' },
];

// ------------------------------------------------------------- tire brands
// NAMC Brands A-D: two global giants, two American underdogs (per rulebook 8.1)
// v15.3 Balance Update (2026-07-17): Equalized grip for competitive parity
// Grip alone determines pace (tireEdge = (78 - grip) * 0.012), so all ~81 for balance.
// Durability retained for flavor/tradeoff but currently unused in race engine.
export const TIRE_BRANDS: TireBrand[] = [
  { id: 'mishlen', name: 'Mishlen', color: '#1a52b0', grip: 81, durability: 78 },
  { id: 'pirella', name: 'Pirella', color: '#e8c50e', grip: 81, durability: 75 },
  { id: 'ironclad', name: 'IronClad Tire Co', color: '#8a1520', grip: 81, durability: 87 },
  { id: 'dustdevil', name: 'DustDevil Rubber', color: '#c96a1e', grip: 81, durability: 81 },
];

// ------------------------------------------------------ GP factory identity
// [team name, short, manufacturerId, primary, secondary, prestige]
export const GP_TEAMS: [string, string, string, string, string, number][] = [
  ['Ducetti Corse', 'DUC', 'ducetti', '#d0021b', '#ffffff', 95],
  ['Red Balls KTX Factory', 'KTX', 'ktx', '#12294a', '#f07000', 90],
  ['Monsta Yamawa GP', 'YAM', 'yamawa', '#1a49c4', '#59c118', 88],
  ['Repsoul Hondra Racing', 'HON', 'hondra', '#e8501e', '#ffffff', 87],
  ['Apriya Veloce', 'APR', 'apriya', '#111111', '#cc1f2f', 82],
  ['Suzaka Blue Comet', 'SUZ', 'suzaka', '#2a6bd4', '#c8d8f0', 80],
  ['Grezzini Ducetti', 'GRZ', 'ducetti', '#8ec6e6', '#d0021b', 74],
  ['Pramax Ducetti', 'PRX', 'ducetti', '#5a2a8a', '#d0021b', 76],
  ['Volt Cola Hondra LCX', 'LCX', 'hondra', '#ffd400', '#e8501e', 68],
  ['VR47 Yamawa Academy', 'VR4', 'yamawa', '#c8f000', '#1a49c4', 72],
  ['Tech-9 KTX', 'TK9', 'ktx', '#f07000', '#12294a', 70],
  ['Fiero Apriya RNF', 'FIE', 'apriya', '#20a080', '#111111', 62],
];

// GP star riders: [name, nat, number, pace] — the "Mark Marquess" grid.
export const GP_STARS: [string, string, number, number][] = [
  ['Mark Marquess', 'ES', 94, 96],
  ['Peko Bagnara', 'IT', 64, 95],
  ['Fabien Quatorro', 'FR', 21, 93],
  ['Jorje Martino', 'ES', 90, 94],
  ['Paulo Acousta', 'ES', 38, 92],
  ['Enea Bastiano', 'IT', 24, 90],
  ['Brett Bandiera', 'AU', 34, 88],
  ['Marco Bezzardi', 'IT', 73, 89],
  ['Alesso Marquess', 'ES', 74, 87],
  ['Jack Milligan', 'AU', 44, 86],
  ['Mika Vinalez', 'ES', 13, 88],
  ['Fabio DiGiorno', 'IT', 49, 87],
];

// ---------------------------------------------------- SBK factory identity
export const SBK_TEAMS: [string, string, string, string, string, number][] = [
  ['Kawazuki Racing WSB', 'KAW', 'kawazuki', '#3fae2a', '#111111', 92],
  ['Ducetti Aruba SBK', 'DUC', 'ducetti', '#d0021b', '#00a0c0', 93],
  ['Pata Yamawa SBK', 'YAM', 'yamawa', '#1a49c4', '#e8e8e8', 86],
  ['BVM Motorrad WorldSBK', 'BVM', 'bvm', '#2f9de0', '#ffffff', 82],
  ['Hondra HRT Superbike', 'HON', 'hondra', '#e8501e', '#111111', 80],
  ['Triumf Street Kings', 'TRI', 'triumf', '#0e2a3a', '#c0c0c0', 72],
  ['GoldWing Ducetti Indy', 'GWD', 'ducetti', '#d4af37', '#d0021b', 70],
  ['Petronix Suzaka SBK', 'PET', 'suzaka', '#00b3ad', '#2a6bd4', 68],
  ['Oakly Apriya Superbike', 'OAK', 'apriya', '#3a3a3a', '#cc1f2f', 66],
  ['Stellar Husk Factory', 'STL', 'stellar', '#e8e8e8', '#2a2a2a', 64],
];

export const SBK_STARS: [string, string, number, number][] = [
  ['Toprek Razgatello', 'UK', 54, 96],
  ['Johnathan Ray', 'UK', 65, 94],
  ['Alvero Bautesta', 'ES', 19, 93],
  ['Andy Locatello', 'IT', 55, 89],
  ['Danny Petrucco', 'IT', 9, 87],
  ['Remy Gardiner', 'AU', 87, 86],
  ['Dominic Aegerhart', 'DE', 77, 85],
  ['Axel Bassano', 'IT', 47, 86],
  ['Scott Redfield', 'UK', 45, 84],
  ['Garrett Gerlman', 'US', 31, 83],
];

// ------------------------------------------------------------- road tracks
// [id, name, location, lengthKm, baseLapSec, weatherBias]
export const GP_TRACKS: [string, string, string, number, number, number][] = [
  ['losail', 'Lusale International', 'Qatar', 5.4, 103, 0.02],
  ['portimao', 'Portimayo Rollercoaster', 'Portugal', 4.6, 99, 0.15],
  ['austin', 'Circuit of the Americans', 'Texas, USA', 5.5, 122, 0.18],
  ['jerez', 'Jerezz Circuit', 'Spain', 4.4, 96, 0.10],
  ['lemans', 'Le Mons Bugatti', 'France', 4.2, 91, 0.30],
  ['mugella', 'Mugella', 'Italy', 5.2, 105, 0.12],
  ['catalunya', 'Catalonya', 'Spain', 4.7, 99, 0.08],
  ['sachsen', 'Saxonring', 'Germany', 3.7, 80, 0.25],
  ['assend', 'Assend TT Circuit', 'Netherlands', 4.5, 93, 0.28],
  ['silverstone', 'Silverstane', 'Great Britain', 5.9, 118, 0.35],
  ['redbullring', 'Red Balls Ring', 'Austria', 4.3, 83, 0.20],
  ['aragon', 'Motorland Aragone', 'Spain', 5.1, 107, 0.06],
  ['misano', 'Misano Marco Riviera', 'Italy', 4.2, 92, 0.14],
  ['motegi', 'Motegia Twin Ring', 'Japan', 4.8, 104, 0.22],
  ['phillip', 'Philips Island', 'Australia', 4.4, 88, 0.30],
  ['sepang', 'Sepanga International', 'Malaysia', 5.5, 118, 0.40],
  ['valencia', 'Valentia Ricardo Toro', 'Spain', 4.0, 90, 0.12],
  ['mandalika', 'Mandalaika Street', 'Indonesia', 4.3, 102, 0.35],
];

export const SBK_TRACKS: [string, string, string, number, number, number][] = [
  ['phillip_sbk', 'Philips Island', 'Australia', 4.4, 90, 0.30],
  ['catalunya_sbk', 'Catalonya', 'Spain', 4.7, 101, 0.08],
  ['assend_sbk', 'Assend TT Circuit', 'Netherlands', 4.5, 95, 0.28],
  ['misano_sbk', 'Misano Marco Riviera', 'Italy', 4.2, 94, 0.14],
  ['donington', 'Donningtown Park', 'Great Britain', 4.0, 87, 0.33],
  ['imola', 'Imolla Enzo e Dino', 'Italy', 4.9, 106, 0.15],
  ['mostcz', 'Mosst Autodrom', 'Czechia', 4.2, 95, 0.22],
  ['magnycours', 'Magny-Course', 'France', 4.4, 96, 0.28],
  ['aragon_sbk', 'Motorland Aragone', 'Spain', 5.1, 109, 0.06],
  ['portimao_sbk', 'Portimayo Rollercoaster', 'Portugal', 4.6, 101, 0.15],
  ['jerez_sbk', 'Jerezz Circuit', 'Spain', 4.4, 98, 0.10],
  ['sanjuan', 'San Juan Villicum', 'Argentina', 4.3, 98, 0.10],
];

// ------------------------------------------------------------ NAMC venues
// Fictionalized venue names (keep layouts/locations, tweak names for safety).
// Stadium rounds 1-12, outdoor 13-24 per rulebook 10.3.
export const NAMC_STADIUMS: [string, string, string][] = [
  ['snapdragon', 'Snapback Stadium', 'San Diego, CA'],
  ['statefarm', 'State Ranch Stadium', 'Phoenix, AZ'],
  ['unm', 'Duke City Stadium', 'Albuquerque, NM'],
  ['okc', 'Sooner Memorial Stadium', 'Oklahoma City, OK'],
  ['att', 'Lone Star Dome', 'Dallas, TX'],
  ['mercedes', 'Peachtree Dome', 'Atlanta, GA'],
  ['nissan', 'Music City Stadium', 'Nashville, TN'],
  ['lucas', 'Crossroads Dome', 'Indianapolis, IN'],
  ['arrowhead', 'Warpath Stadium', 'Kansas City, MO'],
  ['milehigh', 'Mile High Field', 'Denver, CO'],
  ['riceeccles', 'Wasatch Stadium', 'Salt Lake City, UT'],
  ['mcmahon', 'Stampede Stadium', 'Calgary, Canada'],
];

export const NAMC_OUTDOORS: [string, string, string][] = [
  ['pala1', 'Pala Creek MX', 'Pala, CA'],
  ['pala2', 'Coyote Raceway at Pala', 'Pala, CA'],
  ['fernley', 'Fernlee Raceway', 'Fernley, NV'],
  ['boise', 'Owyhee Moto Club', 'Boise, ID'],
  ['thunder', 'Thunder Valley MX', 'Lakewood, CO'],
  ['redbud', 'RedBerry MX', 'Buchanan, MI'],
  ['millville', 'Spring Brook MX Park', 'Millville, MN'],
  ['highpoint', 'High Summit Raceway', 'Mt. Morris, PA'],
  ['nanaimo', 'Wastelands MX Park', 'Nanaimo, BC, Canada'],
  ['anchorage', 'Kincaid Race Park', 'Anchorage, AK'],
  ['hawaii', 'Big Island MX', 'Big Island, HI'],
  ['glenhelen', 'Glen Haven Raceway', 'San Bernardino, CA'],
];
