// Generates demo journal entries for a date range and merges them into the journal file
// without touching dates that already have an entry.
// Usage: node scripts/seed-demo.mjs 2026-09-01 2026-10-15 [../data/journal-entries.json]
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [from = "2026-09-01", to = "2026-10-15", file = "../data/journal-entries.json"] = process.argv.slice(2);
const target = path.resolve(process.cwd(), file);

// Small seeded RNG so the demo data is the same every run.
let seed = 20260901;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (xs) => xs[Math.floor(rand() * xs.length)];
const between = (a, b) => a + rand() * (b - a);

// when: which days a scenario fits. sleep: [min, max] hours.
const SCENARIOS = [
  { when: "weekday", tags: ["exercise", "work"], sleep: [6.5, 8], text: "Morning gym session before class. Felt sharp in lectures and got my readings done." },
  { when: "weekday", tags: ["productivity", "work"], sleep: [7, 8], text: "Put my phone in a drawer and did two solid hours of deep work. Finished the problem set early." },
  { when: "weekday", tags: ["deadline", "caffeine", "work"], sleep: [4.5, 6], text: "Project due at midnight. Lived on coffee and submitted with ten minutes to spare." },
  { when: "weekday", tags: ["job-search"], sleep: [6, 7.5], text: "Sent out three applications and tailored my resume for each one. Slow but steady." },
  { when: "weekday", tags: ["job-search", "rejection", "comparison"], sleep: [5, 6.5], text: "Another rejection. Saw two classmates post their offers and felt like I'm falling behind." },
  { when: "weekday", tags: ["job-search", "interview"], sleep: [6, 7.5], text: "Had a first-round interview. Nervous at the start but the conversation flowed after a few minutes." },
  { when: "weekday", tags: ["phone", "procrastination"], sleep: [5, 6.5], text: "Kept telling myself I'd start after one more video. Lost the whole evening to scrolling." },
  { when: "weekday", tags: ["phone", "tired"], sleep: [4.5, 5.5], text: "Stayed up scrolling until almost 2am. Dragged myself through the day and skipped the gym." },
  { when: "weekday", tags: ["overcommit", "work"], sleep: [6, 7], text: "Agreed to cover a teammate's part of the group project on top of my own. Spread too thin." },
  { when: "weekday", tags: ["friends", "walk"], sleep: [6.5, 8], text: "Grabbed coffee with a friend and walked around campus after. Laughed more than I have all week." },
  { when: "weekday", tags: ["work", "skipped-meal"], sleep: [6, 7], text: "Back-to-back classes and a lab. Realized at 4pm I hadn't eaten anything but a granola bar." },
  { when: "weekday", tags: ["flow", "work"], sleep: [7, 8.5], text: "Got completely absorbed in a coding assignment. Hours flew by and it felt great to build something." },
  { when: "weekday", tags: ["anxiety", "work"], sleep: [5.5, 7], text: "Midterm next week and I feel unprepared. Hard to focus with my mind racing." },
  { when: "weekday", tags: ["walk", "planning"], sleep: [7, 8], text: "Evening walk to clear my head, then mapped out the rest of the week. Felt in control." },
  { when: "weekday", tags: ["family"], sleep: [6.5, 8], text: "Long video call with my family. Missed home but it reminded me why I'm doing all this." },
  { when: "weekend", tags: ["nature", "exercise", "friends"], sleep: [8, 9], text: "Day trip hiking with friends. Phone stayed in my bag and I came back exhausted in the best way." },
  { when: "weekend", tags: ["cooking", "family"], sleep: [8, 9.5], text: "Slept in, called home and cooked a proper meal from my mom's recipe. Cozy, slow day." },
  { when: "weekend", tags: ["phone", "procrastination"], sleep: [7, 9], text: "Meant to catch up on assignments but spent most of the day in bed on my phone." },
  { when: "weekend", tags: ["friends", "cooking"], sleep: [7, 8.5], text: "Potluck dinner at a friend's apartment. Good food, good people, no talk about jobs." },
  { when: "weekend", tags: ["exercise", "cooking"], sleep: [7.5, 9], text: "Long run by the river, then meal-prepped for the week. Feeling organized." },
  { when: "weekend", tags: ["work", "deadline"], sleep: [6, 7.5], text: "Spent the whole Saturday in the library catching up. Productive but a little lonely." },
  { when: "sunday", tags: ["anxiety", "planning"], sleep: [7, 8.5], text: "Sunday scaries kicked in by the afternoon. Wrote out my week plan and it eased a bit." },
  { when: "sunday", tags: ["anxiety", "phone"], sleep: [6.5, 8], text: "Dreading Monday. Scrolled to avoid thinking about it, which only made it worse." },
  { when: "sunday", tags: ["walk", "planning"], sleep: [7.5, 9], text: "Quiet Sunday. Long walk, laundry, and a calm planning session for the week ahead." },
];

// Rough model of how activities affect this person's mood.
const EFFECTS = {
  exercise: 0.7, walk: 0.5, nature: 0.8, friends: 0.6, family: 0.5, cooking: 0.3,
  productivity: 0.5, flow: 0.7, planning: 0.3, interview: 0.1,
  phone: -0.9, procrastination: -0.5, rejection: -1.4, comparison: -0.4, anxiety: -0.7,
  overcommit: -0.4, deadline: -0.3, "skipped-meal": -0.3, tired: -0.5, caffeine: -0.1,
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const day = (d) => new Date(`${d}T00:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);

const existing = JSON.parse(await readFile(target, "utf8"));
const taken = new Set(existing.map((e) => e.date));
const recent = [];
const generated = [];

for (let d = day(from); d <= day(to); d.setUTCDate(d.getUTCDate() + 1)) {
  const date = iso(d);
  if (taken.has(date)) continue;
  const dow = d.getUTCDay();
  const kind = dow === 0 && rand() < 0.7 ? "sunday" : dow === 0 || dow === 6 ? "weekend" : "weekday";
  const pool = SCENARIOS.filter((s) => s.when === kind && !recent.includes(s));
  const s = pick(pool.length ? pool : SCENARIOS.filter((x) => x.when === kind));
  recent.push(s);
  if (recent.length > 5) recent.shift();

  const sleepHours = Math.round(between(...s.sleep) * 2) / 2;
  const effect = s.tags.reduce((sum, t) => sum + (EFFECTS[t] ?? 0), 0);
  const mood = Math.round(clamp(5.6 + effect + (sleepHours - 7) * 0.4 + between(-1.2, 1.2), 1, 10));
  const energy = Math.round(clamp(mood * 0.6 + (sleepHours - 7) * 0.8 + 2 + between(-1, 1), 1, 10));
  generated.push({ date, mood, energy, sleepHours, tags: s.tags, entry: s.text });
}

const merged = [...existing, ...generated].sort((a, b) => a.date.localeCompare(b.date));
await writeFile(target, JSON.stringify(merged, null, 2) + "\n");
console.log(`Added ${generated.length} demo entries (${from} to ${to}); journal now has ${merged.length}.`);
