import path from "node:path";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JOURNAL_FILE: z.string().default("../data/journal-entries.json"),
});

const parsed = schema.parse(process.env);

export const env = {
  ...parsed,
  JOURNAL_FILE: path.resolve(process.cwd(), parsed.JOURNAL_FILE),
};
