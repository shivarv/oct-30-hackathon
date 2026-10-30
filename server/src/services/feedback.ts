import type { Entry } from "../db/journal.js";
import { computeFactors, FACTORS } from "./insights.js";

export interface FeedbackItem {
  factorId: string;
  title: string;
  detail: string;
  boost: number;
}

export interface Feedback {
  date: string;
  mood: number;
  headline: string;
  wentWell: FeedbackItem[];
  tryInstead: FeedbackItem[];
}

// What to do instead when a factor drags mood, or how to add one that lifts it.
const SWAP: Record<string, string> = {
  phone: "Swap scrolling for a walk or a call with a friend",
  "job-search": "After job-search time, do one thing that lifts you",
};
const ADD: Record<string, string> = {
  sleep: "Get 7+ hours of sleep tonight",
  movement: "Fit in some movement, even a 20-minute walk",
  social: "Reach out to a friend or family member",
  focus: "Start with an hour of focused work or plan your day",
};
const KEEP: Record<string, string> = {
  sleep: "You slept 7+ hours",
  movement: "You moved your body",
  social: "You spent time with people",
  focus: "You did focused work",
};

const MIN_HISTORY = 5;

/**
 * Compares one entry against patterns from the *other* entries, so a day
 * isn't judged by its own data.
 */
export function feedbackFor(entry: Entry, all: Entry[]): Feedback {
  const history = all.filter((e) => e.date !== entry.date);
  const base = { date: entry.date, mood: entry.mood, wentWell: [], tryInstead: [] };
  if (history.length < MIN_HISTORY) {
    return { ...base, headline: `Write ${MIN_HISTORY - history.length} more entries to unlock personal feedback.` };
  }

  const tests = new Map(FACTORS.map((f) => [f.id, f.test]));
  const wentWell: FeedbackItem[] = [];
  const tryInstead: FeedbackItem[] = [];

  for (const f of computeFactors(history)) {
    const had = tests.get(f.id)!(entry);
    const stats = `Your mood averaged ${f.withAvg} on days with ${f.label.toLowerCase()} vs ${f.withoutAvg} without.`;
    if (f.effect === "lifts" && had && KEEP[f.id]) {
      wentWell.push({ factorId: f.id, title: KEEP[f.id], detail: stats, boost: f.delta });
    } else if (f.effect === "lifts" && !had && ADD[f.id]) {
      tryInstead.push({ factorId: f.id, title: ADD[f.id], detail: stats, boost: f.delta });
    } else if (f.effect === "drags" && had && SWAP[f.id]) {
      tryInstead.push({ factorId: f.id, title: SWAP[f.id], detail: stats, boost: -f.delta });
    }
  }

  wentWell.sort((a, b) => b.boost - a.boost);
  tryInstead.sort((a, b) => b.boost - a.boost);

  const top = tryInstead[0];
  const headline =
    entry.mood >= 8
      ? "Great day! Here's what helped, so you can repeat it."
      : top
        ? `Biggest opportunity: ${top.title.charAt(0).toLowerCase() + top.title.slice(1)}. On past days that was worth about +${top.boost} mood.`
        : wentWell.length
          ? "You did the things that usually lift your mood. Some days are just harder, and that's okay."
          : "Keep tagging your activities so patterns can show up.";

  return { ...base, headline, wentWell, tryInstead: tryInstead.slice(0, 3) };
}
