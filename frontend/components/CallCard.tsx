
import React, { useMemo } from 'react';
import { Call, DealMomentum, VibeCategory } from '../types';
import { useTheme } from '../App'; // Import useTheme
import VibeBadge from './VibeBadge'; // Import VibeBadge
import { downloadCallReportPdf } from '../utils/callReportPdf';
import { getTranscriptHighlights } from '../utils/transcriptHighlights';

interface CallCardProps {
  call: Call;
  onSelectCall: (call: Call) => void;
  isDetailedView?: boolean;
}

const getMomentumColor = (momentum: DealMomentum) => {
  switch (momentum) {
    case DealMomentum.INCREASING:
      return 'bg-[var(--color-momentum-increasing-bg)] text-[var(--color-momentum-increasing-text)]';
    case DealMomentum.COOLING:
      return 'bg-[var(--color-momentum-cooling-bg)] text-[var(--color-momentum-cooling-text)]';
    case DealMomentum.STABLE:
      return 'bg-[var(--color-momentum-stable-bg)] text-[var(--color-momentum-stable-text)]';
    case DealMomentum.NEW:
      return 'bg-[var(--color-momentum-new-bg)] text-[var(--color-momentum-new-text)]';
    default:
      return 'bg-[var(--color-border-default)] text-[var(--color-text-secondary)]';
  }
};

const CallCard: React.FC<CallCardProps> = ({ call, onSelectCall, isDetailedView = false }) => {
  const formattedDate = new Date(call.created_at).toLocaleString();
  const { theme } = useTheme(); // Use theme context for font styling
  const transcriptHighlights = useMemo(() => getTranscriptHighlights(call.transcription), [call.transcription]);

  const handleDownloadReport = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    downloadCallReportPdf(call);
  };

  // Removed local FONT_MAP, relying on global font set in App.tsx

  return (
    <div
      className={`bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border transition-colors duration-300
        ${isDetailedView ? 'border-[var(--color-border-accent)]' : 'border-[var(--color-border-default)]'}
        ${!isDetailedView ? 'cursor-pointer hover:shadow-xl hover:bg-[var(--color-bg-card-hover)]' : ''}
        flex flex-col h-full`}
      onClick={!isDetailedView ? () => onSelectCall(call) : undefined}
      style={{ fontFamily: 'inherit' }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] truncate mr-4">{call.file_name}</h3>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${getMomentumColor(
            call.deal_momentum
          )} flex-shrink-0`}
        >
          {call.deal_momentum}
        </span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-1">Analyzed: {formattedDate}</p>
      {call.customer_name && (
        <p className="text-sm text-[var(--color-text-secondary)] mb-1">Customer: <span className="font-medium text-[var(--color-text-primary)]">{call.customer_name}</span></p>
      )}
      {call.meeting_name && (
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">Meeting: <span className="font-medium text-[var(--color-text-primary)]">{call.meeting_name}</span></p>
      )}

      {!isDetailedView && (
        <div className="flex flex-col flex-grow"> {/* Added flex-grow */}
          <p className="text-[var(--color-text-primary)] line-clamp-3 mb-2 flex-grow">{transcriptHighlights.summary}</p>
          {transcriptHighlights.keywords.length > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-4">
              Keywords: {transcriptHighlights.keywordLine}
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-[var(--color-border-default)] text-sm">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-[var(--color-text-primary)]">Key Vibe:</p>
              <button
                type="button"
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors p-1"
                onClick={handleDownloadReport}
                title="Download PDF Report"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            </div>
            {/* Using VibeBadge component */}
            <VibeBadge category={call.vibe_category} summary={call.vibe_summary} className="text-sm" />
          </div>
        </div>
      )}

      {isDetailedView && (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-lg text-[var(--color-primary)] mb-2">Transcript Highlights</h4>
            <p className="text-[var(--color-text-primary)] bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)] whitespace-pre-wrap">
              {transcriptHighlights.summary}
            </p>
            {transcriptHighlights.keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {transcriptHighlights.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-2 py-1 text-xs rounded-full bg-[var(--color-bg-card-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]">
                View full transcript
              </summary>
              <p className="mt-2 text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)] whitespace-pre-wrap max-h-64 overflow-y-auto">
                {call.transcription}
              </p>
            </details>
            {call.file_url && (
              <div className="mt-3">
                <audio
                  controls
                  preload="metadata"
                  src={call.file_url}
                  className="w-full"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <a
                href={call.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] text-sm font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
                </svg>
                Listen to Audio
              </a>
              <button
                type="button"
                className="inline-flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm font-medium transition-colors"
                onClick={handleDownloadReport}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>

          {/* Branch 1: Sentiment & Emotional Intelligence */}
          {call.sentiment_analysis && (
            <div>
              <h4 className="font-semibold text-lg text-[var(--color-primary)] mb-2">Sentiment & Emotional Intelligence</h4>
              <div className="bg-[var(--color-bg-body)] p-4 rounded-md border border-[var(--color-border-default)] space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">Overall Sentiment:</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      call.sentiment_analysis.classification === 'Positive' ? 'bg-emerald-500/10 text-emerald-500' :
                      call.sentiment_analysis.classification === 'Negative' ? 'bg-red-500/10 text-red-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {call.sentiment_analysis.classification}
                    </span>
                    <span className="text-sm font-mono text-[var(--color-text-primary)]">
                      ({call.sentiment_analysis.overallScore.toFixed(2)})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {call.sentiment_analysis.stages.map((s, i) => (
                    <div key={i} className="p-2 bg-white/5 rounded border border-white/5 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">{s.stage}</p>
                      <p className={`text-xs font-bold ${
                        s.sentiment === 'Positive' ? 'text-emerald-500' :
                        s.sentiment === 'Negative' ? 'text-red-500' :
                        'text-slate-500'
                      }`}>{s.sentiment}</p>
                    </div>
                  ))}
                </div>

                {call.sentiment_analysis.significantShifts.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Significant Shifts:</p>
                    <ul className="space-y-2">
                      {call.sentiment_analysis.significantShifts.map((shift, i) => (
                        <li key={i} className="text-xs italic text-[var(--color-text-primary)] border-l-2 border-[var(--color-primary)] pl-2">
                          "{shift.sentence}" <span className="block text-[10px] text-[var(--color-text-secondary)] mt-1">— {shift.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Branch 2: Buyer Engagement Intelligence */}
          {call.engagement_metrics && (
            <div>
              <h4 className="font-semibold text-lg text-[var(--color-primary)] mb-2">Buyer Engagement Intelligence</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)]">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">Talk:Listen Ratio:</p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">{call.engagement_metrics.talkListenRatio}</p>
                </div>
                <div className="bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)]">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">Buyer Participation:</p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">{call.engagement_metrics.buyerParticipationPercent}%</p>
                </div>
                <div className="bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)]">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">Buyer Questions:</p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">{call.engagement_metrics.buyerQuestionCount}</p>
                </div>
              </div>
              <div className="mt-2 bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)]">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Interruption Patterns:</p>
                <p className="text-sm text-[var(--color-text-primary)]">
                  <span className="font-semibold">{call.engagement_metrics.interruptionPatterns.whoInterruptsMore}</span> interrupts more. 
                  <span className="italic block mt-1 text-[var(--color-text-secondary)]">{call.engagement_metrics.interruptionPatterns.toneSuggestion}</span>
                </p>
              </div>
            </div>
          )}

          {/* Branch 3: Deal Health & Momentum Engine */}
          {call.momentum_engine && (
            <div>
              <h4 className="font-semibold text-lg text-[var(--color-primary)] mb-2">Deal Health & Momentum Engine</h4>
              <div className="bg-[var(--color-bg-body)] p-4 rounded-md border border-[var(--color-border-default)] space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Momentum Score:</p>
                    <p className="text-2xl font-bold text-[var(--color-primary)]">{call.momentum_engine.score}/100</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Stage:</p>
                    <p className="text-lg font-bold text-[var(--color-text-primary)]">{call.momentum_engine.stageClassification}</p>
                  </div>
                </div>

                {call.momentum_engine.objections.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Objections ({call.momentum_engine.objectionResolutionRate}% Resolution):</p>
                    <div className="space-y-2">
                      {call.momentum_engine.objections.map((obj, i) => (
                        <div key={i} className="p-2 bg-white/5 rounded border border-white/5">
                          <p className="text-xs italic text-[var(--color-text-primary)]">"{obj.quote}"</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[10px] bg-slate-500/10 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">{obj.category}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                              obj.resolved === 'Yes' ? 'bg-emerald-500/10 text-emerald-500' :
                              obj.resolved === 'Partially' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>Resolved: {obj.resolved}</span>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded uppercase font-bold">Quality: {obj.handlingQuality}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {call.momentum_engine.nextStepsDetected.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Next Steps Detected:</p>
                    <ul className="list-disc list-inside text-sm text-[var(--color-text-primary)]">
                      {call.momentum_engine.nextStepsDetected.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Branch 4: Buying Signal Detection */}
          {call.buying_signals && call.buying_signals.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg text-[var(--color-primary)] mb-2">Buying Signal Detection</h4>
              <div className="bg-[var(--color-bg-body)] p-4 rounded-md border border-[var(--color-border-default)] space-y-3">
                {call.buying_signals.map((signal, i) => (
                  <div key={i} className="p-3 bg-white/5 rounded border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded uppercase font-bold">{signal.category}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        signal.strength === 'Strong' ? 'bg-emerald-500 text-white' :
                        signal.strength === 'Moderate' ? 'bg-amber-500 text-white' :
                        'bg-slate-500 text-white'
                      }`}>Strength: {signal.strength}</span>
                    </div>
                    <p className="text-xs italic text-[var(--color-text-primary)] mb-2">"{signal.quote}"</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">Impact on Deal Probability: <span className="font-bold text-[var(--color-primary)]">+{signal.impactOnProbability}%</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branch 5: Rep Effectiveness Intelligence */}
          {call.rep_effectiveness && (
            <div>
              <h4 className="font-semibold text-lg text-[var(--color-primary)] mb-2">Rep Effectiveness Intelligence</h4>
              <div className="bg-[var(--color-bg-body)] p-4 rounded-md border border-[var(--color-border-default)] space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(call.rep_effectiveness.scores).map(([key, score]) => (
                    <div key={key} className="p-2 bg-white/5 rounded border border-white/5 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] leading-tight mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-lg font-bold text-[var(--color-primary)]">{score}/10</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-2">Strengths:</p>
                    <ul className="list-disc list-inside text-xs text-[var(--color-text-primary)] space-y-1">
                      {call.rep_effectiveness.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">Improvement Areas:</p>
                    <ul className="list-disc list-inside text-xs text-[var(--color-text-primary)] space-y-1">
                      {call.rep_effectiveness.improvementAreas.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
                {call.rep_effectiveness.coachingSuggestions.length > 0 && (
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Coaching Suggestions:</p>
                    <ul className="list-disc list-inside text-xs text-[var(--color-text-primary)] space-y-1">
                      {call.rep_effectiveness.coachingSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Branch 6: Risk & Early Warning Engine */}
          {call.risk_engine && (
            <div>
              <h4 className="font-semibold text-lg text-[var(--color-primary)] mb-2">Risk & Early Warning Engine</h4>
              <div className="bg-[var(--color-bg-body)] p-4 rounded-md border border-[var(--color-border-default)] space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Risk Score:</p>
                    <p className={`text-2xl font-bold ${
                      call.risk_engine.score > 70 ? 'text-red-500' :
                      call.risk_engine.score > 40 ? 'text-amber-500' :
                      'text-emerald-500'
                    }`}>{call.risk_engine.score}/100</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">Ghosting Prob:</p>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{call.risk_engine.ghostingProbability}%</p>
                  </div>
                </div>

                {call.risk_engine.topRedFlags.length > 0 && (
                  <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-md">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">Top Red Flags:</p>
                    <ul className="list-disc list-inside text-xs text-red-600 font-medium space-y-1">
                      {call.risk_engine.topRedFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                    </ul>
                  </div>
                )}

                {call.risk_engine.indicators.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Risk Indicators:</p>
                    <div className="space-y-2">
                      {call.risk_engine.indicators.map((ind, i) => (
                        <div key={i} className="flex items-start space-x-2 p-2 bg-white/5 rounded border border-white/5">
                          <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                            ind.severity === 'High' ? 'bg-red-500' :
                            ind.severity === 'Medium' ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}></span>
                          <div>
                            <p className="text-xs font-bold text-[var(--color-text-primary)]">{ind.type}</p>
                            <p className="text-[10px] text-[var(--color-text-secondary)]">{ind.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-[var(--color-text-secondary)] italic">Risk increases significantly at stage: <span className="font-bold text-[var(--color-text-primary)]">{call.risk_engine.riskIncreaseStage}</span></p>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-lg text-[var(--color-primary)] mb-2">BANT Analysis (Golden Trio)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)]">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Budget:</p>
                <p className="text-[var(--color-text-primary)] font-medium">{call.bant_budget || 'Not discussed'}</p>
              </div>
              <div className="bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)]">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Authority:</p>
                <p className="text-[var(--color-text-primary)] font-medium">{call.bant_authority || 'Not discussed'}</p>
              </div>
              <div className="bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)]">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Need:</p>
                <p className="text-[var(--color-text-primary)] font-medium">{call.bant_need || 'Not discussed'}</p>
              </div>
              <div className="bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)]">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Timeline:</p>
                <p className="text-[var(--color-text-primary)] font-medium">{call.bant_timeline || 'Not discussed'}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg text-[var(--color-primary)] mb-2">Vibe Engine Summary</h4>
            <p className="text-[var(--color-text-primary)] bg-[var(--color-bg-body)] p-3 rounded-md border border-[var(--color-border-default)] whitespace-pre-wrap">
              {call.vibe_summary}
            </p>
            <div className="mt-2">
              <VibeBadge category={call.vibe_category} summary={call.vibe_summary} className="text-sm" />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg text-[var(--color-primary)] mb-2">Deal Arc Momentum</h4>
            <span
              className={`inline-block px-4 py-2 text-base font-semibold rounded-full ${getMomentumColor(
                call.deal_momentum
              )}`}
            >
              {call.deal_momentum}
            </span>
            <p className="mt-2 text-[var(--color-text-secondary)] text-sm">
              This momentum is assessed by ClarityIQ comparing this call's insights with recent historical interactions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallCard;