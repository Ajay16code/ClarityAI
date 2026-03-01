
import React, { useState, useMemo, useEffect } from 'react';
import { Call, Customer, DealMomentum, VibeCategory, GlobalIntelligence as GlobalIntelligenceType } from '../types';
import { useTheme } from '../App';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie
} from 'recharts';
import { InfoCircleIcon, ArrowTrendingUpIcon, UsersIcon, PieChartIcon, HistoryIcon, GlobeIcon, SparklesIcon } from './Icons';
import VibeBadge from './VibeBadge';
import { analyzeGlobalPatterns } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface CustomerIntelligenceProps {
  customers: Customer[];
  calls: Call[];
}

const CustomerIntelligence: React.FC<CustomerIntelligenceProps> = ({ customers, calls }) => {
  const [view, setView] = useState<'customer' | 'global'>('customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers.length > 0 ? customers[0].id : null);
  const [globalIntelligence, setGlobalIntelligence] = useState<GlobalIntelligenceType | null>(null);
  const [isAnalyzingGlobal, setIsAnalyzingGlobal] = useState(false);
  const { theme } = useTheme();

  const handleAnalyzeGlobal = async () => {
    if (calls.length === 0) return;
    setIsAnalyzingGlobal(true);
    try {
      const result = await analyzeGlobalPatterns(calls, ['pricing', 'competitor', 'security', 'integration', 'budget']);
      setGlobalIntelligence(result);
    } catch (error) {
      console.error('Failed to analyze global patterns:', error);
    } finally {
      setIsAnalyzingGlobal(false);
    }
  };

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === selectedCustomerId), 
  [customers, selectedCustomerId]);

  const customerCalls = useMemo(() => 
    calls.filter(c => c.customer_id === selectedCustomerId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  [calls, selectedCustomerId]);

  const intelligenceData = useMemo(() => {
    if (customerCalls.length === 0) return null;

    // Aggregated Rep Effectiveness
    const repScores = {
      discoveryDepth: 0,
      businessPainUnderstanding: 0,
      valueArticulation: 0,
      objectionHandlingQuality: 0,
      nextStepClarity: 0
    };
    let repCount = 0;

    customerCalls.forEach(c => {
      if (c.rep_effectiveness) {
        repScores.discoveryDepth += c.rep_effectiveness.scores.discoveryDepth;
        repScores.businessPainUnderstanding += c.rep_effectiveness.scores.businessPainUnderstanding;
        repScores.valueArticulation += c.rep_effectiveness.scores.valueArticulation;
        repScores.objectionHandlingQuality += c.rep_effectiveness.scores.objectionHandlingQuality;
        repScores.nextStepClarity += c.rep_effectiveness.scores.nextStepClarity;
        repCount++;
      }
    });

    const radarData = repCount > 0 ? [
      { subject: 'Discovery', A: repScores.discoveryDepth / repCount, fullMark: 10 },
      { subject: 'Pain', A: repScores.businessPainUnderstanding / repCount, fullMark: 10 },
      { subject: 'Value', A: repScores.valueArticulation / repCount, fullMark: 10 },
      { subject: 'Objections', A: repScores.objectionHandlingQuality / repCount, fullMark: 10 },
      { subject: 'Clarity', A: repScores.nextStepClarity / repCount, fullMark: 10 },
    ] : [];

    // Risk Trend
    const riskTrend = customerCalls.map(c => ({
      date: new Date(c.created_at).toLocaleDateString(),
      risk: c.risk_engine?.score || 0,
      ghosting: c.risk_engine?.ghostingProbability || 0
    }));

    // Buying Signals
    const buyingSignals = customerCalls.flatMap(c => c.buying_signals || []);
    const signalCounts = buyingSignals.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      radarData,
      riskTrend,
      signalCounts: Object.entries(signalCounts).map(([name, value]) => ({ name, value })),
      totalCalls: customerCalls.length,
      latestRisk: customerCalls[customerCalls.length - 1].risk_engine,
      latestMomentum: customerCalls[customerCalls.length - 1].deal_momentum
    };
  }, [customerCalls]);

  return (
    <div className="space-y-8" style={{ fontFamily: 'inherit' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Intelligence Center</h2>
          <div className="flex mt-4 p-1 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] w-fit">
            <button 
              onClick={() => setView('customer')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'customer' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              Customer View
            </button>
            <button 
              onClick={() => setView('global')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'global' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              Global Patterns
            </button>
          </div>
        </div>
        
        {view === 'customer' ? (
          <div className="w-full md:w-64">
            <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-2">Select Customer</label>
            <select 
              value={selectedCustomerId || ''} 
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            >
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : (
          <button 
            onClick={handleAnalyzeGlobal}
            disabled={isAnalyzingGlobal || calls.length === 0}
            className="flex items-center px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg font-bold hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50"
          >
            {isAnalyzingGlobal ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <SparklesIcon className="w-4 h-4 mr-2" />}
            Analyze Global Patterns
          </button>
        )}
      </div>

      {view === 'customer' ? (
        <>
          {!selectedCustomerId ? (
            <div className="text-center py-20 bg-[var(--color-bg-card)] rounded-xl border border-dashed border-[var(--color-border-default)]">
              <InfoCircleIcon className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] mb-4" />
              <p className="text-[var(--color-text-secondary)]">Please select a customer to view deep intelligence.</p>
            </div>
          ) : customerCalls.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-bg-card)] rounded-xl border border-dashed border-[var(--color-border-default)]">
              <HistoryIcon className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] mb-4" />
              <p className="text-[var(--color-text-secondary)]">No calls found for {selectedCustomer?.name}. Upload a call to start analysis.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Summary & Risk */}
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-[var(--color-bg-card)] p-6 rounded-xl shadow-lg border border-[var(--color-border-default)]">
                  <h3 className="text-xl font-bold mb-4 flex items-center text-[var(--color-primary)]">
                    <InfoCircleIcon className="w-5 h-5 mr-2" />
                    Latest Deal Health
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-[var(--color-text-secondary)]">Deal Momentum</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        intelligenceData?.latestMomentum === DealMomentum.INCREASING ? 'bg-emerald-500/10 text-emerald-500' :
                        intelligenceData?.latestMomentum === DealMomentum.COOLING ? 'bg-red-500/10 text-red-500' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>{intelligenceData?.latestMomentum}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-[var(--color-text-secondary)]">Risk Score</span>
                      <span className={`text-xl font-bold ${
                        (intelligenceData?.latestRisk?.score || 0) > 60 ? 'text-red-500' : 'text-emerald-500'
                      }`}>{intelligenceData?.latestRisk?.score || 0}/100</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-[var(--color-text-secondary)]">Ghosting Prob.</span>
                      <span className="text-xl font-bold text-[var(--color-text-primary)]">{intelligenceData?.latestRisk?.ghostingProbability || 0}%</span>
                    </div>
                  </div>
                  {intelligenceData?.latestRisk?.topRedFlags && intelligenceData.latestRisk.topRedFlags.length > 0 && (
                    <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Active Red Flags</p>
                      <ul className="space-y-2">
                        {intelligenceData.latestRisk.topRedFlags.map((flag, i) => (
                          <li key={i} className="text-xs text-red-600 font-medium flex items-start">
                            <span className="mr-2">•</span> {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-[var(--color-bg-card)] p-6 rounded-xl shadow-lg border border-[var(--color-border-default)]">
                  <h3 className="text-xl font-bold mb-4 flex items-center text-[var(--color-primary)]">
                    <PieChartIcon className="w-5 h-5 mr-2" />
                    Buying Signal Mix
                  </h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={intelligenceData?.signalCounts}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {intelligenceData?.signalCounts.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Middle & Right Column: Trends & Rep Effectiveness */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-[var(--color-bg-card)] p-6 rounded-xl shadow-lg border border-[var(--color-border-default)]">
                  <h3 className="text-xl font-bold mb-6 flex items-center text-[var(--color-primary)]">
                    <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
                    Risk & Ghosting Probability Trend
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={intelligenceData?.riskTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)', borderRadius: '8px' }} />
                        <Legend verticalAlign="top" align="right" height={36} />
                        <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Risk Score" />
                        <Line type="monotone" dataKey="ghosting" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Ghosting Prob." />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[var(--color-bg-card)] p-6 rounded-xl shadow-lg border border-[var(--color-border-default)]">
                    <h3 className="text-xl font-bold mb-6 flex items-center text-[var(--color-primary)]">
                      <UsersIcon className="w-5 h-5 mr-2" />
                      Rep Effectiveness Profile
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={intelligenceData?.radarData}>
                          <PolarGrid stroke="var(--color-border-default)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} hide />
                          <Radar
                            name="Rep Performance"
                            dataKey="A"
                            stroke="var(--color-primary)"
                            fill="var(--color-primary)"
                            fillOpacity={0.6}
                          />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)', borderRadius: '8px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[var(--color-bg-card)] p-6 rounded-xl shadow-lg border border-[var(--color-border-default)]">
                    <h3 className="text-xl font-bold mb-4 flex items-center text-[var(--color-primary)]">
                      <HistoryIcon className="w-5 h-5 mr-2" />
                      Recent Intelligence Feed
                    </h3>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {customerCalls.slice().reverse().map((call, i) => (
                        <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-[var(--color-primary)] transition-colors cursor-pointer">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">{call.file_name}</p>
                            <span className="text-[10px] text-[var(--color-text-secondary)]">{new Date(call.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                             <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                               call.sentiment_analysis?.classification === 'Positive' ? 'text-emerald-500' : 'text-slate-500'
                             }`}>{call.sentiment_analysis?.classification}</span>
                             <span className="text-[9px] text-[var(--color-text-secondary)]">Momentum: {call.deal_momentum}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          {!globalIntelligence && !isAnalyzingGlobal ? (
            <div className="text-center py-20 bg-[var(--color-bg-card)] rounded-xl border border-dashed border-[var(--color-border-default)]">
              <GlobeIcon className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] mb-4" />
              <p className="text-[var(--color-text-secondary)] mb-6">Analyze patterns across all calls to detect macro-level trends.</p>
              <button 
                onClick={handleAnalyzeGlobal}
                className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg font-bold hover:bg-[var(--color-primary-dark)] transition-all"
              >
                Run Macro Analysis
              </button>
            </div>
          ) : isAnalyzingGlobal ? (
            <div className="text-center py-20 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-default)]">
              <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
              <p className="text-[var(--color-text-primary)] font-bold">Scanning Call Intelligence...</p>
              <p className="text-[var(--color-text-secondary)] text-sm">Detecting objections, sentiment trends, and rep performance variance.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Objections by Product */}
              <div className="bg-[var(--color-bg-card)] p-6 rounded-xl shadow-lg border border-[var(--color-border-default)]">
                <h3 className="text-xl font-bold mb-6 flex items-center text-[var(--color-primary)]">
                  <PieChartIcon className="w-5 h-5 mr-2" />
                  Repeated Objections by Product
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={globalIntelligence?.repeatedObjectionsByProduct}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                      <XAxis dataKey="product" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)', borderRadius: '8px' }} />
                      <Bar dataKey="frequency" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sentiment by Geography */}
              <div className="bg-[var(--color-bg-card)] p-6 rounded-xl shadow-lg border border-[var(--color-border-default)]">
                <h3 className="text-xl font-bold mb-6 flex items-center text-[var(--color-primary)]">
                  <GlobeIcon className="w-5 h-5 mr-2" />
                  Sentiment Trends by Geography
                </h3>
                <div className="space-y-4">
                  {globalIntelligence?.sentimentTrendsByGeography.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                      <div>
                        <p className="font-bold text-[var(--color-text-primary)]">{item.geography}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">Trend: {item.trend}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${item.sentimentScore > 0.5 ? 'text-emerald-500' : item.sentimentScore < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                          {item.sentimentScore.toFixed(2)}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Avg Sentiment</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance by Tenure */}
              <div className="bg-[var(--color-bg-card)] p-6 rounded-xl shadow-lg border border-[var(--color-border-default)]">
                <h3 className="text-xl font-bold mb-6 flex items-center text-[var(--color-primary)]">
                  <UsersIcon className="w-5 h-5 mr-2" />
                  Performance Variance by Rep Tenure
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={globalIntelligence?.performanceVarianceByRepTenure}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                      <XAxis dataKey="tenureGroup" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                      <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)', borderRadius: '8px' }} />
                      <Bar dataKey="avgScore" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Keyword Spikes */}
              <div className="bg-[var(--color-bg-card)] p-6 rounded-xl shadow-lg border border-[var(--color-border-default)]">
                <h3 className="text-xl font-bold mb-6 flex items-center text-[var(--color-primary)]">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Keyword Spikes (Admin Defined)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {globalIntelligence?.keywordSpikes.map((item, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/5">
                      <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1">{item.keyword}</p>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-[var(--color-text-primary)]">{item.count}</p>
                        <p className={`text-xs font-bold ${item.changePercent > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {item.changePercent > 0 ? '+' : ''}{item.changePercent}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerIntelligence;
