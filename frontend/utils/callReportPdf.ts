import { jsPDF } from 'jspdf';
import { Call } from '../types';
import { getTranscriptHighlights } from './transcriptHighlights';

const PAGE_MARGIN = 14;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const BOTTOM_LIMIT = 282;

const asText = (value: unknown, fallback = 'N/A') => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
};

const toFilenameBase = (fileName: string) => {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, '');
  return withoutExtension.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'call-report';
};

export const downloadCallReportPdf = (call: Call) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const transcriptHighlights = getTranscriptHighlights(call.transcription);
  let y = PAGE_MARGIN;

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight > BOTTOM_LIMIT) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  const writeWrapped = (text: string, fontSize = 10, lineHeight = 5, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    ensureSpace(lines.length * lineHeight);
    doc.text(lines, PAGE_MARGIN, y);
    y += lines.length * lineHeight;
  };

  const addGap = (size = 3) => {
    y += size;
  };

  const addSection = (title: string) => {
    ensureSpace(10);
    addGap(2);
    doc.setDrawColor(220);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + CONTENT_WIDTH, y);
    y += 4;
    writeWrapped(title, 12, 6, true);
    addGap(1);
  };

  const addKeyValue = (key: string, value: string) => {
    writeWrapped(`${key}: ${value}`);
  };

  const addList = (items: string[]) => {
    items.forEach((item) => writeWrapped(`• ${asText(item)}`));
  };

  const analyzedAt = new Date(call.created_at).toLocaleString();

  writeWrapped('ClarityIQ Call Analysis Report', 16, 7, true);
  writeWrapped(`Generated: ${new Date().toLocaleString()}`, 9, 4);
  addGap(2);

  addSection('Call Information');
  addKeyValue('File Name', asText(call.file_name));
  addKeyValue('Analyzed At', analyzedAt);
  addKeyValue('Customer', asText(call.customer_name));
  addKeyValue('Meeting', asText(call.meeting_name));
  addKeyValue('Deal Momentum', asText(call.deal_momentum));
  addKeyValue('Vibe Category', asText(call.vibe_category));

  addSection('Executive Summary');
  writeWrapped(asText(call.vibe_summary));

  addSection('BANT Analysis');
  addKeyValue('Budget', asText(call.bant_budget, 'Not discussed'));
  addKeyValue('Authority', asText(call.bant_authority, 'Not discussed'));
  addKeyValue('Need', asText(call.bant_need, 'Not discussed'));
  addKeyValue('Timeline', asText(call.bant_timeline, 'Not discussed'));

  if (call.sentiment_analysis) {
    addSection('Sentiment & Emotional Intelligence');
    addKeyValue('Overall Sentiment', `${asText(call.sentiment_analysis.classification)} (${call.sentiment_analysis.overallScore.toFixed(2)})`);
    if (call.sentiment_analysis.stages.length > 0) {
      writeWrapped('Stage Breakdown', 10, 5, true);
      addList(call.sentiment_analysis.stages.map((stage) => `${stage.stage}: ${stage.sentiment} (${stage.score.toFixed(2)})`));
    }
    if (call.sentiment_analysis.significantShifts.length > 0) {
      writeWrapped('Significant Shifts', 10, 5, true);
      addList(call.sentiment_analysis.significantShifts.map((shift) => `${shift.sentence} — ${shift.reason}`));
    }
    if (call.sentiment_analysis.trend) {
      writeWrapped('Trend Insight', 10, 5, true);
      addKeyValue('Direction', call.sentiment_analysis.trend.direction);
      addKeyValue('Risk Probability', call.sentiment_analysis.trend.riskProbability);
      if (call.sentiment_analysis.trend.reasons.length > 0) {
        addList(call.sentiment_analysis.trend.reasons);
      }
    }
  }

  if (call.engagement_metrics) {
    addSection('Buyer Engagement Intelligence');
    addKeyValue('Talk:Listen Ratio', asText(call.engagement_metrics.talkListenRatio));
    addKeyValue('Buyer Participation', `${call.engagement_metrics.buyerParticipationPercent}%`);
    addKeyValue('Buyer Questions', String(call.engagement_metrics.buyerQuestionCount));
    addKeyValue('Who Interrupts More', asText(call.engagement_metrics.interruptionPatterns.whoInterruptsMore));
    addKeyValue('Tone Suggestion', asText(call.engagement_metrics.interruptionPatterns.toneSuggestion));
  }

  if (call.momentum_engine) {
    addSection('Deal Health & Momentum Engine');
    addKeyValue('Momentum Score', `${call.momentum_engine.score}/100`);
    addKeyValue('Stage Classification', asText(call.momentum_engine.stageClassification));
    addKeyValue('Objection Resolution Rate', `${call.momentum_engine.objectionResolutionRate}%`);
    if (call.momentum_engine.nextStepsDetected.length > 0) {
      writeWrapped('Next Steps Detected', 10, 5, true);
      addList(call.momentum_engine.nextStepsDetected);
    }
    if (call.momentum_engine.objections.length > 0) {
      writeWrapped('Objections', 10, 5, true);
      addList(
        call.momentum_engine.objections.map(
          (objection) => `${objection.category} | Resolved: ${objection.resolved} | Quality: ${objection.handlingQuality} | ${objection.quote}`
        )
      );
    }
  }

  if (call.buying_signals && call.buying_signals.length > 0) {
    addSection('Buying Signal Detection');
    addList(
      call.buying_signals.map(
        (signal) => `${signal.category} | Strength: ${signal.strength} | Impact: +${signal.impactOnProbability}% | ${signal.quote}`
      )
    );
  }

  if (call.rep_effectiveness) {
    addSection('Rep Effectiveness Intelligence');
    addList(
      Object.entries(call.rep_effectiveness.scores).map(
        ([key, score]) => `${key.replace(/([A-Z])/g, ' $1').trim()}: ${score}/10`
      )
    );
    if (call.rep_effectiveness.strengths.length > 0) {
      writeWrapped('Strengths', 10, 5, true);
      addList(call.rep_effectiveness.strengths);
    }
    if (call.rep_effectiveness.improvementAreas.length > 0) {
      writeWrapped('Improvement Areas', 10, 5, true);
      addList(call.rep_effectiveness.improvementAreas);
    }
    if (call.rep_effectiveness.coachingSuggestions.length > 0) {
      writeWrapped('Coaching Suggestions', 10, 5, true);
      addList(call.rep_effectiveness.coachingSuggestions);
    }
  }

  if (call.risk_engine) {
    addSection('Risk & Early Warning Engine');
    addKeyValue('Risk Score', `${call.risk_engine.score}/100`);
    addKeyValue('Ghosting Probability', `${call.risk_engine.ghostingProbability}%`);
    addKeyValue('Risk Increase Stage', asText(call.risk_engine.riskIncreaseStage));
    if (call.risk_engine.topRedFlags.length > 0) {
      writeWrapped('Top Red Flags', 10, 5, true);
      addList(call.risk_engine.topRedFlags);
    }
    if (call.risk_engine.indicators.length > 0) {
      writeWrapped('Risk Indicators', 10, 5, true);
      addList(call.risk_engine.indicators.map((indicator) => `${indicator.severity}: ${indicator.type} — ${indicator.description}`));
    }
  }

  addSection('Transcript Highlights');
  writeWrapped(asText(transcriptHighlights.summary));
  if (transcriptHighlights.keywords.length > 0) {
    writeWrapped('Keywords', 10, 5, true);
    addList(transcriptHighlights.keywords);
  }

  const fileBase = toFilenameBase(call.file_name || 'call-report');
  doc.save(`${fileBase}-report.pdf`);
};
