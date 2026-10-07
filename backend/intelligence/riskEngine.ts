import { GeminiStructuredOutput, KPIEngineResult, RiskEngineResult, TranscriptSentence } from './types';
import { detectSkepticismPhrases, hasNextStepLanguage } from './textFeatures';

const clamp = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value));

export function computeRiskEngine(
  sentences: TranscriptSentence[],
  gemini: GeminiStructuredOutput,
  kpi: KPIEngineResult
): RiskEngineResult {
  const redFlags: string[] = [];
  const reasons: string[] = [];

  const sentimentTimeline = kpi.timeline.sentiment_timeline;
  const startSentiment = sentimentTimeline[0]?.sentimentScore ?? gemini.sentiment.score;
  const endSentiment = sentimentTimeline[sentimentTimeline.length - 1]?.sentimentScore ?? gemini.sentiment.score;
  const sentimentDrop = startSentiment - endSentiment;

  if (sentimentDrop > 0.15) {
    redFlags.push('Sentiment dropped over call timeline');
    reasons.push(`Sentiment changed from ${startSentiment.toFixed(2)} to ${endSentiment.toFixed(2)}.`);
  }

  const skepticism = detectSkepticismPhrases(sentences);
  if (skepticism.length > 0) {
    redFlags.push('Buyer skepticism language detected');
    reasons.push(`Skeptical phrases found: ${skepticism.slice(0, 3).join(' | ')}`);
  }

  const buyerParticipation = kpi.buyer_engagement.buyer_participation_rate / 100;
  const hasNextStep = gemini.next_steps_detected || sentences.some((s) => hasNextStepLanguage(s.text));

  const ghostingProbability = clamp(
    Math.round(
      (1 - buyerParticipation) * 45 +
      (hasNextStep ? 10 : 35) +
      Math.max(0, 20 * sentimentDrop) +
      skepticism.length * 5
    )
  );

  if (ghostingProbability > 60) {
    redFlags.push('High ghosting risk due to weak engagement and unclear next step');
  }

  if (!hasNextStep) {
    redFlags.push('Next step missing');
    reasons.push('No scheduling or follow-up commitment identified.');
  }

  const riskScore = clamp(
    Math.round(
      30 +
      Math.max(0, sentimentDrop * 60) +
      skepticism.length * 6 +
      (100 - kpi.deal_health.objection_resolution_rate) * 0.25 +
      (hasNextStep ? 0 : 18)
    )
  );

  return {
    risk_score: riskScore,
    ghosting_probability: ghostingProbability,
    red_flags: redFlags.slice(0, 8),
    risk_reasons: reasons.slice(0, 8),
  };
}
