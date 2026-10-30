import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { env } from "../lib/env.js";

export const entrySchema = z.object({
  date: z.iso.date(),
  mood: z.number().int().min(1).max(10),
  energy: z.number().int().min(1).max(10),
  sleepHours: z.number().min(0).max(24),
  tags: z.array(z.string().trim().toLowerCase().min(1)).default([]),
  entry: z.string().trim().min(1).max(5000),
});

export type Entry = z.infer<typeof entrySchema>;

// A JSON file is enough for a single-user hackathon app; swap for Postgres later.
export async function readEntries(file = env.JOURNAL_FILE): Promise<Entry[]> {
  try {
    const raw = JSON.parse(await readFile(file, "utf8"));
    return z.array(entrySchema).parse(raw).sort((a, b) => a.date.localeCompare(b.date));
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

export async function saveEntry(entry: Entry, file = env.JOURNAL_FILE): Promise<Entry[]> {
  const entries = (await readEntries(file)).filter((e) => e.date !== entry.date);
  entries.push(entry);
  entries.sort((a, b) => a.date.localeCompare(b.date));
  await writeFile(file, JSON.stringify(entries, null, 2) + "\n");
  return entries;
}
