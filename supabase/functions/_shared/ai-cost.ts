// AI Cost Calculation Helper
// Shared across edge functions for consistent token/cost tracking

// Gemini 3 Flash pricing (USD)
const INPUT_COST_PER_TOKEN_USD = 0.50 / 1_000_000;
const OUTPUT_COST_PER_TOKEN_USD = 3.00 / 1_000_000;

// OpenAI Whisper pricing (USD)
const WHISPER_COST_PER_MINUTE_USD = 0.006;

// Exchange rate
const USD_TO_BRL = 5.50;

// Plan budgets in BRL (price / 2.5 margin)
const PLAN_BUDGETS_BRL: Record<string, number> = {
  trial: 78.80,
  start: 19.60,
  plus: 38.80,
  pro: 78.80,
};

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

export interface WhisperCost {
  audio_blob_size_bytes: number;
}

/**
 * Calculate cost in BRL from Gemini token usage
 */
export function calculateGeminiCostBRL(usage: TokenUsage): number {
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const costUSD = (inputTokens * INPUT_COST_PER_TOKEN_USD) + (outputTokens * OUTPUT_COST_PER_TOKEN_USD);
  return costUSD * USD_TO_BRL;
}

/**
 * Calculate cost in BRL from Whisper audio transcription
 * Estimates duration from blob size: ~16KB/s for OGG audio
 */
export function calculateWhisperCostBRL(blobSizeBytes: number): number {
  const durationSeconds = blobSizeBytes / 16000;
  const durationMinutes = durationSeconds / 60;
  const costUSD = durationMinutes * WHISPER_COST_PER_MINUTE_USD;
  return costUSD * USD_TO_BRL;
}

/**
 * Estimate tokens from text (for streaming responses where usage isn't available)
 * Rough estimate: ~4 characters per token for Portuguese
 */
export function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get budget for a plan in BRL
 */
export function getPlanBudgetBRL(plan: string): number {
  return PLAN_BUDGETS_BRL[plan] || PLAN_BUDGETS_BRL.start;
}

/**
 * Update AI usage in the user's profile
 * Increments ai_cost_accumulated and recalculates ai_usage_percent
 */
export async function updateAiUsage(
  supabaseAdmin: { from: (table: string) => any },
  userId: string,
  costBRL: number
): Promise<{ blocked: boolean; usagePercent: number }> {
  // Get current accumulated cost and plan
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("ai_cost_accumulated, plan")
    .eq("id", userId)
    .single();

  if (!profile) {
    console.error(`Profile not found for user ${userId}`);
    return { blocked: false, usagePercent: 0 };
  }

  const currentAccumulated = Number(profile.ai_cost_accumulated) || 0;
  const newAccumulated = currentAccumulated + costBRL;
  const budget = getPlanBudgetBRL(profile.plan);
  const usagePercent = Math.min(100, (newAccumulated / budget) * 100);

  await supabaseAdmin
    .from("profiles")
    .update({
      ai_cost_accumulated: newAccumulated,
      ai_usage_percent: Math.round(usagePercent * 100) / 100, // 2 decimal places
    })
    .eq("id", userId);

  console.log(`AI usage updated for ${userId}: R$${costBRL.toFixed(4)} added, total R$${newAccumulated.toFixed(4)}/${budget}, ${usagePercent.toFixed(1)}%`);

  return { blocked: usagePercent >= 100, usagePercent };
}

/**
 * Check if user has exceeded AI usage limit
 */
export async function isAiUsageBlocked(
  supabaseAdmin: { from: (table: string) => any },
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("ai_usage_percent")
    .eq("id", userId)
    .single();

  return (profile?.ai_usage_percent || 0) >= 100;
}
