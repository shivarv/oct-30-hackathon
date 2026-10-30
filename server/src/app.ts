import express from "express";
import cors from "cors";
import { env } from "./lib/env.js";
import { journalRouter } from "./routes/journal.js";

export const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", journalRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: { message: status === 500 ? "Internal error" : err.message } });
});
