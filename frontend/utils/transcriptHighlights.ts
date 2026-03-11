const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by', 'for', 'from', 'had', 'has', 'have',
  'he', 'her', 'here', 'him', 'his', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'me', 'my', 'no', 'not', 'of',
  'on', 'or', 'our', 'ours', 'she', 'so', 'that', 'the', 'their', 'them', 'there', 'they', 'this', 'to', 'too',
  'us', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'who', 'will', 'with', 'would', 'you', 'your',
  'yeah', 'okay', 'ok', 'right', 'um', 'uh', 'hmm', 'like', 'just', 'actually', 'basically'
]);

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const splitSentences = (text: string): string[] => {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) {
    return [];
  }

  return cleaned
    .replace(/\s*\n\s*/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
};

export const getTranscriptSummary = (text: string, maxSentences = 2, maxChars = 320): string => {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return 'No transcript available.';
  }

  const summaryParts: string[] = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    if (summaryParts.length >= maxSentences) {
      break;
    }

    const sentenceLength = sentence.length + (summaryParts.length > 0 ? 1 : 0);
    if (currentLength + sentenceLength > maxChars && summaryParts.length > 0) {
      break;
    }

    summaryParts.push(sentence);
    currentLength += sentenceLength;
  }

  const summary = summaryParts.join(' ').trim();
  return summary || sentences[0].slice(0, maxChars).trim();
};

export const extractTranscriptKeywords = (text: string, maxKeywords = 8): string[] => {
  const normalized = normalizeWhitespace(text).toLowerCase();
  if (!normalized) {
    return [];
  }

  const tokens = normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !/^\d+$/.test(token))
    .filter((token) => !STOP_WORDS.has(token));

  const frequency = new Map<string, number>();
  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) || 0) + 1);
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxKeywords)
    .map(([word]) => word);
};

export interface TranscriptHighlights {
  summary: string;
  keywords: string[];
  keywordLine: string;
  searchableText: string;
}

export const getTranscriptHighlights = (text: string): TranscriptHighlights => {
  const summary = getTranscriptSummary(text);
  const keywords = extractTranscriptKeywords(text);
  const keywordLine = keywords.join(', ');

  return {
    summary,
    keywords,
    keywordLine,
    searchableText: `${summary} ${keywordLine}`.trim().toLowerCase(),
  };
};
