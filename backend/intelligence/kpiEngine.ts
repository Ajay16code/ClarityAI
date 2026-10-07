import {
  GeminiStructuredOutput,
  KPIEngineResult,
  TranscriptSentence,
} from './types';
import {
  chunkTranscript,
  computeInterruptionCount,
  hasDiscoveryLanguage,
  hasNextStepLanguage,
  hasValueLanguage,
  isQuestion,
  roleSeconds,
} from './textFeatures';

const clamp = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value));

const sentimentTrendFromChunks = (scores: number[]): 'improving' | 'stable' | 'declining' => {
  if (scores.length < 2) return 'stable';
  const delta = scores[scores.length - 1] - scores[0];
  if (delta > 0.1) return 'improving';
  if (delta < -0.1) return 'declining';
  return 'stable';
};

export function computeKPIEngine(
  sentences: TranscriptSentence[],
  gemini: GeminiStructuredOutput
): KPIEngineResult {
  const totalSeconds = sentences.reduce((acc, s) => acc + Math.max(0, s.endSec - s.startSec), 0) || 1;
  const totalMinutes = Math.max(totalSeconds / 60, 1 / 60);
  const buyerSeconds = roleSeconds(sentences, 'buyer');
  const repSeconds = roleSeconds(sentences, 'rep');

  const buyerUtterances = sentences.filter((s) => s.speakerRole === 'buyer');
  const buyerQuestions = buyerUtterances.filter((s) => isQuestion(s.text)).length;
  const interruptionCount = computeInterruptionCount(sentences);

  const talkToListenRatio = Number((repSeconds / Math.max(buyerSeconds, 1)).toFixed(2));
  const buyerParticipationRate = Number(((buyerSeconds / totalSeconds) * 100).toFixed(2));
  const questionDensity = Number((buyerQuestions / totalMinutes).toFixed(2));

  const nextStepHits = sentences.filter((s) => hasNextStepLanguage(s.text)).length;
  const objections = gemini.objections || [];
  const resolvedObjections = objections.filter((o) => o.resolved).length;
  const objectionResolutionRate = objections.length
    ? Number(((resolvedObjections / objections.length) * 100).toFixed(2))
    : 100;

  const momentumRaw =
    gemini.sentiment.score * 35 +
    (gemini.next_steps_detected ? 20 : 0) +
    nextStepHits * 5 -
    objections.length * 6 +
    (gemini.buying_signals.timeline.length > 0 ? 10 : 0);

  const momentumScore = clamp(Math.round(momentumRaw + 50));

  const discoveryHits = sentences.filter((s) => hasDiscoveryLanguage(s.text)).length;
  const valueHits = sentences.filter((s) => hasValueLanguage(s.text)).length;
  const objectionHandlingQuality = objectionResolutionRate;
  const nextStepClarity = gemini.next_steps_detected ? 85 : 25;

  const chunks = chunkTranscript(sentences, gemini.sentiment.score).map((chunk, i, arr) => {
    const scaled = gemini.sentiment.score + (i / Math.max(arr.length, 1) - 0.5) * 0.2;
    return { ...chunk, sentimentScore: Number(Math.max(-1, Math.min(1, scaled)).toFixed(3)) };
  });

  const riskTimeline = chunks.map((chunk) => {
    const hasNextStep = hasNextStepLanguage(chunk.text);
    const risk = clamp(Math.round(55 - chunk.sentimentScore * 30 + (hasNextStep ? -8 : 10)));
    return {
      startSec: chunk.startSec,
      endSec: chunk.endSec,
      risk,
      reason: hasNextStep ? 'Clear action language' : 'No explicit commitment language',
    };
  });

  return {
    buyer_engagement: {
      talk_to_listen_ratio: talkToListenRatio,
      buyer_participation_rate: buyerParticipationRate,
      buyer_question_density: questionDensity,
      interruption_count: interruptionCount,
    },
    deal_health: {
      sentiment_trend: sentimentTrendFromChunks(chunks.map((c) => c.sentimentScore)),
      momentum_score: momentumScore,
      objection_frequency: objections.length,
      objection_resolution_rate: objectionResolutionRate,
    },
    rep_effectiveness: {
      discovery_depth_score: clamp(Math.round((discoveryHits / Math.max(sentences.length, 1)) * 100)),
      value_articulation_rate: clamp(Math.round((valueHits / Math.max(sentences.length, 1)) * 100)),
      objection_handling_quality: objectionHandlingQuality,
      next_step_clarity_score: nextStepClarity,
    },
    timeline: {
      sentiment_timeline: chunks,
      risk_timeline: riskTimeline,
    },
  };
}
