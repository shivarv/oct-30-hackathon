import path from "node:path";
import { describe, expect, it } from "vitest";
import { readEntries, type Entry } from "../src/db/journal.js";
import { feedbackFor } from "../src/services/feedback.js";

const sample = path.resolve(import.meta.dirname, "fixtures/journal-sample.json");

describe("feedbackFor", () => {
  it("suggests swapping phone time and adding lifts on a low day", async () => {
    const entries = await readEntries(sample);
    const lowDay = entries.find((e) => e.date === "2026-10-27")!; // phone, 5h sleep, mood 4
    const fb = feedbackFor(lowDay, entries);
    const ids = fb.tryInstead.map((i) => i.factorId);
    expect(ids).toContain("phone");
    expect(ids).toContain("sleep");
    expect(fb.tryInstead.every((i) => i.boost > 0)).toBe(true);
    expect(fb.headline).toMatch(/^Biggest opportunity: swap scrolling/);
  });

  it("praises what went well on a great day", async () => {
    const entries = await readEntries(sample);
    const best = entries.find((e) => e.date === "2026-10-24")!; // hike, 8.5h sleep, mood 8
    const fb = feedbackFor(best, entries);
    expect(fb.wentWell.map((i) => i.factorId)).toEqual(expect.arrayContaining(["sleep", "movement"]));
    expect(fb.headline).toMatch(/Great day/);
  });

  it("asks for more entries when history is short", () => {
    const e: Entry = { date: "2026-10-01", mood: 5, energy: 5, sleepHours: 7, tags: [], entry: "x" };
    const fb = feedbackFor(e, [e]);
    expect(fb.tryInstead).toEqual([]);
    expect(fb.headline).toMatch(/more entries/);
  });
});
