/**
 * Shared Anthropic spend cap + usage ledger.
 *
 * This app shares its Anthropic key with ai-app, contractorcalc-app,
 * radio-coach, and bluewave-school-app. ai-app already enforces a hard
 * $10/month cap, but only against ITS OWN usage_logs rows — the other
 * apps on this key were a blind spot (could burn real spend the cap
 * never saw). This module points at that SAME table (ai_service DB on
 * shared-pg), so the shared $10/month total is now actually shared.
 *
 * checkBudget() BEFORE every Anthropic call; logUsage() AFTER every
 * successful one. No source_app column on this table (unlike the
 * Binnacle-key ledger) — attribution lives in the endpoint prefix
 * instead (e.g. "takeoff-app/extraction").
 */
import { Pool } from "pg";

const MONTHLY_BUDGET_USD = Number(
  process.env.ANTHROPIC_MONTHLY_BUDGET_USD ?? 10,
);

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.SHARED_LEDGER_DB_HOST ?? "shared-pg",
      user: process.env.SHARED_LEDGER_DB_USER ?? "ai_service",
      password: process.env.SHARED_LEDGER_DB_PASS ?? "Cameraman1$",
      database: process.env.SHARED_LEDGER_DB_NAME ?? "ai_service",
      max: 2,
    });
  }
  return pool;
}

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-7": { input: 5.0, output: 25.0 },
  "claude-opus-4-6": { input: 5.0, output: 25.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
};

export class BudgetExceededError extends Error {
  constructor(spent: number, endpoint: string) {
    super(
      `Monthly Anthropic budget ($${MONTHLY_BUDGET_USD.toFixed(2)}) reached — ` +
        `$${spent.toFixed(2)} spent this month across every app on this key. ` +
        `Blocked call from '${endpoint}'.`,
    );
    this.name = "BudgetExceededError";
  }
}

function calculateCost(
  model: string,
  tokensIn: number,
  tokensOut: number,
): number {
  const pricing = MODEL_PRICING[model] ?? { input: 3.0, output: 15.0 };
  return (tokensIn * pricing.input + tokensOut * pricing.output) / 1_000_000;
}

export async function monthToDateSpend(): Promise<number> {
  const { rows } = await getPool().query(
    `SELECT COALESCE(SUM(cost), 0)::float8 AS total FROM usage_logs WHERE created_at >= date_trunc('month', now())`,
  );
  return rows[0]?.total ?? 0;
}

/** Call BEFORE every Anthropic API call. Throws BudgetExceededError once this month's combined spend meets the cap. */
export async function checkBudget(endpoint: string): Promise<void> {
  const spent = await monthToDateSpend();
  if (spent >= MONTHLY_BUDGET_USD) {
    throw new BudgetExceededError(spent, endpoint);
  }
}

/** Call AFTER every successful Anthropic API call. Returns the computed cost. */
export async function logUsage(
  model: string,
  tokensIn: number,
  tokensOut: number,
  endpoint: string,
): Promise<number> {
  const cost = calculateCost(model, tokensIn, tokensOut);
  await getPool().query(
    `INSERT INTO usage_logs (model, tokens_in, tokens_out, cost, endpoint, created_at) VALUES ($1, $2, $3, $4, $5, now())`,
    [model, tokensIn, tokensOut, cost, endpoint],
  );
  return cost;
}
