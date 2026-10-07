import { DealDecisionOutput, DealStatus, GeminiStructuredOutput, KPIEngineResult, RiskEngineResult } from './types';

export function classifyDeal(data: {
  sentiment: GeminiStructuredOutput['sentiment'];
  objections: GeminiStructuredOutput['objections'];
  next_steps: boolean;
  engagement: number;
  signals: GeminiStructuredOutput['buying_signals'];
}): DealStatus {
  const { sentiment, objections, next_steps, engagement, signals } = data;

  if (
    sentiment.score > 0.7 &&
    signals.authority.length > 0 &&
    next_steps === true &&
    objections.every((o) => o.resolved)
  ) {
    return 'READY_TO_CLOSE';
  }

  if (
    sentiment.score > 0.5 &&
    (!next_steps || objections.length > 0)
  ) {
    return 'NEEDS_FOLLOWUP';
  }

  if (engagement < 0.3) {
    return 'AT_RISK';
  }

  return 'AT_RISK';
}

export function generateAssistantSuggestion(data: {
  next_steps: boolean;
  objections: GeminiStructuredOutput['objections'];
  signals: GeminiStructuredOutput['buying_signals'];
  sentiment: GeminiStructuredOutput['sentiment'];
  engagement: number;
}): string[] {
  const suggestions: string[] = [];

  if (!data.next_steps) {
    suggestions.push("Ask a clear next step: 'Shall we schedule the next call?'");
  }

  if (data.objections.some((o) => !o.resolved)) {
    suggestions.push("Address the buyer's requirement before pushing for closure.");
  }

  if (data.signals.timeline.length === 0) {
    suggestions.push("Ask about timeline: 'When are you planning to implement this?'");
  }

  if (data.sentiment.score > 0.7) {
    suggestions.push("Move toward closing: 'Shall we finalize this today?'");
  }

  if (data.engagement < 0.3) {
    suggestions.push('Increase engagement by asking open-ended questions.');
  }

  return suggestions;
}

export function generateRecommendedMessage(status: DealStatus, suggestions: string[]): string {
  if (status === 'READY_TO_CLOSE') {
    return "Great to hear you're interested. Can we confirm timeline and stakeholder sign-off so we can finalize today?";
  }

  if (status === 'NEEDS_FOLLOWUP') {
    return "Great discussion so far. To keep momentum, can we align on your requirement and schedule a concrete follow-up date?";
  }

  if (suggestions.length > 0) {
    return `Thanks for the conversation. ${suggestions[0]} Also, what would make this decision easiest on your side?`;
  }

  return 'Thanks for your time today. What are the key blockers we should solve first to move this forward?';
}

export function computeDealDecision(
  gemini: GeminiStructuredOutput,
  kpi: KPIEngineResult,
  risk: RiskEngineResult
): DealDecisionOutput {
  const engagement = kpi.buyer_engagement.buyer_participation_rate / 100;

  const status = classifyDeal({
    sentiment: gemini.sentiment,
    objections: gemini.objections,
    next_steps: gemini.next_steps_detected,
    engagement,
    signals: gemini.buying_signals,
  });

  const suggestions = generateAssistantSuggestion({
    next_steps: gemini.next_steps_detected,
    objections: gemini.objections,
    signals: gemini.buying_signals,
    sentiment: gemini.sentiment,
    engagement,
  });

  if (risk.risk_score > 70 && status === 'READY_TO_CLOSE') {
    suggestions.unshift('Clarify unresolved uncertainty before pushing to close.');
  }

  return {
    deal_status: status,
    assistant_suggestions: suggestions,
    recommended_next_message: generateRecommendedMessage(status, suggestions),
  };
}
