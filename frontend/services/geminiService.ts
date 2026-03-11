
import { GoogleGenAI, Type } from '@google/genai';
import { BANTAnalysis, Call, DealMomentum, GeminiCallAnalysisResult, VibeCategory } from '../types'; // Import VibeCategory
import { GEMINI_MODEL_ID } from '../constants';

const FALLBACK_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const extractErrorMessage = (error: any): string => {
  if (!error) return 'Unknown Gemini error';
  if (typeof error === 'string') return error;
  if (error.message) return String(error.message);
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown Gemini error';
  }
};

const isQuotaExceededError = (error: any): boolean => {
  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('rate limit') ||
    message.includes('429')
  );
};

const isModelAvailabilityError = (error: any): boolean => {
  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes('model') && (
      message.includes('not found') ||
      message.includes('not supported') ||
      message.includes('not available') ||
      message.includes('permission denied')
    )
  );
};

const isPayloadTooLargeError = (error: any): boolean => {
  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes('maximum allowed size') ||
    message.includes('object exceeded') ||
    message.includes('payload too large') ||
    message.includes('request too large') ||
    message.includes('input too large')
  );
};

const getRetryDelayMs = (error: any): number => {
  const message = extractErrorMessage(error);
  const retryMatch = message.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i);
  if (retryMatch) {
    return Math.max(1500, Math.ceil(Number(retryMatch[1]) * 1000));
  }
  return 2000;
};

const getGeminiModelCandidates = (): string[] => {
  const configuredModel =
    import.meta.env.VITE_GEMINI_MODEL_ID ||
    GEMINI_MODEL_ID;

  return Array.from(new Set([configuredModel, ...FALLBACK_GEMINI_MODELS].filter(Boolean)));
};

interface GeminiStructuredResponse {
  transcription: string;
  budget: string;
  authority: string;
  need: string;
  timeline: string;
  vibeSummary: string;
  sentiment: {
    overallScore: number;
    classification: 'Positive' | 'Neutral' | 'Negative';
    stages: { stage: 'Introduction' | 'Discovery' | 'Pricing' | 'Closing'; sentiment: 'Positive' | 'Neutral' | 'Negative'; score: number; }[];
    significantShifts: { sentence: string; reason: string; }[];
  };
  engagement: {
    talkListenRatio: string;
    buyerParticipationPercent: number;
    buyerQuestionCount: number;
    interruptionPatterns: { whoInterruptsMore: string; toneSuggestion: string; };
  };
  momentum: {
    score: number;
    evidenceQuotes: string[];
    stageClassification: 'Early' | 'Mid' | 'Late';
    objections: { quote: string; category: 'Price' | 'Competitor' | 'Timing' | 'Trust' | 'Feature Gap' | 'Other'; resolved: 'Yes' | 'Partially' | 'No'; handlingQuality: 'Defensive' | 'Consultative' | 'Excellent'; }[];
    objectionResolutionRate: number;
    nextStepsDetected: string[];
  };
  buyingSignals: {
    category: 'Budget' | 'Timeline' | 'Authority' | 'Competitive';
    quote: string;
    strength: 'Weak' | 'Moderate' | 'Strong';
    impactOnProbability: number;
  }[];
  repEffectiveness: {
    scores: {
      discoveryDepth: number;
      businessPainUnderstanding: number;
      valueArticulation: number;
      objectionHandlingQuality: number;
      nextStepClarity: number;
    };
    strengths: string[];
    improvementAreas: string[];
    coachingSuggestions: string[];
  };
  riskEngine: {
    score: number;
    ghostingProbability: number;
    topRedFlags: string[];
    riskIncreaseStage: string;
    indicators: {
      type: 'Sentiment Drop' | 'Skepticism' | 'Vague Commitment' | 'Over-promising' | 'Confusion' | 'Compliance';
      description: string;
      severity: 'Low' | 'Medium' | 'High';
    }[];
  };
  unifiedDealHealthScore: number;
  geography: string;
  product: string;
}

const clampText = (value: unknown, fallback: string, maxLen = 2000): string => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    return fallback;
  }
  return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
};

const asNumber = (value: unknown, fallback: number): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const asStringArray = (value: unknown, maxItems = 8): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, maxItems);
};

const cleanJsonText = (raw: string): string => {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return text.trim();
};

const parseGeminiJson = (raw: string): any => {
  const cleaned = cleanJsonText(raw);

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const candidate = cleaned.slice(start, end + 1);
      return JSON.parse(candidate);
    }
    throw new Error('Gemini returned malformed JSON payload.');
  }
};

const normalizeGeminiResponse = (raw: any): GeminiStructuredResponse => {
  const sentimentClassification: 'Positive' | 'Neutral' | 'Negative' = ['Positive', 'Neutral', 'Negative'].includes(raw?.sentiment?.classification)
    ? raw.sentiment.classification
    : 'Neutral';

  const stageClassification: 'Early' | 'Mid' | 'Late' = ['Early', 'Mid', 'Late'].includes(raw?.momentum?.stageClassification)
    ? raw.momentum.stageClassification
    : 'Mid';

  return {
    transcription: clampText(raw?.transcription, 'Summary unavailable from transcription.'),
    budget: clampText(raw?.budget, 'Not discussed', 500),
    authority: clampText(raw?.authority, 'Not discussed', 500),
    need: clampText(raw?.need, 'Not clear', 500),
    timeline: clampText(raw?.timeline, 'Not discussed', 500),
    vibeSummary: clampText(raw?.vibeSummary, 'Summary unavailable.', 800),
    sentiment: {
      overallScore: asNumber(raw?.sentiment?.overallScore, 0),
      classification: sentimentClassification,
      stages: Array.isArray(raw?.sentiment?.stages) ? raw.sentiment.stages.slice(0, 4) : [],
      significantShifts: Array.isArray(raw?.sentiment?.significantShifts) ? raw.sentiment.significantShifts.slice(0, 5) : [],
    },
    engagement: {
      talkListenRatio: clampText(raw?.engagement?.talkListenRatio, '50:50', 50),
      buyerParticipationPercent: asNumber(raw?.engagement?.buyerParticipationPercent, 50),
      buyerQuestionCount: asNumber(raw?.engagement?.buyerQuestionCount, 0),
      interruptionPatterns: {
        whoInterruptsMore: clampText(raw?.engagement?.interruptionPatterns?.whoInterruptsMore, 'N/A', 120),
        toneSuggestion: clampText(raw?.engagement?.interruptionPatterns?.toneSuggestion, 'N/A', 240),
      },
    },
    momentum: {
      score: asNumber(raw?.momentum?.score, 50),
      evidenceQuotes: asStringArray(raw?.momentum?.evidenceQuotes, 5),
      stageClassification,
      objections: Array.isArray(raw?.momentum?.objections) ? raw.momentum.objections.slice(0, 6) : [],
      objectionResolutionRate: asNumber(raw?.momentum?.objectionResolutionRate, 0),
      nextStepsDetected: asStringArray(raw?.momentum?.nextStepsDetected, 6),
    },
    buyingSignals: Array.isArray(raw?.buyingSignals) ? raw.buyingSignals.slice(0, 8) : [],
    repEffectiveness: {
      scores: {
        discoveryDepth: asNumber(raw?.repEffectiveness?.scores?.discoveryDepth, 0),
        businessPainUnderstanding: asNumber(raw?.repEffectiveness?.scores?.businessPainUnderstanding, 0),
        valueArticulation: asNumber(raw?.repEffectiveness?.scores?.valueArticulation, 0),
        objectionHandlingQuality: asNumber(raw?.repEffectiveness?.scores?.objectionHandlingQuality, 0),
        nextStepClarity: asNumber(raw?.repEffectiveness?.scores?.nextStepClarity, 0),
      },
      strengths: asStringArray(raw?.repEffectiveness?.strengths, 6),
      improvementAreas: asStringArray(raw?.repEffectiveness?.improvementAreas, 6),
      coachingSuggestions: asStringArray(raw?.repEffectiveness?.coachingSuggestions, 6),
    },
    riskEngine: {
      score: asNumber(raw?.riskEngine?.score, 0),
      ghostingProbability: asNumber(raw?.riskEngine?.ghostingProbability, 0),
      topRedFlags: asStringArray(raw?.riskEngine?.topRedFlags, 5),
      riskIncreaseStage: clampText(raw?.riskEngine?.riskIncreaseStage, 'N/A', 120),
      indicators: Array.isArray(raw?.riskEngine?.indicators) ? raw.riskEngine.indicators.slice(0, 6) : [],
    },
    unifiedDealHealthScore: asNumber(raw?.unifiedDealHealthScore, 50),
    geography: clampText(raw?.geography, 'Unknown', 120),
    product: clampText(raw?.product, 'Unknown', 120),
  };
};

async function runCompactFallbackAnalysis(
  ai: GoogleGenAI,
  contentParts: GeminiContentPart[],
  previousCalls: Call[]
): Promise<GeminiStructuredResponse> {
  const compactContext = previousCalls.slice(0, 2).map((call, idx) => (
    `Prev ${idx + 1}: sentiment=${call.sentiment_analysis?.classification || 'N/A'}, momentum=${call.momentum_engine?.score || 'N/A'}, vibe=${call.vibe_summary?.slice(0, 120) || 'N/A'}`
  )).join('\n');

  const compactPrompt = `Return strict VALID JSON only. Keep output concise to avoid truncation.
Rules:
- transcription must be a concise summary (max 1200 chars), not full verbatim transcript.
- Keep arrays short: nextStepsDetected<=5, topRedFlags<=5.
- Avoid long quotes.

${compactContext ? `Previous context:\n${compactContext}\n` : ''}
Analyze the provided call content and return JSON for sales intelligence.`;

  const parts = [...contentParts, { text: compactPrompt }];
  const models = getGeminiModelCandidates();
  let lastError: any = null;

  for (const modelId of models) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts },
        config: {
          systemInstruction: 'You are ClarityIQ compact fallback analyzer. Return only strict JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcription: { type: Type.STRING },
              budget: { type: Type.STRING },
              authority: { type: Type.STRING },
              need: { type: Type.STRING },
              timeline: { type: Type.STRING },
              vibeSummary: { type: Type.STRING },
              sentiment: {
                type: Type.OBJECT,
                properties: {
                  overallScore: { type: Type.NUMBER },
                  classification: { type: Type.STRING }
                }
              },
              momentum: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER },
                  stageClassification: { type: Type.STRING },
                  nextStepsDetected: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              riskEngine: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER },
                  topRedFlags: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              unifiedDealHealthScore: { type: Type.NUMBER },
              geography: { type: Type.STRING },
              product: { type: Type.STRING }
            },
            required: ['transcription', 'vibeSummary']
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) {
        throw new Error('Compact fallback returned empty response.');
      }

      return normalizeGeminiResponse(parseGeminiJson(jsonStr));
    } catch (error: any) {
      lastError = error;
    }
  }

  throw new Error(`Compact fallback failed: ${extractErrorMessage(lastError)}`);
}

/**
 * Converts a Blob or File to a Base64 string.
 * @param file The File or Blob object to convert.
 * @returns A Promise that resolves with the Base64 string of the file.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // The result is in the format "data:audio/wav;base64,..."
      // We only need the base64 part after the comma
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Categorizes a raw vibe summary string into a VibeCategory enum.
 * @param vibeSummary The raw vibe summary string from Gemini.
 * @returns A VibeCategory enum value.
 */
export function categorizeVibe(vibeSummary: string): VibeCategory {
  const lowerVibe = vibeSummary.toLowerCase();
  const positiveKeywords = ['positive', 'excitement', 'optimistic', 'enthusiastic', 'strong interest', 'promising', 'upbeat'];
  const negativeKeywords = ['negative', 'skepticism', 'concern', 'hesitation', 'objection', 'cooling', 'challenges', 'doubt'];
  const neutralKeywords = ['neutral', 'stable', 'calm', 'informative', 'factual', 'balanced'];

  const hasPositive = positiveKeywords.some(keyword => lowerVibe.includes(keyword));
  const hasNegative = negativeKeywords.some(keyword => lowerVibe.includes(keyword));
  const hasNeutral = neutralKeywords.some(keyword => lowerVibe.includes(keyword));

  if (hasPositive && !hasNegative && !hasNeutral) return VibeCategory.POSITIVE;
  if (hasNegative && !hasPositive && !hasNeutral) return VibeCategory.NEGATIVE;
  if (hasPositive && hasNegative) return VibeCategory.MIXED; // Contradictory signals
  if (hasNeutral && !hasPositive && !hasNegative) return VibeCategory.NEUTRAL;
  if (hasPositive || hasNegative) return VibeCategory.MIXED; // At least one strong signal, but not exclusively positive/negative
  
  return VibeCategory.UNKNOWN; // Default if no clear category
}


/**
 * Determines the deal momentum by comparing the current call's vibe with previous calls.
 * This is a simplified client-side logic. In a real application, this would involve more sophisticated AI prompting.
 * @param currentVibeCategory The vibe category of the current call.
 * @param previousCalls An array of previous calls.
 * @returns A DealMomentum enum value.
 */
function determineDealMomentum(currentVibeCategory: VibeCategory, previousCalls: Call[]): DealMomentum {
  if (previousCalls.length === 0) {
    return DealMomentum.NEW;
  }

  // Simple heuristic based on vibe categories of the last call
  const lastCall = previousCalls[0]; // Assuming previousCalls are sorted by most recent first
  const lastVibeCategory = lastCall.vibe_category;

  if (currentVibeCategory === VibeCategory.POSITIVE && lastVibeCategory !== VibeCategory.POSITIVE) {
    return DealMomentum.INCREASING;
  } else if (currentVibeCategory === VibeCategory.NEGATIVE && lastVibeCategory !== VibeCategory.NEGATIVE) {
    return DealMomentum.COOLING;
  } else if (currentVibeCategory === lastVibeCategory) {
    return DealMomentum.STABLE;
  } else if (currentVibeCategory === VibeCategory.NEUTRAL && lastVibeCategory !== VibeCategory.NEUTRAL) {
    return DealMomentum.STABLE; // Neutralizing from a non-neutral state implies stabilization
  }

  return DealMomentum.UNKNOWN; // Fallback
}

/**
 * Common interface for content parts that can be sent to Gemini.
 */
interface GeminiContentPart {
  inlineData?: {
    mimeType: string;
    data: string;
  };
  text?: string;
}

/**
 * Analyzes content (audio, text, or a mix) using the Gemini API.
 * This function is generalized to handle different input types.
 * @param contentParts An array of content parts for the Gemini API.
 * @param previousCalls An array of the last 3 calls for deal momentum context.
 * @returns A Promise resolving to GeminiCallAnalysisResult.
 */
async function processContentWithGemini(
  contentParts: GeminiContentPart[],
  previousCalls: Call[]
): Promise<GeminiCallAnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  let systemInstruction = `You are an expert sales intelligence AI named ClarityIQ. Your task is to analyze sales call content to extract deep intelligence across six main branches:
1. Sentiment & Emotional Intelligence: Overall sentiment, stage-by-stage sentiment, and significant emotional shifts.
2. Buyer Engagement Intelligence: Talk-to-listen ratio, participation rates, and interruption patterns.
3. Deal Health & Momentum Engine: Momentum score, objection handling, and next-step detection.
4. Buying Signal Detection: Budget, Timeline, Authority, and Competitive signals with evidence quotes and impact on deal probability.
5. Rep Effectiveness Intelligence: Scoring discovery depth, value articulation, objection handling, and next-step clarity.
6. Risk & Early Warning Engine: Identifying sentiment drops, skepticism, ghosting probability, and red flags.
7. Unified Deal Health Score: A single score (0-100) representing the overall health of the deal based on all factors.
8. Metadata Extraction: Identify the Geography and Product discussed in the call.

Also extract BANT details (Budget, Authority, Need, Timeline) and a concise transcript summary.`;

  let userPromptBase = `Analyze the following call content and provide a detailed sales intelligence report.

1. Sentiment & Emotional Intelligence:
   - Overall sentiment score (-1 to +1)
   - Classification (Positive / Neutral / Negative)
   - Sentiment per stage: Introduction, Discovery, Pricing, Closing.
   - Highlight exact sentences where sentiment shifts significantly and explain why.

2. Buyer Engagement Intelligence:
   - Calculate talk-to-listen ratio (Rep : Buyer)
   - Estimate buyer participation %
   - Count buyer-initiated questions
   - Identify interruption patterns (who interrupts more, tone suggested).

3. Deal Health & Momentum Engine:
   - Momentum score (0-100) based on next steps, scheduling language, and internal alignment.
   - Evidence quotes for the momentum score.
   - Stage classification (Early / Mid / Late stage).
   - Identify all objections. For each: quote it, categorize (Price, Competitor, Timing, Trust, Feature Gap, Other), check if resolved (Yes/Partially/No), and rate handling quality (Defensive / Consultative / Excellent).
   - Calculate objection resolution rate (%).
   - Detect specific next steps.

4. Buying Signal Detection:
   - Extract signals for Budget, Timeline, Authority, and Competitive pressure.
   - For each: quote evidence, rate strength (Weak/Moderate/Strong), and estimate impact on deal probability (%).

5. Rep Effectiveness Intelligence:
   - Score (0-10) for: Discovery depth, Business pain understanding, Value articulation, Objection handling quality, Next-step clarity.
   - List strengths, improvement areas, and coaching suggestions.

6. Risk & Early Warning Engine:
   - Detect sentiment drops, skepticism, vague commitments, over-promising, confusion, and compliance risks.
   - Provide a Risk score (0-100), Ghosting probability (0-100), Top 5 red flags, and the stage where risk increases.

7. Unified Deal Health Score:
   - Provide a single score (0-100) that integrates all the above engines.

8. Metadata:
   - Identify the Geography (e.g., North America, EMEA, APAC) and Product discussed.

9. BANT & Transcript Summary:
   - Extract Budget, Authority, Need, and Timeline.
  - Provide a concise transcript summary (max 1200 characters, not full verbatim text).

10. Output Size Guardrails:
  - Keep lists concise (maximum 5 items per array where possible).
  - Keep each quote or sentence short.

Provide your response in a structured JSON format.`;

  let userPrompt = userPromptBase;
  if (previousCalls && previousCalls.length > 0) {
    const previousContext = previousCalls.map((call, index) =>
      `--- Previous Call ${previousCalls.length - index} (ID: ${call.id}) ---\n` +
      `Transcription Snippet: "${call.transcription.substring(0, Math.min(call.transcription.length, 200))}..."\n` +
      `Sentiment Score: ${call.sentiment_analysis?.overallScore || 'N/A'}\n` +
      `Momentum Score: ${call.momentum_engine?.score || 'N/A'}\n` +
      `BANT: Budget: ${call.bant_budget}, Authority: ${call.bant_authority}, Need: ${call.bant_need}, Timeline: ${call.bant_timeline}\n`
    ).join('\n');

    userPrompt = `Given the historical context of previous calls below, and the new content:
${previousContext}
--- Current Content ---
${userPromptBase}
Compare the sentiment of the current call with historical calls. Provide sentiment shift direction (Improving / Declining / Stable) and risk probability (Low / Medium / High) in the sentiment trend section.
`;
  }

  try {
    const parts = [...contentParts]; // Create a mutable copy of contentParts
    parts.push({ text: userPrompt }); // Add the user prompt as a text part

    let response: any = null;
    let lastModelError: any = null;

    const modelCandidates = getGeminiModelCandidates();
    const requestPayload = {
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING },
            budget: { type: Type.STRING },
            authority: { type: Type.STRING },
            need: { type: Type.STRING },
            timeline: { type: Type.STRING },
            vibeSummary: { type: Type.STRING },
            sentiment: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.NUMBER },
                classification: { type: Type.STRING },
                stages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      stage: { type: Type.STRING },
                      sentiment: { type: Type.STRING },
                      score: { type: Type.NUMBER }
                    }
                  }
                },
                significantShifts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sentence: { type: Type.STRING },
                      reason: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            engagement: {
              type: Type.OBJECT,
              properties: {
                talkListenRatio: { type: Type.STRING },
                buyerParticipationPercent: { type: Type.NUMBER },
                buyerQuestionCount: { type: Type.NUMBER },
                interruptionPatterns: {
                  type: Type.OBJECT,
                  properties: {
                    whoInterruptsMore: { type: Type.STRING },
                    toneSuggestion: { type: Type.STRING }
                  }
                }
              }
            },
            momentum: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                evidenceQuotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                stageClassification: { type: Type.STRING },
                objections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      quote: { type: Type.STRING },
                      category: { type: Type.STRING },
                      resolved: { type: Type.STRING },
                      handlingQuality: { type: Type.STRING }
                    }
                  }
                },
                objectionResolutionRate: { type: Type.NUMBER },
                nextStepsDetected: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            buyingSignals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  quote: { type: Type.STRING },
                  strength: { type: Type.STRING },
                  impactOnProbability: { type: Type.NUMBER }
                }
              }
            },
            repEffectiveness: {
              type: Type.OBJECT,
              properties: {
                scores: {
                  type: Type.OBJECT,
                  properties: {
                    discoveryDepth: { type: Type.NUMBER },
                    businessPainUnderstanding: { type: Type.NUMBER },
                    valueArticulation: { type: Type.NUMBER },
                    objectionHandlingQuality: { type: Type.NUMBER },
                    nextStepClarity: { type: Type.NUMBER }
                  }
                },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
                coachingSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            riskEngine: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                ghostingProbability: { type: Type.NUMBER },
                topRedFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
                riskIncreaseStage: { type: Type.STRING },
                indicators: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      description: { type: Type.STRING },
                      severity: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            unifiedDealHealthScore: { type: Type.NUMBER },
            geography: { type: Type.STRING },
            product: { type: Type.STRING }
          },
          required: ['transcription', 'budget', 'authority', 'need', 'timeline', 'vibeSummary', 'sentiment', 'engagement', 'momentum', 'buyingSignals', 'repEffectiveness', 'riskEngine', 'unifiedDealHealthScore', 'geography', 'product'],
        },
      },
    };

    for (const modelId of modelCandidates) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelId,
            ...requestPayload,
          });
          break;
        } catch (error: any) {
          lastModelError = error;
          const quotaError = isQuotaExceededError(error);

          if (quotaError && attempt === 1) {
            await delay(getRetryDelayMs(error));
            continue;
          }

          if (quotaError || isModelAvailabilityError(error)) {
            break;
          }

          throw error;
        }
      }

      if (response) {
        break;
      }
    }

    if (!response) {
      throw new Error(`Unable to get Gemini response from available models: ${extractErrorMessage(lastModelError)}`);
    }

    const jsonStr = response.text?.trim(); // Use optional chaining for text
    if (!jsonStr) {
      throw new Error("Gemini returned an empty response.");
    }
    let parsedResponse: GeminiStructuredResponse;
    try {
      parsedResponse = normalizeGeminiResponse(parseGeminiJson(jsonStr));
    } catch (parseError: any) {
      console.warn('Primary Gemini JSON parse failed. Running compact fallback analysis.', parseError);
      parsedResponse = await runCompactFallbackAnalysis(ai, contentParts, previousCalls);
    }

    const bant: BANTAnalysis = {
      budget: parsedResponse.budget,
      authority: parsedResponse.authority,
      need: parsedResponse.need,
      timeline: parsedResponse.timeline,
    };

    const vibeCategory = categorizeVibe(parsedResponse.vibeSummary); // Categorize the vibe
    const dealMomentum = determineDealMomentum(vibeCategory, previousCalls); // Use vibeCategory for momentum

    return {
      transcription: parsedResponse.transcription,
      bant,
      vibeSummary: parsedResponse.vibeSummary,
      dealMomentum,
      vibeCategory, // Include vibeCategory
      sentiment: parsedResponse.sentiment,
      engagement: parsedResponse.engagement,
      momentum: parsedResponse.momentum,
      buyingSignals: parsedResponse.buyingSignals,
      repEffectiveness: parsedResponse.repEffectiveness,
      riskEngine: parsedResponse.riskEngine,
      unifiedDealHealthScore: parsedResponse.unifiedDealHealthScore,
      geography: parsedResponse.geography,
      product: parsedResponse.product,
      rawResponse: response,
    };
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    const errorMessage = extractErrorMessage(error);
    if (errorMessage.includes("API key not found")) {
      alert("Gemini API Key is not set. Please ensure VITE_GEMINI_API_KEY is configured.");
      throw new Error('Gemini API key is missing or invalid.');
    }
    if (isQuotaExceededError(error)) {
      throw new Error('Gemini quota exceeded for current account/models. Add billing, wait for quota reset, or set VITE_GEMINI_MODEL_ID to a lower-cost model like gemini-2.5-flash.');
    }
    if (isPayloadTooLargeError(error)) {
      throw new Error('Meeting content is too large for single-pass analysis. Please split audio into smaller chunks (around 20-30 minutes each) and upload sequentially.');
    }
    throw new Error(`Failed to analyze content with Gemini: ${errorMessage}`);
  }
}

/**
 * Analyzes an audio file using the Gemini API.
 * Extracts transcription, BANT (Budget, Authority, Need, Timeline), and a 'vibe' summary.
 * Incorporates context from previous calls for deal momentum analysis.
 * @param base64Audio The base64 encoded audio string.
 * @param mimeType The MIME type of the audio file (e.g., 'audio/wav', 'audio/mpeg').
 * @param previousCalls An array of the last 3 calls for the client to provide context for deal arc analysis.
 * @returns A Promise resolving to GeminiCallAnalysisResult.
 */
export async function analyzeAudioContent(
  base64Audio: string,
  mimeType: string,
  previousCalls: Call[]
): Promise<GeminiCallAnalysisResult> {
  const contentParts: GeminiContentPart[] = [
    { inlineData: { mimeType, data: base64Audio } },
  ];
  return processContentWithGemini(contentParts, previousCalls);
}

/**
 * Analyzes plain text content using the Gemini API.
 * Extracts transcription (the text itself), BANT, and a 'vibe' summary.
 * Incorporates context from previous calls for deal momentum analysis.
 * @param plainText The plain text content.
 * @param previousCalls An array of the last 3 calls for deal momentum context.
 * @returns A Promise resolving to GeminiCallAnalysisResult.
 */
export async function analyzeTextContent(
  plainText: string,
  previousCalls: Call[]
): Promise<GeminiCallAnalysisResult> {
  const contentParts: GeminiContentPart[] = [
    { text: plainText },
  ];
  return processContentWithGemini(contentParts, previousCalls);
}

/**
 * Processes JSON content. It attempts to extract pre-analyzed data (transcription, BANT, vibeSummary)
 * if the JSON structure matches `GeminiCallAnalysisResult`. If not, it looks for a raw text field
 * (`transcript`, `text`, `content`) and sends it to Gemini for analysis.
 * @param jsonText The JSON content as a string.
 * @param previousCalls An array of the last 3 calls for deal momentum context.
 * @returns A Promise resolving to GeminiCallAnalysisResult.
 */
export async function analyzeJsonContent(
  jsonText: string,
  previousCalls: Call[]
): Promise<GeminiCallAnalysisResult> {
  try {
    const parsedJson = JSON.parse(jsonText);

    // Scenario 1: JSON already contains full analysis (transcription, BANT, vibeSummary, dealMomentum)
    // This assumes the JSON structure matches the expected output or similar fully analyzed format.
    if (parsedJson.transcription && parsedJson.bant && parsedJson.vibeSummary) {
      const bant: BANTAnalysis = {
        budget: parsedJson.bant.budget || 'Not discussed',
        authority: parsedJson.bant.authority || 'Not discussed',
        need: parsedJson.bant.need || 'Not clear',
        timeline: parsedJson.bant.timeline || 'Not discussed',
      };
      
      const vibeCategory = parsedJson.vibeCategory || categorizeVibe(parsedJson.vibeSummary);
      // If dealMomentum is missing from JSON, determine it based on vibe and previous calls
      const dealMomentum = parsedJson.dealMomentum || determineDealMomentum(vibeCategory, previousCalls);

      return {
        transcription: parsedJson.transcription,
        bant,
        vibeSummary: parsedJson.vibeSummary,
        dealMomentum,
        vibeCategory,
        sentiment: parsedJson.sentiment || { overallScore: 0, classification: 'Neutral', stages: [], significantShifts: [] },
        engagement: parsedJson.engagement || { talkListenRatio: '50:50', buyerParticipationPercent: 50, buyerQuestionCount: 0, interruptionPatterns: { whoInterruptsMore: 'N/A', toneSuggestion: 'N/A' } },
        momentum: parsedJson.momentum || { score: 50, evidenceQuotes: [], stageClassification: 'Mid', objections: [], objectionResolutionRate: 0, nextStepsDetected: [] },
        buyingSignals: parsedJson.buyingSignals || [],
        repEffectiveness: parsedJson.repEffectiveness || { scores: { discoveryDepth: 0, businessPainUnderstanding: 0, valueArticulation: 0, objectionHandlingQuality: 0, nextStepClarity: 0 }, strengths: [], improvementAreas: [], coachingSuggestions: [] },
        riskEngine: parsedJson.riskEngine || { score: 0, ghostingProbability: 0, topRedFlags: [], riskIncreaseStage: 'N/A', indicators: [] },
        unifiedDealHealthScore: parsedJson.unifiedDealHealthScore || 50,
        geography: parsedJson.geography || 'Unknown',
        product: parsedJson.product || 'Unknown',
        rawResponse: parsedJson,
      };
    }

    // Scenario 2: JSON contains a field with raw text that needs to be analyzed by Gemini
    // Look for common fields like 'transcript', 'text', 'content'
    const rawTextToAnalyze = parsedJson.transcript || parsedJson.text || parsedJson.content || '';

    if (rawTextToAnalyze && typeof rawTextToAnalyze === 'string') {
      return analyzeTextContent(rawTextToAnalyze, previousCalls);
    }

    // Fallback if JSON is not in expected format or lacks analysable text
    throw new Error('JSON file does not contain a recognizable transcription or text content for analysis.');

  } catch (error: any) {
    console.error('Error parsing or analyzing JSON:', error);
    throw new Error(`Failed to process JSON content: ${error.message}`);
  }
}

/**
 * Analyzes a collection of call summaries to detect macro-level patterns.
 * @param calls An array of calls to analyze.
 * @param adminDefinedTerms A list of keywords to track for spikes.
 * @returns A Promise resolving to GlobalIntelligence.
 */
export async function analyzeGlobalPatterns(
  calls: Call[],
  adminDefinedTerms: string[]
): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  const callSummaries = calls.map(c => ({
    id: c.id,
    vibeSummary: c.vibe_summary,
    product: c.product,
    geography: c.geography,
    objections: c.momentum_engine?.objections.map(o => o.quote),
    sentimentScore: c.sentiment_analysis?.overallScore,
    repEffectiveness: c.rep_effectiveness?.scores,
    transcriptionSnippet: c.transcription.substring(0, 500)
  }));

  const systemInstruction = `You are a macro-level sales intelligence analyst. Your task is to analyze multiple call summaries and identify patterns across geography, product, and rep performance.`;

  const prompt = `Analyze the following call summaries and extract macro-level sales intelligence patterns.
  
  Detect:
  1. Repeated objections categorized by product.
  2. Sentiment trends categorized by geography.
  3. Performance variance by rep tenure (New Hire, Mid-Level, Senior). Note: Categorize reps into these groups based on their performance consistency and discovery depth if tenure is not explicitly provided.
  4. Spikes in these predefined keywords: ${adminDefinedTerms.join(', ')}.
  
  Call Summaries:
  ${JSON.stringify(callSummaries)}
  
  Return the result in a structured JSON format matching the following schema:
  {
    "repeatedObjectionsByProduct": [ { "product": string, "objection": string, "frequency": number } ],
    "sentimentTrendsByGeography": [ { "geography": string, "sentimentScore": number, "trend": "Improving" | "Declining" | "Stable" } ],
    "performanceVarianceByRepTenure": [ { "tenureGroup": "New Hire" | "Mid-Level" | "Senior", "avgScore": number } ],
    "keywordSpikes": [ { "keyword": string, "count": number, "changePercent": number } ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_ID,
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("Gemini returned an empty response for global patterns.");
    }
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error('Error calling Gemini API for global patterns:', error);
    throw new Error(`Failed to analyze global patterns: ${error.message}`);
  }
}
