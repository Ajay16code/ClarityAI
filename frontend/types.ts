
export interface UserProfile {
  id: string;
  username: string;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface BANTAnalysis {
  budget: string;
  authority: string;
  need: string;
  timeline: string;
}

export interface SentimentStage {
  stage: 'Introduction' | 'Discovery' | 'Pricing' | 'Closing';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  score: number; // -1 to +1
}

export interface SentimentShift {
  sentence: string;
  reason: string;
}

export interface SentimentAnalysis {
  overallScore: number; // -1 to +1
  classification: 'Positive' | 'Neutral' | 'Negative';
  stages: SentimentStage[];
  significantShifts: SentimentShift[];
  trend?: {
    direction: 'Improving' | 'Declining' | 'Stable';
    riskProbability: 'Low' | 'Medium' | 'High';
    reasons: string[];
  };
}

export interface EngagementMetrics {
  talkListenRatio: string; // e.g. "40:60"
  buyerParticipationPercent: number;
  buyerQuestionCount: number;
  interruptionPatterns: {
    whoInterruptsMore: string;
    toneSuggestion: string;
  };
}

export interface Objection {
  quote: string;
  category: 'Price' | 'Competitor' | 'Timing' | 'Trust' | 'Feature Gap' | 'Other';
  resolved: 'Yes' | 'Partially' | 'No';
  handlingQuality: 'Defensive' | 'Consultative' | 'Excellent';
}

export interface BuyingSignal {
  category: 'Budget' | 'Timeline' | 'Authority' | 'Competitive';
  quote: string;
  strength: 'Weak' | 'Moderate' | 'Strong';
  impactOnProbability: number; // percentage
}

export interface RepEffectiveness {
  scores: {
    discoveryDepth: number; // 0-10
    businessPainUnderstanding: number; // 0-10
    valueArticulation: number; // 0-10
    objectionHandlingQuality: number; // 0-10
    nextStepClarity: number; // 0-10
  };
  strengths: string[];
  improvementAreas: string[];
  coachingSuggestions: string[];
}

export interface RiskIndicator {
  type: 'Sentiment Drop' | 'Skepticism' | 'Vague Commitment' | 'Over-promising' | 'Confusion' | 'Compliance';
  description: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface RiskEngine {
  score: number; // 0-100
  ghostingProbability: number; // 0-100
  topRedFlags: string[];
  riskIncreaseStage: string;
  indicators: RiskIndicator[];
}

export interface MomentumEngine {
  score: number; // 0-100
  evidenceQuotes: string[];
  stageClassification: 'Early' | 'Mid' | 'Late';
  objections: Objection[];
  objectionResolutionRate: number; // percentage
  nextStepsDetected: string[];
}

export enum DealMomentum {
  NEW = 'New Deal',
  INCREASING = 'Increasing',
  STABLE = 'Stable',
  COOLING = 'Cooling',
  UNKNOWN = 'Unknown',
}

export enum VibeCategory {
  POSITIVE = 'Positive',
  NEGATIVE = 'Negative',
  NEUTRAL = 'Neutral',
  MIXED = 'Mixed',
  UNKNOWN = 'Unknown',
}

export enum CustomerCategory {
  ENTHUSIASTIC = 'Enthusiastic',
  POTENTIAL = 'Potential',
  NEEDS_ATTENTION = 'Needs Attention',
  GENERAL = 'General',
}

export interface Call {
  id: string;
  user_id: string;
  created_at: string;
  file_url: string;
  file_name: string;
  transcription: string;
  bant_budget: string;
  bant_authority: string;
  bant_need: string;
  bant_timeline: string;
  vibe_summary: string;
  deal_momentum: DealMomentum;
  vibe_category: VibeCategory;
  customer_id: string | null;
  customer_name: string | null;
  meeting_id: string | null;
  meeting_name: string | null;
  geography?: string;
  product?: string;
  unified_deal_health_score?: number;
  // Intelligence Branches
  sentiment_analysis?: SentimentAnalysis;
  engagement_metrics?: EngagementMetrics;
  momentum_engine?: MomentumEngine;
  buying_signals?: BuyingSignal[];
  rep_effectiveness?: RepEffectiveness;
  risk_engine?: RiskEngine;
  raw_gemini_response?: any;
}

export interface GeminiCallAnalysisResult {
  transcription: string;
  bant: BANTAnalysis;
  vibeSummary: string;
  dealMomentum: DealMomentum;
  vibeCategory: VibeCategory;
  sentiment: SentimentAnalysis;
  engagement: EngagementMetrics;
  momentum: MomentumEngine;
  buyingSignals: BuyingSignal[];
  repEffectiveness: RepEffectiveness;
  riskEngine: RiskEngine;
  unifiedDealHealthScore: number;
  geography: string;
  product: string;
  rawResponse: any;
}

export interface GlobalIntelligence {
  repeatedObjectionsByProduct: { product: string; objection: string; frequency: number }[];
  sentimentTrendsByGeography: { geography: string; sentimentScore: number; trend: 'Improving' | 'Declining' | 'Stable' }[];
  performanceVarianceByRepTenure: { tenureGroup: 'New Hire' | 'Mid-Level' | 'Senior'; avgScore: number }[];
  keywordSpikes: { keyword: string; count: number; changePercent: number }[];
}
