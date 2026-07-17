// Inter-League News Engine: Generate dramatic stories from across all three disciplines
// Ryan from Throttlesauce delivers weekly briefings based on actual game events

import type { Universe, NewsEvent, NewsEventType, Rider, Team, DisciplineId } from '../data/types';
import type { RNG } from '../util/rng';
import { pick } from '../util/rng';

let newsSeq = 0;

interface NewsContext {
  u: Universe;
  rng: RNG;
  round: number;
  discipline: DisciplineId;  // which league's news is being generated
}

/**
 * Detect notable events that occurred in the last round and generate news.
 * Called after round settlement; scans for wins, injuries, transfers, drama.
 */
export function generateNewsForRound(
  u: Universe,
  rng: RNG,
  round: number,
  discipline: DisciplineId,
): NewsEvent[] {
  const news: NewsEvent[] = [];
  const ctx: NewsContext = { u, rng, round, discipline };

  // Occasionally a signing/transfer happens (3 in 20 chance per round)
  if (rng() < 0.15) {
    const sig = generateSigningNews(ctx);
    if (sig) news.push(sig);
  }

  // Injury drama (2 in 20)
  if (rng() < 0.10) {
    const inj = generateInjuryNews(ctx);
    if (inj) news.push(inj);
  }

  // Breakout performance (3 in 20)
  if (rng() < 0.15) {
    const brk = generateBreakoutNews(ctx);
    if (brk) news.push(brk);
  }

  // Rivalry building (2 in 20)
  if (rng() < 0.10) {
    const riv = generateRivalryNews(ctx);
    if (riv) news.push(riv);
  }

  // Championship drama (2 in 20)
  if (rng() < 0.10) {
    const champ = generateChampionshipDrama(ctx);
    if (champ) news.push(champ);
  }

  // Team conflict or coaching news (occasional)
  if (rng() < 0.05) {
    const conflict = generateTeamConflictNews(ctx);
    if (conflict) news.push(conflict);
  }

  return news;
}

// ============================================================================
// NEWS GENERATORS
// ============================================================================

function generateSigningNews(ctx: NewsContext): NewsEvent | null {
  const { u, rng, round, discipline } = ctx;

  // Pick a random team and rider from another discipline
  const otherDiscipline = pickOtherDiscipline(rng, discipline);
  const otherTeams = Object.values(u.teams).filter(t => t.discipline === otherDiscipline);
  const otherRiders = Object.values(u.riders).filter(
    r => r.championship === (otherDiscipline === 'namc' ? 'fourStroke' : 'road') && !r.teamId,
  );

  if (otherTeams.length === 0 || otherRiders.length === 0) return null;

  const team = pick(rng, otherTeams);
  const rider = pick(rng, otherRiders);

  const headline = `${rider.name} Signs Multi-Year Deal with ${team.name}`;
  const body = ryanCommentary.signing({
    riderName: rider.name,
    teamName: team.name,
    discipline: otherDiscipline,
    riderNationality: rider.nationality,
  });

  return {
    id: `news${newsSeq++}`,
    round,
    timestamp: round,
    type: 'signing',
    discipline: otherDiscipline,
    subjectRiderId: rider.id,
    subjectTeamId: team.id,
    headline,
    body,
    impact: {
      playerTeamSentiment: rng() < 0.5 ? 0 : 2, // neutral or slightly positive
    },
  };
}

function generateInjuryNews(ctx: NewsContext): NewsEvent | null {
  const { u, rng, round, discipline } = ctx;

  const otherDiscipline = pickOtherDiscipline(rng, discipline);
  const riders = Object.values(u.riders).filter(
    r => r.championship === (otherDiscipline === 'namc' ? 'fourStroke' : 'road') &&
         r.classId &&
         !r.bench &&
         r.overall >= 65,
  );

  if (riders.length === 0) return null;

  const rider = pick(rng, riders);
  const weeks = Math.floor(rng() * 4) + 2; // 2-6 rounds out

  const headline = `${rider.name} Out With Injury — ${weeks}-Round Recovery Expected`;
  const body = ryanCommentary.injury({
    riderName: rider.name,
    weeks,
    teamName: u.teams[rider.teamId || '']?.name || 'Unknown',
  });

  return {
    id: `news${newsSeq++}`,
    round,
    timestamp: round,
    type: 'injury',
    discipline: otherDiscipline,
    subjectRiderId: rider.id,
    subjectTeamId: rider.teamId || undefined,
    headline,
    body,
    impact: {
      playerTeamSentiment: -3,
    },
  };
}

function generateBreakoutNews(ctx: NewsContext): NewsEvent | null {
  const { u, rng, round, discipline } = ctx;

  const otherDiscipline = pickOtherDiscipline(rng, discipline);
  const riders = Object.values(u.riders).filter(
    r => r.championship === (otherDiscipline === 'namc' ? 'fourStroke' : 'road') &&
         r.classId &&
         r.overall >= 50 &&
         r.overall <= 70 &&
         r.careerWins <= 2,
  );

  if (riders.length === 0) return null;

  const rider = pick(rng, riders);
  const teamName = u.teams[rider.teamId || '']?.name || 'Independent';

  const headline = `Dark Horse Alert: ${rider.name} Emerges as Championship Threat`;
  const body = ryanCommentary.breakout({
    riderName: rider.name,
    teamName,
    age: rider.age,
    discipline: otherDiscipline,
  });

  return {
    id: `news${newsSeq++}`,
    round,
    timestamp: round,
    type: 'breakout',
    discipline: otherDiscipline,
    subjectRiderId: rider.id,
    headline,
    body,
    impact: {
      playerTeamSentiment: 3,
    },
  };
}

function generateRivalryNews(ctx: NewsContext): NewsEvent | null {
  const { u, rng, round, discipline } = ctx;

  const otherDiscipline = pickOtherDiscipline(rng, discipline);
  const riders = Object.values(u.riders).filter(
    r => r.championship === (otherDiscipline === 'namc' ? 'fourStroke' : 'road') &&
         r.classId &&
         r.overall >= 65,
  );

  if (riders.length < 2) return null;

  const rider1 = pick(rng, riders);
  const rider2 = pick(rng, riders);
  if (rider1.id === rider2.id) return null;

  const headline = `Tension Boils Over: ${rider1.name} vs. ${rider2.name} Feud Intensifies`;
  const body = ryanCommentary.rivalry({
    rider1Name: rider1.name,
    rider2Name: rider2.name,
    discipline: otherDiscipline,
  });

  return {
    id: `news${newsSeq++}`,
    round,
    timestamp: round,
    type: 'rivalry',
    discipline: otherDiscipline,
    subjectRiderId: rider1.id,
    secondaryRiderId: rider2.id,
    headline,
    body,
    impact: {
      playerTeamSentiment: 2,
    },
  };
}

function generateChampionshipDrama(ctx: NewsContext): NewsEvent | null {
  const { u, rng, round, discipline } = ctx;

  const otherDiscipline = pickOtherDiscipline(rng, discipline);
  const riders = Object.values(u.riders).filter(
    r => r.championship === (otherDiscipline === 'namc' ? 'fourStroke' : 'road') &&
         r.classId &&
         r.overall >= 70,
  );

  if (riders.length < 2) return null;

  const leader = pick(rng, riders);
  const challenger = pick(rng, riders);
  if (leader.id === challenger.id) return null;

  const headline = `Championship Thriller: ${leader.name} vs. ${challenger.name} Down to Wire`;
  const body = ryanCommentary.championship({
    leader: leader.name,
    challenger: challenger.name,
    discipline: otherDiscipline,
  });

  return {
    id: `news${newsSeq++}`,
    round,
    timestamp: round,
    type: 'championship-drama',
    discipline: otherDiscipline,
    subjectRiderId: leader.id,
    secondaryRiderId: challenger.id,
    headline,
    body,
    impact: {
      playerTeamSentiment: 5,
    },
  };
}

function generateTeamConflictNews(ctx: NewsContext): NewsEvent | null {
  const { u, rng, round, discipline } = ctx;

  const otherDiscipline = pickOtherDiscipline(rng, discipline);
  const teams = Object.values(u.teams).filter(t => t.discipline === otherDiscipline);

  if (teams.length === 0) return null;

  const team = pick(rng, teams);
  const hasCoachingChange = rng() < 0.5;

  const headline = hasCoachingChange
    ? `${team.name} Parts Ways with Crew Chief — Searching for Fresh Direction`
    : `Internal Turmoil at ${team.name}: Sources Report Friction Between Lead Riders`;

  const body = hasCoachingChange
    ? ryanCommentary.coaching({ teamName: team.name })
    : ryanCommentary.teamConflict({ teamName: team.name });

  return {
    id: `news${newsSeq++}`,
    round,
    timestamp: round,
    type: hasCoachingChange ? 'coaching-change' : 'team-conflict',
    discipline: otherDiscipline,
    subjectTeamId: team.id,
    headline,
    body,
    impact: {
      playerTeamSentiment: -2,
    },
  };
}

// ============================================================================
// RYAN'S COMMENTARY TEMPLATES
// ============================================================================

const ryanCommentary = {
  signing: (opts: { riderName: string; teamName: string; discipline: DisciplineId; riderNationality: string }) => {
    const templates = [
      `Big move in ${opts.discipline.toUpperCase()}! ${opts.riderName} from ${opts.riderNationality} just inked a multi-year deal with ${opts.teamName}. This is the signing people have been waiting for — expect him to challenge for the title immediately.`,

      `Breaking: ${opts.riderName} is a ${opts.teamName} rider. The ${opts.discipline.toUpperCase()} paddock knew it was coming, but now it's official. ${opts.teamName} just upgraded their roster big-time.`,

      `${opts.riderName} to ${opts.teamName} — done. The rumors were real. ${opts.riderName} signed on the dotted line, and he's bringing championship aspirations with him. ${opts.teamName} is serious about winning now.`,
    ];
    return pick(() => Math.random(), templates);
  },

  injury: (opts: { riderName: string; weeks: number; teamName: string }) => {
    const templates = [
      `Tough news from ${opts.teamName}: ${opts.riderName} is out with injury. Doctors are saying ${opts.weeks}-round recovery timeline. That's a huge blow to their championship hopes.`,

      `${opts.riderName} down and out. We're looking at roughly ${opts.weeks} rounds of sideline time while he recovers. ${opts.teamName} will need to shuffle their lineup and find a temporary replacement.`,

      `Injury report: ${opts.riderName} is sidelined for ${opts.weeks} rounds. You hate to see it for a top rider. The medical team is being cautious, which is the right call.`,
    ];
    return pick(() => Math.random(), templates);
  },

  breakout: (opts: { riderName: string; teamName: string; age: number; discipline: DisciplineId }) => {
    const templates = [
      `${opts.riderName} is making waves in ${opts.discipline.toUpperCase()}. The ${opts.age}-year-old from ${opts.teamName} is outpacing expectations and putting the grid on notice. We could be watching a future champion emerge.`,

      `Dark horse alert: ${opts.riderName} has quietly become one of the fastest riders in ${opts.discipline.toUpperCase()}. Racing for ${opts.teamName}, he's been converting practice pace into race wins. The established names better watch out.`,

      `Don't sleep on ${opts.riderName}. The ${opts.teamName} rider is having a breakthrough season in ${opts.discipline.toUpperCase()}, and frankly, nobody saw it coming. He's got the pace of a champion.`,
    ];
    return pick(() => Math.random(), templates);
  },

  rivalry: (opts: { rider1Name: string; rider2Name: string; discipline: DisciplineId }) => {
    const templates = [
      `The ${opts.discipline.toUpperCase()} rivalry between ${opts.rider1Name} and ${opts.rider2Name} just got spicy. On-track contact, heated radio messages — these two are not holding back anymore.`,

      `${opts.rider1Name} and ${opts.rider2Name} — this feud is real. We've seen multiple incidents now, and you get the sense that respect on the track is gone. Buckle up; it's going to get more intense from here.`,

      `Heat in the ${opts.discipline.toUpperCase()} paddock: ${opts.rider1Name} and ${opts.rider2Name} are going at it. Team bosses are probably hoping they can channel that fire into championship points instead of mutual destruction.`,
    ];
    return pick(() => Math.random(), templates);
  },

  championship: (opts: { leader: string; challenger: string; discipline: DisciplineId }) => {
    const templates = [
      `The ${opts.discipline.toUpperCase()} championship is wide open. ${opts.leader} leads the standings, but ${opts.challenger} is right there and closing fast. This is the kind of thriller fans dream about.`,

      `Championship thriller brewing in ${opts.discipline.toUpperCase()}! ${opts.leader} is in the lead, but ${opts.challenger} is hunting. Both riders are hitting peak form, and we're headed for a climactic final stretch.`,

      `Hold on to your seats: the ${opts.discipline.toUpperCase()} title fight between ${opts.leader} and ${opts.challenger} is going down to the wire. These two are pushing each other to the limit.`,
    ];
    return pick(() => Math.random(), templates);
  },

  teamConflict: (opts: { teamName: string }) => {
    const templates = [
      `Internal drama at ${opts.teamName}. Sources say the two lead riders aren't exactly best friends right now. Team management is working to smooth things over, but tension is definitely in the air.`,

      `All's not well at ${opts.teamName}. There's friction between the riders, and it's starting to show on track. Team leadership needs to address this before it derails their season.`,

      `${opts.teamName} has some relationship issues to work through. The riders aren't clicking, and the vibe in the garage is noticeably tense. This could be a distraction they can't afford.`,
    ];
    return pick(() => Math.random(), templates);
  },

  coaching: (opts: { teamName: string }) => {
    const templates = [
      `${opts.teamName} is making a change behind the scenes. Their crew chief is out, and they're searching for a fresh voice to lead the technical program. New era incoming.`,

      `Leadership shuffle at ${opts.teamName}. The crew chief is moving on, and the team is looking for their next top technical mind. This could be the reset they needed.`,

      `${opts.teamName} is turning the page. New crew chief means new strategies, new direction. The riders will be adapting to a fresh approach for the rest of the season.`,
    ];
    return pick(() => Math.random(), templates);
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function pickOtherDiscipline(rng: RNG, currentDiscipline: DisciplineId): DisciplineId {
  const options = (['namc', 'gp', 'sbk'] as DisciplineId[]).filter(d => d !== currentDiscipline);
  return pick(rng, options);
}
