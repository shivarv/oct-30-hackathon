import path from "node:path";
import { describe, expect, it } from "vitest";
import { readEntries } from "../src/db/journal.js";
import { computeInsights } from "../src/services/insights.js";

const sample = path.resolve(import.meta.dirname, "fixtures/journal-sample.json");

describe("computeInsights", () => {
  it("summarizes the sample journal", async () => {
    const insights = computeInsights(await readEntries(sample));
    expect(insights.summary).toMatchObject({ count: 14, avgMood: 5.6, avgSleep: 6.5 });
    expect(insights.summary.best?.date).toBe("2026-10-24");
    expect(insights.summary.worst?.date).toBe("2026-10-20");
  });

  it("finds sleep and movement lift mood and phone drags it", async () => {
    const { factors } = computeInsights(await readEntries(sample));
    const byId = Object.fromEntries(factors.map((f) => [f.id, f]));
    expect(byId.sleep).toMatchObject({ withAvg: 6.3, withoutAvg: 5, effect: "lifts" });
    expect(byId.movement).toMatchObject({ withAvg: 6.8, effect: "lifts" });
    expect(byId.phone).toMatchObject({ withAvg: 4, effect: "drags" });
  });

  it("builds a persona and ranked suggestions", async () => {
    const { persona, suggestions, caution } = computeInsights(await readEntries(sample));
    expect(persona.title).toBe("The Driven Achiever Running on Low Reserves");
    expect(persona.strengths.map((s) => s.title)).toContain("You bounce back");
    expect(persona.challenges.map((c) => c.title)).toContain("Hard to say no");
    const impacts = suggestions.map((s) => s.impact);
    expect(impacts).toEqual([...impacts].sort((a, b) => b - a));
    expect(impacts.every((i) => i > 0)).toBe(true);
    expect(suggestions.map((s) => s.id)).toEqual(expect.arrayContaining(["sleep", "phone", "movement"]));
    expect(suggestions.find((s) => s.id === "phone")?.impact).toBe(1.9);
    expect(caution).toBeNull();
  });

  it("pairs drains with healthier swaps and keeps unhealthy tags out of boosts", async () => {
    const { drains, boosts, swaps } = computeInsights(await readEntries(sample));
    expect(drains.map((d) => d.tag)).toContain("phone");
    expect(drains.every((d) => d.delta < 0)).toBe(true);
    expect(boosts.map((b) => b.tag)).not.toContain("skipped-meal");
    const phone = swaps.find((s) => s.drain.tag === "phone");
    expect(phone?.instead.length).toBeGreaterThan(0);
    expect(phone?.instead.every((i) => i.delta > 0)).toBe(true);
  });

  it("handles an empty journal", () => {
    const insights = computeInsights([]);
    expect(insights.summary.count).toBe(0);
    expect(insights.factors).toEqual([]);
  });
});
