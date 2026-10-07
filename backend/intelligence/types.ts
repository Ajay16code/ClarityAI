export type SpeakerRole = 'buyer' | 'rep' | 'unknown';

export interface TranscriptSentence {
  text: string;
  startSec: number;
  endSec: number;
  speakerId: string;
  speakerRole: SpeakerRole;
}

export interface TranscriptChunk {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
  sentimentScore: number;
}

export interface ObjectionItem {
  text: string;
  resolved: boolean;
  startSec?: number;
  responseText?: string;
}

export interface BuyingSignals {
  budget: string[];
  timeline: string[];
  authority: string[];
  competition: string[];
}

export interface GeminiStructuredOutput {
  sentiment: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
  };
  buyer_intent: string;
  objections: ObjectionItem[];
  buying_signals: BuyingSignals;
  key_moments: string[];
  next_steps_detected: boolean;
}

export interface BuyerEngagementKPIs {
  talk_to_listen_ratio: number;
  buyer_participation_rate: number;
  buyer_question_density: number;
  interruption_count: number;
}

export interface DealHealthKPIs {
  sentiment_trend: 'improving' | 'stable' | 'declining';
  momentum_score: number;
  objection_frequency: number;
  objection_resolution_rate: number;
}

export interface RepEffectivenessKPIs {
  discovery_depth_score: number;
  value_articulation_rate: number;
  objection_handling_quality: number;
  next_step_clarity_score: number;
}

export interface KPIEngineResult {
  buyer_engagement: BuyerEngagementKPIs;
  deal_health: DealHealthKPIs;
  rep_effectiveness: RepEffectivenessKPIs;
  timeline: {
    sentiment_timeline: TranscriptChunk[];
    risk_timeline: Array<{ startSec: number; endSec: number; risk: number; reason: string }>;
  };
}

export interface RiskEngineResult {
  risk_score: number;
  ghosting_probability: number;
  red_flags: string[];
  risk_reasons: string[];
}

export type DealStatus = 'READY_TO_CLOSE' | 'NEEDS_FOLLOWUP' | 'AT_RISK';

export interface DealDecisionOutput {
  deal_status: DealStatus;
  assistant_suggestions: string[];
  recommended_next_message: string;
}

export interface IntelligenceRequest {
  transcript: string;
  diarized_sentences: TranscriptSentence[];
  gemini: GeminiStructuredOutput;
}

export interface IntelligenceResponse {
  kpi: KPIEngineResult;
  risk: RiskEngineResult;
  deal: DealDecisionOutput;
  gemini: GeminiStructuredOutput;
}
