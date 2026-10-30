import type { Entry } from "../db/journal.js";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const round = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const withTag = (tags: string[]) => (e: Entry) => e.tags.some((t) => tags.includes(t));
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
const daysBetween = (a: string, b: string) =>
  (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000;

export type Effect = "lifts" | "drags" | "neutral";

export interface Factor {
  id: string;
  label: string;
  description: string;
  withCount: number;
  withAvg: number;
  withoutAvg: number;
  delta: number;
  effect: Effect;
}

export interface Note {
  title: string;
  evidence: string;
}

export interface Suggestion {
  id: string;
  title: string;
  why: string;
  actions: string[];
  impact: number;
}

export interface Insights {
  summary: {
    count: number;
    from: string | null;
    to: string | null;
    avgMood: number;
    avgSleep: number;
    avgEnergy: number;
    best: Entry | null;
    worst: Entry | null;
  };
  trend: { date: string; mood: number; energy: number; sleepHours: number; tags: string[] }[];
  factors: Factor[];
  weekdays: { day: string; avgMood: number; count: number }[];
  topTags: { tag: string; count: number; avgMood: number }[];
  persona: {
    title: string;
    summary: string;
    strengths: Note[];
    challenges: Note[];
  };
  suggestions: Suggestion[];
  drains: TagImpact[];
  boosts: TagImpact[];
  swaps: Swap[];
  caution: string | null;
}

/** How mood differs on days with a given tag vs without it. */
export interface TagImpact {
  tag: string;
  count: number;
  withAvg: number;
  withoutAvg: number;
  delta: number;
}

export interface Swap {
  drain: TagImpact;
  instead: TagImpact[];
}

// Healthier alternatives to reach for in place of each draining activity.
const SWAP_OPTIONS: Record<string, string[]> = {
  phone: ["walk", "friends", "exercise", "family"],
  procrastination: ["planning", "productivity", "walk"],
  tired: ["walk", "exercise", "planning"],
  rejection: ["friends", "family", "walk"],
  comparison: ["friends", "family", "nature"],
  anxiety: ["planning", "walk", "friends"],
  overcommit: ["planning", "productivity"],
  "skipped-meal": ["cooking"],
  deadline: ["planning", "productivity"],
  caffeine: ["walk", "exercise"],
  "job-search": ["friends", "exercise", "walk"],
};

export function computeTagImpacts(entries: Entry[]): TagImpact[] {
  const tags = new Set(entries.flatMap((e) => e.tags));
  return [...tags].flatMap((tag) => {
    const yes = entries.filter((e) => e.tags.includes(tag));
    const no = entries.filter((e) => !e.tags.includes(tag));
    if (yes.length < 2 || no.length < 2) return [];
    const withAvg = avg(yes.map((e) => e.mood));
    const withoutAvg = avg(no.map((e) => e.mood));
    return [{ tag, count: yes.length, withAvg: round(withAvg), withoutAvg: round(withoutAvg), delta: round(withAvg - withoutAvg) }];
  });
}

export const FACTORS: { id: string; label: string; description: string; test: (e: Entry) => boolean }[] = [
  { id: "sleep", label: "7+ hours of sleep", description: "Days after a full night's sleep", test: (e) => e.sleepHours >= 7 },
  { id: "movement", label: "Exercise or movement", description: "Days with the gym, a walk or a hike", test: withTag(["exercise", "walk", "nature", "hike", "sport", "yoga"]) },
  { id: "social", label: "Time with people", description: "Days you connected with friends or family", test: withTag(["friends", "family"]) },
  { id: "phone", label: "Heavy phone use", description: "Days with long scrolling sessions", test: withTag(["phone", "doomscroll", "social-media"]) },
  { id: "job-search", label: "Job search", description: "Days spent on applications, interviews or rejections", test: withTag(["job-search", "rejection", "interview"]) },
  { id: "focus", label: "Focused work", description: "Days with planning, deep work or flow", test: withTag(["productivity", "flow", "planning", "deep-work"]) },
];

export function computeFactors(entries: Entry[]): Factor[] {
  return FACTORS.flatMap(({ test, ...f }) => {
    const yes = entries.filter(test);
    const no = entries.filter((e) => !test(e));
    if (!yes.length || !no.length) return [];
    const withAvg = avg(yes.map((e) => e.mood));
    const withoutAvg = avg(no.map((e) => e.mood));
    const delta = withAvg - withoutAvg;
    const effect: Effect = delta >= 0.75 ? "lifts" : delta <= -0.75 ? "drags" : "neutral";
    return [{ ...f, withCount: yes.length, withAvg: round(withAvg), withoutAvg: round(withoutAvg), delta: round(delta), effect }];
  });
}

const countTagged = (entries: Entry[], tags: string[]) => entries.filter(withTag(tags)).length;

function computePersona(entries: Entry[], factors: Factor[], avgMood: number, avgSleep: number) {
  const ambition = countTagged(entries, ["job-search", "hackathon", "productivity", "deadline", "flow", "work"]);
  const social = countTagged(entries, ["friends", "family"]);
  const avoidance = entries.filter(withTag(["procrastination", "phone", "doomscroll"]));
  const overcommit = entries.filter(withTag(["boundaries", "overcommit"]));
  const anxious = entries.filter(withTag(["anxiety", "comparison", "rejection"]));
  const skippedBasics = entries.filter(
    (e) => e.tags.includes("skipped-meal") || /skipped (lunch|dinner|breakfast|the gym)|forgot to eat/i.test(e.entry),
  );
  const shortNights = entries.filter((e) => e.sleepHours < 6);

  const drive = ambition >= 3 ? "Driven Achiever" : social >= 3 ? "Warm Connector" : "Thoughtful Explorer";
  const state = avgSleep < 7 ? "Running on Low Reserves" : avgMood >= 7 ? "In a Good Rhythm" : "Finding Balance";
  const lifts = factors.filter((f) => f.effect === "lifts").map((f) => f.label.toLowerCase());

  const summary =
    `Over ${entries.length} entries your mood averaged ${round(avgMood)}/10 on ${round(avgSleep)}h of sleep. ` +
    (ambition >= 3 ? "You're ambitious and push hard on your goals. " : "") +
    (lifts.length ? `You're at your best with ${lifts.join(", ")}. ` : "") +
    (avoidance.length || shortNights.length
      ? "Under pressure, your rest and routines are the first things to give."
      : "Your routines are holding up well.");

  const strengths: Note[] = [];
  const recoveries: number[] = [];
  entries.forEach((e, i) => {
    const next = entries[i + 1];
    if (e.mood <= 4 && next && daysBetween(e.date, next.date) === 1) recoveries.push(next.mood - e.mood);
  });
  if (recoveries.length && avg(recoveries) > 0) {
    strengths.push({ title: "You bounce back", evidence: `After a low day, your mood rose by ${round(avg(recoveries))} points the next day on average.` });
  }
  const focus = factors.find((f) => f.id === "focus");
  if (focus && focus.effect === "lifts") {
    strengths.push({ title: "Strong focus", evidence: `Days with deep work or flow averaged ${focus.withAvg}/10, among your best.` });
  }
  const social_ = factors.find((f) => f.id === "social");
  if (social_ && social_.withAvg >= 6) {
    strengths.push({ title: "People recharge you", evidence: `Days with friends or family averaged ${social_.withAvg}/10.` });
  }
  if (entries.length >= 2) {
    const span = daysBetween(entries[0].date, entries.at(-1)!.date) + 1;
    strengths.push({ title: "Self-aware", evidence: `You journaled ${entries.length} of ${span} days and often name your own patterns.` });
  }

  const challenges: Note[] = [];
  if (avgSleep < 7) {
    challenges.push({ title: "Not enough sleep", evidence: `You average ${round(avgSleep)}h a night, with ${shortNights.length} nights under 6h.` });
  }
  if (avoidance.length) {
    challenges.push({ title: "Avoidance when stressed", evidence: `${avoidance.length} days of procrastination or heavy scrolling, averaging ${round(avg(avoidance.map((e) => e.mood)))}/10.` });
  }
  if (anxious.length) {
    challenges.push({ title: "Anxiety and comparison", evidence: `${anxious.length} entries mention anxiety, rejection or comparing yourself to others.` });
  }
  if (overcommit.length) {
    challenges.push({ title: "Hard to say no", evidence: `${overcommit.length} day(s) where others' requests took over your own priorities.` });
  }
  if (skippedBasics.length) {
    challenges.push({ title: "Skipping the basics", evidence: `${skippedBasics.length} days where meals or exercise got skipped.` });
  }

  return {
    persona: { title: `The ${drive} ${state}`, summary, strengths, challenges },
    signals: { overcommit: overcommit.length, skippedBasics: skippedBasics.length },
  };
}

function computeSuggestions(
  factors: Factor[],
  avgSleep: number,
  weakDay: { day: string; avgMood: number } | null,
  avgMood: number,
  signals: { overcommit: number; skippedBasics: number },
  tagImpacts: TagImpact[],
): Suggestion[] {
  const f = (id: string) => factors.find((x) => x.id === id);
  const out: Suggestion[] = [];

  const sleep = f("sleep");
  if ((sleep && sleep.effect === "lifts") || avgSleep < 7) {
    out.push({
      id: "sleep",
      title: "Protect your sleep",
      why: sleep
        ? `Mood averaged ${sleep.withAvg} after 7h+ of sleep vs ${sleep.withoutAvg} on shorter nights.`
        : `You average only ${round(avgSleep)}h of sleep.`,
      actions: [
        "Charge your phone outside the bedroom and use a cheap alarm clock.",
        "Pick a screens-off time (e.g. 11:30pm) and keep it on weeknights.",
        "On deadline nights, stop at midnight and finish in the morning.",
      ],
      impact: sleep?.delta ?? 0,
    });
  }

  const phone = f("phone");
  if (phone && phone.effect === "drags") {
    out.push({
      id: "phone",
      title: "Start work before your phone",
      why: `Heavy phone days averaged ${phone.withAvg} vs ${phone.withoutAvg} otherwise.`,
      actions: [
        "Do one hour of focused work before opening any social app.",
        "Set app limits for the apps you scroll the most.",
        "Mute feeds that make you compare yourself to others.",
      ],
      impact: Math.abs(phone.delta),
    });
  }

  const movement = f("movement");
  if (movement && movement.effect === "lifts") {
    out.push({
      id: "movement",
      title: "Move at least 3 times a week",
      why: `Days with exercise or walks averaged ${movement.withAvg} vs ${movement.withoutAvg} without.`,
      actions: ["Schedule workouts like classes.", "Walks count: a 30-minute walk is enough.", "Plan one outdoor activity each weekend."],
      impact: movement.delta,
    });
  }

  const social = f("social");
  if (social && social.effect === "lifts") {
    out.push({
      id: "social",
      title: "Make time for people on purpose",
      why: `Days with friends or family averaged ${social.withAvg} vs ${social.withoutAvg}.`,
      actions: ["Put one call home and one friend meetup in your calendar each week.", "After a setback, talk to someone within 24 hours."],
      impact: social.delta,
    });
  }

  const job = f("job-search");
  if (job && job.effect === "drags") {
    out.push({
      id: "job-search",
      title: "Change how you handle job-search stress",
      why: `Job-search days averaged ${job.withAvg} vs ${job.withoutAvg}.`,
      actions: [
        "Track what you control: applications sent and mock interviews done, not offers.",
        "Use LinkedIn for applying and messaging, not for scrolling the feed.",
        "Celebrate effort days, not just outcomes.",
      ],
      impact: Math.abs(job.delta),
    });
  }

  const focus = f("focus");
  if (focus && focus.effect === "lifts") {
    out.push({
      id: "focus",
      title: "Plan your week and protect deep work",
      why: `Days with planning or deep work averaged ${focus.withAvg} vs ${focus.withoutAvg}.`,
      actions: ["Block 1–2 hours of deep work each morning.", "Write tomorrow's top 3 tasks before bed."],
      impact: focus.delta,
    });
  }

  if (weakDay) {
    out.push({
      id: "weekday",
      title: `Plan ahead for ${weakDay.day}s`,
      why: `${weakDay.day} is your lowest day, averaging ${weakDay.avgMood} vs ${round(avgMood)} overall.`,
      actions: [`Spend 20 minutes planning on the evening before ${weakDay.day}.`, `Schedule something you enjoy on ${weakDay.day}s.`],
      impact: avgMood - weakDay.avgMood,
    });
  }

  const overcommit = tagImpacts.find((t) => t.tag === "overcommit");
  if (signals.overcommit && overcommit && overcommit.delta < 0) {
    out.push({
      id: "boundaries",
      title: "Pause before saying yes",
      why: `Overcommitted days averaged ${overcommit.withAvg} vs ${overcommit.withoutAvg} otherwise.`,
      actions: ['Use "Let me check and get back to you" and wait an hour.', "Block your own work time first, then help in what's left."],
      impact: -overcommit.delta,
    });
  }

  const skipped = tagImpacts.find((t) => t.tag === "skipped-meal");
  if (signals.skippedBasics && skipped && skipped.delta < 0) {
    out.push({
      id: "basics",
      title: "Don't skip meals",
      why: `Days you skipped a meal averaged ${skipped.withAvg} vs ${skipped.withoutAvg} otherwise.`,
      actions: ["Meal-prep on weekends.", "Set a meal reminder on busy or deep-focus days."],
      impact: -skipped.delta,
    });
  }

  return out
    .filter((s) => s.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .map((s) => ({ ...s, impact: round(s.impact) }));
}

export function computeInsights(entries: Entry[]): Insights {
  const moods = entries.map((e) => e.mood);
  const avgMood = avg(moods);
  const avgSleep = avg(entries.map((e) => e.sleepHours));

  const factors = computeFactors(entries);

  const weekdays = WEEKDAYS.map((day, i) => {
    const days = entries.filter((e) => weekday(e.date) === i);
    return { day, avgMood: round(avg(days.map((e) => e.mood))), count: days.length };
  }).filter((d) => d.count);
  const weakDay =
    weekdays.filter((d) => d.count >= 2 && d.avgMood <= avgMood - 0.5).sort((a, b) => a.avgMood - b.avgMood)[0] ?? null;

  const tagCounts = new Map<string, number[]>();
  entries.forEach((e) => e.tags.forEach((t) => tagCounts.set(t, [...(tagCounts.get(t) ?? []), e.mood])));
  const topTags = [...tagCounts]
    .map(([tag, m]) => ({ tag, count: m.length, avgMood: round(avg(m)) }))
    .sort((a, b) => b.count - a.count || b.avgMood - a.avgMood)
    .slice(0, 12);

  const { persona, signals } = computePersona(entries, factors, avgMood, avgSleep);

  const tagImpacts = computeTagImpacts(entries);
  // Never present a known-unhealthy habit as a boost or a healthy one as a drain, even if
  // they happen to co-occur with good or bad days.
  const unhealthy = new Set([...Object.keys(SWAP_OPTIONS), "overcommit", "skipped-meal"]);
  const healthy = new Set(Object.values(SWAP_OPTIONS).flat());
  const drains = tagImpacts.filter((t) => t.delta <= -0.5 && !healthy.has(t.tag)).sort((a, b) => a.delta - b.delta);
  const boosts = tagImpacts.filter((t) => t.delta >= 0.5 && !unhealthy.has(t.tag)).sort((a, b) => b.delta - a.delta);
  const swaps = drains.flatMap((drain) => {
    const options = SWAP_OPTIONS[drain.tag] ?? [];
    const instead = boosts.filter((b) => options.includes(b.tag)).slice(0, 2);
    return instead.length ? [{ drain, instead }] : [];
  });

  const lastThree = entries.slice(-3);
  const caution =
    (lastThree.length === 3 && lastThree.every((e) => e.mood <= 4)) || (entries.length >= 7 && avgMood < 4.5)
      ? "Your mood has been low for a while. Consider talking to a friend, a counselor or your campus wellness center."
      : null;

  return {
    summary: {
      count: entries.length,
      from: entries[0]?.date ?? null,
      to: entries.at(-1)?.date ?? null,
      avgMood: round(avgMood),
      avgSleep: round(avgSleep),
      avgEnergy: round(avg(entries.map((e) => e.energy))),
      best: entries.length ? entries.reduce((a, b) => (b.mood > a.mood ? b : a)) : null,
      worst: entries.length ? entries.reduce((a, b) => (b.mood < a.mood ? b : a)) : null,
    },
    trend: entries.map(({ date, mood, energy, sleepHours, tags }) => ({ date, mood, energy, sleepHours, tags })),
    factors,
    weekdays,
    topTags,
    persona,
    suggestions: computeSuggestions(factors, avgSleep, weakDay, avgMood, signals, tagImpacts),
    drains,
    boosts,
    swaps,
    caution,
  };
}
