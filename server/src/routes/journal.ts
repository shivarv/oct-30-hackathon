import { Router } from "express";
import { entrySchema, readEntries, saveEntry } from "../db/journal.js";
import { feedbackFor } from "../services/feedback.js";
import { computeInsights } from "../services/insights.js";

export const journalRouter = Router();

journalRouter.get("/entries", async (_req, res) => {
  res.json(await readEntries());
});

journalRouter.post("/entries", async (req, res) => {
  const parsed = entrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") } });
    return;
  }
  const entries = await saveEntry(parsed.data);
  res.status(201).json({ entry: parsed.data, feedback: feedbackFor(parsed.data, entries) });
});

journalRouter.get("/entries/:date/feedback", async (req, res) => {
  const entries = await readEntries();
  const entry = entries.find((e) => e.date === req.params.date);
  if (!entry) {
    res.status(404).json({ error: { message: `No entry for ${req.params.date}` } });
    return;
  }
  res.json(feedbackFor(entry, entries));
});

journalRouter.get("/insights", async (_req, res) => {
  res.json(computeInsights(await readEntries()));
});
