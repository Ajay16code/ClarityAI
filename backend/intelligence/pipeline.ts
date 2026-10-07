import { computeDealDecision } from './dealDecisionEngine';
import { computeKPIEngine } from './kpiEngine';
import { computeRiskEngine } from './riskEngine';
import {
  GeminiStructuredOutput,
  IntelligenceRequest,
  IntelligenceResponse,
  TranscriptSentence,
} from './types';

const defaultGeminiOutput: GeminiStructuredOutput = {
  sentiment: { score: 0, label: 'neutral' },
  buyer_intent: 'unknown',
  objections: [],
  buying_signals: {
    budget: [],
    timeline: [],
    authority: [],
    competition: [],
  },
  key_moments: [],
  next_steps_detected: false,
};

export function normalizeSentences(sentences: TranscriptSentence[]): TranscriptSentence[] {
  return sentences
    .filter((s) => s && typeof s.text === 'string')
    .map((s) => ({
      ...s,
      startSec: Number.isFinite(s.startSec) ? s.startSec : 0,
      endSec: Number.isFinite(s.endSec) ? s.endSec : Math.max(0, (s.startSec || 0) + 2),
      speakerRole: s.speakerRole || 'unknown',
      speakerId: s.speakerId || 'unknown',
      text: s.text.trim(),
    }))
    .filter((s) => s.text.length > 0);
}

export function runIntelligencePipeline(input: IntelligenceRequest): IntelligenceResponse {
  const diarizedSentences = normalizeSentences(input.diarized_sentences || []);
  const gemini = { ...defaultGeminiOutput, ...(input.gemini || {}) };

  const kpi = computeKPIEngine(diarizedSentences, gemini);
  const risk = computeRiskEngine(diarizedSentences, gemini, kpi);
  const deal = computeDealDecision(gemini, kpi, risk);

  return {
    kpi,
    risk,
    deal,
    gemini,
  };
}
