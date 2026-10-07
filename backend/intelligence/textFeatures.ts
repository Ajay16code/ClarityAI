import { SpeakerRole, TranscriptChunk, TranscriptSentence } from './types';

const QUESTION_PATTERNS = [
  /\?$/,
  /\b(can|could|would|should|when|what|why|how|who)\b/i,
];

const NEXT_STEP_PATTERNS = [
  /next step/i,
  /follow up/i,
  /schedule/i,
  /calendar/i,
  /let'?s meet/i,
];

const OBJECTION_PATTERNS = [
  /too expensive|price|cost|budget/i,
  /competitor|alternative|other vendor/i,
  /not now|later|timing|quarter/i,
  /security|compliance|risk/i,
];

const VALUE_PATTERNS = [
  /roi|impact|outcome|value|save time|revenue|efficiency/i,
];

const DISCOVERY_PATTERNS = [
  /pain|challenge|problem|bottleneck|goal|success metric|decision criteria/i,
];

const SKEPTICISM_PATTERNS = [
  /\bmaybe\b/i,
  /let'?s see/i,
  /send details/i,
  /we will review/i,
  /not sure/i,
];

export const countMatches = (text: string, patterns: RegExp[]): number => {
  if (!text) return 0;
  return patterns.reduce((acc, pattern) => (pattern.test(text) ? acc + 1 : acc), 0);
};

export const isQuestion = (text: string): boolean => countMatches(text, QUESTION_PATTERNS) > 0;
export const hasNextStepLanguage = (text: string): boolean => countMatches(text, NEXT_STEP_PATTERNS) > 0;
export const hasObjectionLanguage = (text: string): boolean => countMatches(text, OBJECTION_PATTERNS) > 0;
export const hasValueLanguage = (text: string): boolean => countMatches(text, VALUE_PATTERNS) > 0;
export const hasDiscoveryLanguage = (text: string): boolean => countMatches(text, DISCOVERY_PATTERNS) > 0;

export const detectSkepticismPhrases = (sentences: TranscriptSentence[]): string[] => {
  const phrases: string[] = [];
  for (const s of sentences) {
    if (countMatches(s.text, SKEPTICISM_PATTERNS) > 0) {
      phrases.push(s.text);
    }
  }
  return phrases.slice(0, 8);
};

export const roleSeconds = (sentences: TranscriptSentence[], role: SpeakerRole): number => {
  return sentences
    .filter((s) => s.speakerRole === role)
    .reduce((acc, s) => acc + Math.max(0, s.endSec - s.startSec), 0);
};

export const computeInterruptionCount = (sentences: TranscriptSentence[]): number => {
  if (sentences.length < 2) return 0;
  const sorted = [...sentences].sort((a, b) => a.startSec - b.startSec);
  let overlaps = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].startSec < sorted[i - 1].endSec && sorted[i].speakerId !== sorted[i - 1].speakerId) {
      overlaps += 1;
    }
  }
  return overlaps;
};

export const chunkTranscript = (
  sentences: TranscriptSentence[],
  sentimentScore: number,
  chunkSizeSec = 120
): TranscriptChunk[] => {
  if (sentences.length === 0) return [];
  const sorted = [...sentences].sort((a, b) => a.startSec - b.startSec);
  const chunks: TranscriptChunk[] = [];

  let currentStart = sorted[0].startSec;
  let currentEnd = currentStart + chunkSizeSec;
  let bucket: TranscriptSentence[] = [];

  for (const sentence of sorted) {
    if (sentence.startSec <= currentEnd) {
      bucket.push(sentence);
      continue;
    }

    chunks.push({
      index: chunks.length,
      startSec: currentStart,
      endSec: currentEnd,
      text: bucket.map((s) => s.text).join(' ').slice(0, 1200),
      sentimentScore,
    });

    currentStart = sentence.startSec;
    currentEnd = currentStart + chunkSizeSec;
    bucket = [sentence];
  }

  if (bucket.length > 0) {
    chunks.push({
      index: chunks.length,
      startSec: currentStart,
      endSec: currentEnd,
      text: bucket.map((s) => s.text).join(' ').slice(0, 1200),
      sentimentScore,
    });
  }

  return chunks;
};
