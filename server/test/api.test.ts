import { mkdtemp, copyFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

let app: typeof import("../src/app.js").app;

beforeAll(async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "journal-"));
  const file = path.join(dir, "entries.json");
  await copyFile(path.resolve(import.meta.dirname, "fixtures/journal-sample.json"), file);
  process.env.JOURNAL_FILE = file;
  ({ app } = await import("../src/app.js"));
});

describe("journal API", () => {
  it("reports health", async () => {
    await request(app).get("/api/health").expect(200, { ok: true });
  });

  it("lists entries and insights", async () => {
    const entries = await request(app).get("/api/entries").expect(200);
    expect(entries.body).toHaveLength(14);
    const insights = await request(app).get("/api/insights").expect(200);
    expect(insights.body.persona.title).toMatch(/^The /);
  });

  it("adds a valid entry and rejects an invalid one", async () => {
    const entry = { date: "2026-10-30", mood: 8, energy: 7, sleepHours: 8, tags: ["Hackathon"], entry: "Demo day!" };
    const created = await request(app).post("/api/entries").send(entry).expect(201);
    expect(created.body.entry.tags).toEqual(["hackathon"]);
    expect(created.body.feedback.date).toBe("2026-10-30");
    const entries = await request(app).get("/api/entries");
    expect(entries.body).toHaveLength(15);

    const fb = await request(app).get("/api/entries/2026-10-30/feedback").expect(200);
    expect(fb.body.headline).toBeTruthy();
    await request(app).get("/api/entries/1999-01-01/feedback").expect(404);

    const bad = await request(app).post("/api/entries").send({ ...entry, mood: 42 }).expect(400);
    expect(bad.body.error.message).toContain("mood");
  });
});
