
import React, { useMemo } from 'react'; // Import useMemo
import { useAuth, useTheme } from '../App';
import { Call, Customer, Meeting, DealMomentum, VibeCategory, CustomerCategory } from '../types';
import { PieChartIcon, LineChartIcon, UsersIcon, CalendarIcon, ListBulletIcon, InfoCircleIcon, CustomersIcon, MeetingsIcon, HistoryIcon, ArrowTrendingUpIcon } from './Icons';
import VibeBadge from './VibeBadge'; // Import VibeBadge
import { getOverallDealMomentumArc, getOverallVibeArc } from '../utils/arcHelpers'; // NEW: Import arc helpers
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface DashboardProps {
  customers: Customer[];
  meetings: Meeting[];
  calls: Call[];
  onShowInfo: () => void; // New prop to trigger info popup
  isDashboardContentLoading: boolean; // Renamed from isLoadingData for clarity
}

// Helper to categorize customer based on their call history (NEW)
function categorizeCustomer(customer: Customer, customerCalls: Call[]): CustomerCategory {
  if (customerCalls.length === 0) {
    return CustomerCategory.GENERAL; // Not enough data
  }

  const vibeCounts = customerCalls.reduce((acc, call) => {
    // Ensure call.vibe_category is a valid VibeCategory, default to UNKNOWN if not
    const vibeCategory: VibeCategory = Object.values(VibeCategory).includes(call.vibe_category as VibeCategory)
      ? call.vibe_category
      : VibeCategory.UNKNOWN;
    
    acc[vibeCategory] = (acc[vibeCategory] || 0) + 1;
    return acc;
  }, {} as Record<VibeCategory, number>);

  const totalCalls = customerCalls.length;
  const positivePercentage = (vibeCounts[VibeCategory.POSITIVE] || 0) / totalCalls;
  const negativePercentage = (vibeCounts[VibeCategory.NEGATIVE] || 0) / totalCalls;

  if (totalCalls >= 2 && positivePercentage > 0.6) { // More than 60% positive calls and at least 2 calls
    return CustomerCategory.ENTHUSIASTIC;
  }
  if (totalCalls >= 1 && positivePercentage > 0.3 && negativePercentage < 0.2) { // Some positive, not too much negative
    return CustomerCategory.POTENTIAL;
  }
  if (totalCalls >= 2 && negativePercentage > 0.5) { // More than 50% negative calls and at least 2 calls
    return CustomerCategory.NEEDS_ATTENTION;
  }

  return CustomerCategory.GENERAL; // Default for others or insufficient data
}

const getCustomerCategoryColors = (category: CustomerCategory) => {
  switch (category) {
    case CustomerCategory.ENTHUSIASTIC:
      return 'border-[var(--color-customer-enthusiastic-border)] bg-[var(--color-customer-enthusiastic-bg)] text-[var(--color-customer-enthusiastic-text)]';
    case CustomerCategory.POTENTIAL:
      return 'border-[var(--color-customer-potential-border)] bg-[var(--color-customer-potential-bg)] text-[var(--color-customer-potential-text)]';
    case CustomerCategory.NEEDS_ATTENTION:
      return 'border-[var(--color-customer-needs-attention-border)] bg-[var(--color-customer-needs-attention-bg)] text-[var(--color-customer-needs-attention-text)]';
    case CustomerCategory.GENERAL:
    default:
      return 'border-[var(--color-customer-general-border)] bg-[var(--color-customer-general-bg)] text-[var(--color-customer-general-text)]';
  }
};


const Dashboard: React.FC<DashboardProps> = ({ customers, meetings, calls, onShowInfo, isDashboardContentLoading }) => {
  const { profile } = useAuth();
  const { theme } = useTheme(); // Now only using theme, font is global via body

  // Basic Metrics
  const totalCustomers = customers.length;
  const totalMeetings = meetings.length;
  const totalCalls = calls.length;

  // Determine if the dashboard is empty (only if not loading)
  const isEmptyDashboard = !isDashboardContentLoading && totalCustomers === 0 && totalMeetings === 0 && totalCalls === 0;

  // Deal Momentum Distribution
  const momentumCounts = calls.reduce((acc, call) => {
    acc[call.deal_momentum] = (acc[call.deal_momentum] || 0) + 1;
    return acc;
  }, {} as Record<DealMomentum, number>);

  // Vibe Distribution (using VibeCategory now)
  const vibeCounts = calls.reduce((acc, call) => {
    // Ensure call.vibe_category is a valid VibeCategory, default to UNKNOWN if not
    const vibeCategory: VibeCategory = Object.values(VibeCategory).includes(call.vibe_category as VibeCategory)
      ? call.vibe_category
      : VibeCategory.UNKNOWN;
    acc[vibeCategory] = (acc[vibeCategory] || 0) + 1;
    return acc;
  }, {} as Record<VibeCategory, number>);

  const vibeChartData = Object.values(VibeCategory).map(category => ({
    name: category,
    value: vibeCounts[category] || 0,
  })).filter(item => item.value > 0);

  const momentumChartData = Object.values(DealMomentum).map(momentum => ({
    name: momentum,
    count: momentumCounts[momentum] || 0,
  }));

  const VIBE_COLORS: Record<string, string> = {
    [VibeCategory.POSITIVE]: '#10b981', // Emerald 500
    [VibeCategory.NEGATIVE]: '#ef4444', // Red 500
    [VibeCategory.NEUTRAL]: '#64748b',  // Slate 500
    [VibeCategory.MIXED]: '#f59e0b',    // Amber 500
    [VibeCategory.UNKNOWN]: '#94a3b8',  // Slate 400
  };

  const MOMENTUM_COLORS: Record<string, string> = {
    [DealMomentum.INCREASING]: '#10b981',
    [DealMomentum.COOLING]: '#ef4444',
    [DealMomentum.STABLE]: '#3b82f6',    // Blue 500
    [DealMomentum.NEW]: '#8b5cf6',       // Violet 500
    [DealMomentum.UNKNOWN]: '#94a3b8',
  };

  // Sentiment Trend Data
  const sentimentTrendData = useMemo(() => {
    return calls
      .filter(call => call.sentiment_analysis)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(call => ({
        date: new Date(call.created_at).toLocaleDateString(),
        score: call.sentiment_analysis?.overallScore || 0,
        fileName: call.file_name
      }));
  }, [calls]);

  // Engagement Metrics Summary
  const engagementSummary = useMemo(() => {
    const callsWithEngagement = calls.filter(c => c.engagement_metrics);
    if (callsWithEngagement.length === 0) return null;

    const totalParticipation = callsWithEngagement.reduce((sum, c) => sum + (c.engagement_metrics?.buyerParticipationPercent || 0), 0);
    const totalQuestions = callsWithEngagement.reduce((sum, c) => sum + (c.engagement_metrics?.buyerQuestionCount || 0), 0);

    return {
      avgParticipation: Math.round(totalParticipation / callsWithEngagement.length),
      avgQuestions: (totalQuestions / callsWithEngagement.length).toFixed(1),
      totalCalls: callsWithEngagement.length
    };
  }, [calls]);

  // Risk & Early Warning Summary
  const riskSummary = useMemo(() => {
    const callsWithRisk = calls.filter(c => c.risk_engine);
    if (callsWithRisk.length === 0) return null;

    const totalRiskScore = callsWithRisk.reduce((sum, c) => sum + (c.risk_engine?.score || 0), 0);
    const totalGhostingProb = callsWithRisk.reduce((sum, c) => sum + (c.risk_engine?.ghostingProbability || 0), 0);
    
    // Collect all red flags
    const allRedFlags = callsWithRisk.flatMap(c => c.risk_engine?.topRedFlags || []);
    const flagCounts = allRedFlags.reduce((acc, flag) => {
      acc[flag] = (acc[flag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topFlags = Object.entries(flagCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([flag]) => flag);

    return {
      avgRiskScore: Math.round(totalRiskScore / callsWithRisk.length),
      avgGhostingProb: Math.round(totalGhostingProb / callsWithRisk.length),
      topFlags,
      totalCalls: callsWithRisk.length
    };
  }, [calls]);

  // Rep Effectiveness Summary
  const repPerformanceSummary = useMemo(() => {
    const callsWithRepEff = calls.filter(c => c.rep_effectiveness);
    if (callsWithRepEff.length === 0) return null;

    const scores = {
      discoveryDepth: 0,
      businessPainUnderstanding: 0,
      valueArticulation: 0,
      objectionHandlingQuality: 0,
      nextStepClarity: 0
    };

    callsWithRepEff.forEach(c => {
      if (c.rep_effectiveness) {
        scores.discoveryDepth += c.rep_effectiveness.scores.discoveryDepth;
        scores.businessPainUnderstanding += c.rep_effectiveness.scores.businessPainUnderstanding;
        scores.valueArticulation += c.rep_effectiveness.scores.valueArticulation;
        scores.objectionHandlingQuality += c.rep_effectiveness.scores.objectionHandlingQuality;
        scores.nextStepClarity += c.rep_effectiveness.scores.nextStepClarity;
      }
    });

    const count = callsWithRepEff.length;
    return [
      { name: 'Discovery', score: (scores.discoveryDepth / count).toFixed(1) },
      { name: 'Pain', score: (scores.businessPainUnderstanding / count).toFixed(1) },
      { name: 'Value', score: (scores.valueArticulation / count).toFixed(1) },
      { name: 'Objections', score: (scores.objectionHandlingQuality / count).toFixed(1) },
      { name: 'Clarity', score: (scores.nextStepClarity / count).toFixed(1) }
    ];
  }, [calls]);

  // Buying Signals Summary
  const buyingSignalsSummary = useMemo(() => {
    const allSignals = calls.flatMap(c => c.buying_signals || []);
    if (allSignals.length === 0) return null;

    const categoryCounts = allSignals.reduce((acc, signal) => {
      acc[signal.category] = (acc[signal.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
  }, [calls]);

  // Meetings and Calls per Customer + Customer Category + Arc Summaries
  const customerInsights = useMemo(() => {
    return customers.map(customer => {
      const customerCalls = calls
        .filter(call => call.customer_id === customer.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Sort for arc calculation
      
      const uniqueMeetingIdsForCustomer = new Set<string>();
      customerCalls.forEach(call => {
        if (call.meeting_id) {
          uniqueMeetingIdsForCustomer.add(call.meeting_id);
        }
      });

      const customerVibeCounts = customerCalls.reduce((acc, call) => {
        const vibeCategory: VibeCategory = Object.values(VibeCategory).includes(call.vibe_category as VibeCategory)
          ? call.vibe_category
          : VibeCategory.UNKNOWN;
        acc[vibeCategory] = (acc[vibeCategory] || 0) + 1;
        return acc;
      }, {} as Record<VibeCategory, number>);

      const customerCategory = categorizeCustomer(customer, customerCalls);
      const overallMomentumArc = getOverallDealMomentumArc(customerCalls); // NEW
      const overallVibeArc = getOverallVibeArc(customerCalls); // NEW

      return {
        customerName: customer.name,
        meetingCount: uniqueMeetingIdsForCustomer.size,
        callCount: customerCalls.length,
        vibeBreakdown: customerVibeCounts,
        customerCategory, // Include customer category
        overallMomentumArc, // NEW
        overallVibeArc, // NEW
      };
    });
  }, [customers, calls]);

  // Skeleton Loader for Metrics Card
  const MetricsCardSkeleton = () => (
    <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)] flex items-center justify-between animate-pulse">
      <div>
        <div className="h-4 bg-[var(--color-border-default)] rounded w-24 mb-2"></div>
        <div className="h-8 bg-[var(--color-border-default)] rounded w-16"></div>
      </div>
      <div className="w-10 h-10 bg-[var(--color-border-default)] rounded-full"></div>
    </div>
  );

  // Skeleton Loader for List Section
  const ListSectionSkeleton = () => (
    <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)] animate-pulse">
      <div className="h-6 bg-[var(--color-border-default)] rounded w-3/4 mb-4"></div>
      <ul className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <li key={i} className="flex justify-between items-center">
            <div className="h-4 bg-[var(--color-border-default)] rounded w-1/3"></div>
            <div className="h-4 bg-[var(--color-border-default)] rounded w-1/5"></div>
          </li>
        ))}
      </ul>
    </div>
  );

  // Skeleton Loader for Customer Insight Card (UPDATED for arc)
  const CustomerInsightCardSkeleton = () => (
    <div className="bg-[var(--color-bg-body)] p-4 rounded-md border border-[var(--color-border-default)] animate-pulse">
      <div className="h-6 bg-[var(--color-border-default)] rounded w-2/3 mb-2"></div>
      <div className="h-4 bg-[var(--color-border-default)] rounded w-1/2 mb-1"></div>
      <div className="h-4 bg-[var(--color-border-default)] rounded w-1/2 mb-4"></div>
      <div className="mt-2 pt-2 border-t border-[var(--color-border-default)]">
        <div className="h-4 bg-[var(--color-border-default)] rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-[var(--color-border-default)] rounded w-2/3 mb-1"></div> {/* Arc summary 1 */}
        <div className="h-3 bg-[var(--color-border-default)] rounded w-2/3"></div> {/* Arc summary 2 */}
      </div>
    </div>
  );

  if (isDashboardContentLoading) {
    return (
      <div className="p-8 space-y-8" style={{ fontFamily: 'inherit' }}>
        {/* Overview Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricsCardSkeleton />
          <MetricsCardSkeleton />
          <MetricsCardSkeleton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deal Momentum Distribution Skeleton */}
          <ListSectionSkeleton />

          {/* Overall Vibe Summary Skeleton */}
          <ListSectionSkeleton />
        </div>

        {/* Customer Insights Skeleton */}
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
          <div className="h-6 bg-[var(--color-border-default)] rounded w-1/4 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <CustomerInsightCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8" style={{ fontFamily: 'inherit' }}>
      {isEmptyDashboard ? (
        <div className="bg-[var(--color-bg-card)] p-8 rounded-lg shadow-lg border border-[var(--color-border-accent)] text-center max-w-2xl mx-auto my-12 animate-fade-in-scale-up">
          <InfoCircleIcon className="w-16 h-16 text-[var(--color-primary)] mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">Your Dashboard is Empty!</h3>
          <p className="text-lg text-[var(--color-text-secondary)] mb-6">
            It looks like you haven't uploaded any calls or added any customers/meetings yet.
          </p>
          <p className="text-[var(--color-text-primary)] mb-6">
            Click the <InfoCircleIcon className="w-5 h-5 inline-block mx-1 align-text-bottom" /> icon in the Navbar for guidance on how to get started,
            or use the "Upload New Audio File" button to analyze your first call!
          </p>
          <button
            onClick={onShowInfo}
            className="px-6 py-3 bg-[var(--color-primary)] text-white font-medium rounded-md shadow-sm hover:bg-[var(--color-primary-dark)] transition-colors duration-200"
            style={{ fontFamily: 'inherit' }}
          >
            Show Me How to Get Started!
          </button>
        </div>
      ) : (
        <>
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)] flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Total Customers</p>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{totalCustomers}</p>
              </div>
              <CustomersIcon className="w-10 h-10 text-[var(--color-primary)] opacity-70" />
            </div>
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)] flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Total Meetings</p>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{totalMeetings}</p>
              </div>
              <MeetingsIcon className="w-10 h-10 text-[var(--color-primary)] opacity-70" />
            </div>
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)] flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Total Calls Analyzed</p>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">{totalCalls}</p>
              </div>
              <HistoryIcon className="w-10 h-10 text-[var(--color-primary)] opacity-70" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deal Momentum Distribution */}
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
              <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
                <ArrowTrendingUpIcon className="w-6 h-6 mr-2 text-[var(--color-primary)]" />
                Deal Momentum Distribution
              </h3>
              {totalCalls === 0 ? (
                <p className="text-[var(--color-text-secondary)]">No calls to analyze momentum.</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={momentumChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--color-text-primary)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {momentumChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={MOMENTUM_COLORS[entry.name] || 'var(--color-primary)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Overall Vibe Summary */}
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
              <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
                <PieChartIcon className="w-6 h-6 mr-2 text-[var(--color-primary)]" />
                Overall Vibe Summary
              </h3>
              {totalCalls === 0 ? (
                <p className="text-[var(--color-text-secondary)]">No calls to summarize vibe.</p>
              ) : (
                <div className="h-64 w-full flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vibeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {vibeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={VIBE_COLORS[entry.name] || 'var(--color-primary)'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 mt-4 md:mt-0">
                    <ul className="space-y-2">
                      {vibeChartData.map((item) => (
                        <li key={item.name} className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: VIBE_COLORS[item.name] }}></div>
                            <span className="font-medium text-[var(--color-text-primary)]">{item.name}</span>
                          </div>
                          <span className="text-[var(--color-text-secondary)]">{item.value} calls ({((item.value / totalCalls) * 100).toFixed(1)}%)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* NEW: Sentiment Trend & Engagement Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sentiment Trend Chart */}
            <div className="lg:col-span-2 bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
              <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
                <LineChartIcon className="w-6 h-6 mr-2 text-[var(--color-primary)]" />
                Sentiment Trend
              </h3>
              {sentimentTrendData.length === 0 ? (
                <p className="text-[var(--color-text-secondary)]">No sentiment data available yet.</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sentimentTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                      <YAxis domain={[-1, 1]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--color-text-primary)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="var(--color-primary)" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: 'var(--color-primary)' }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Engagement Summary Card */}
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)] flex flex-col justify-center">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6 flex items-center">
                <PieChartIcon className="w-6 h-6 mr-2 text-[var(--color-primary)]" />
                Engagement Intelligence
              </h3>
              {!engagementSummary ? (
                <p className="text-[var(--color-text-secondary)] text-center">No engagement metrics available.</p>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Avg. Buyer Participation</p>
                    <p className="text-5xl font-bold text-[var(--color-primary)]">{engagementSummary.avgParticipation}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Avg. Buyer Questions</p>
                    <p className="text-5xl font-bold text-[var(--color-text-primary)]">{engagementSummary.avgQuestions}</p>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] text-center italic">Based on {engagementSummary.totalCalls} analyzed calls</p>
                </div>
              )}
            </div>
          </div>

          {/* Branch 4, 5, 6: Risk, Rep Performance, Buying Signals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Monitor */}
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6 flex items-center">
                <InfoCircleIcon className="w-6 h-6 mr-2 text-red-500" />
                Risk & Early Warning
              </h3>
              {!riskSummary ? (
                <p className="text-[var(--color-text-secondary)] text-center">No risk data available.</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-around">
                    <div className="text-center">
                      <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Avg Risk Score</p>
                      <p className={`text-3xl font-bold ${riskSummary.avgRiskScore > 60 ? 'text-red-500' : 'text-[var(--color-primary)]'}`}>
                        {riskSummary.avgRiskScore}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">Ghosting Prob</p>
                      <p className="text-3xl font-bold text-[var(--color-text-primary)]">{riskSummary.avgGhostingProb}%</p>
                    </div>
                  </div>
                  {riskSummary.topFlags.length > 0 && (
                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-md">
                      <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">Top Red Flags Found:</p>
                      <ul className="list-disc list-inside text-xs text-red-600 font-medium space-y-1">
                        {riskSummary.topFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rep Performance */}
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6 flex items-center">
                <UsersIcon className="w-6 h-6 mr-2 text-[var(--color-primary)]" />
                Rep Effectiveness
              </h3>
              {!repPerformanceSummary ? (
                <p className="text-[var(--color-text-secondary)] text-center">No rep performance data.</p>
              ) : (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={repPerformanceSummary} layout="vertical">
                      <XAxis type="number" domain={[0, 10]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} width={70} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)', borderRadius: '8px' }}
                      />
                      <Bar dataKey="score" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Buying Signals */}
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6 flex items-center">
                <PieChartIcon className="w-6 h-6 mr-2 text-emerald-500" />
                Buying Signal Mix
              </h3>
              {!buyingSignalsSummary ? (
                <p className="text-[var(--color-text-secondary)] text-center">No buying signals detected.</p>
              ) : (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={buyingSignalsSummary}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {buyingSignalsSummary.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-default)', borderRadius: '8px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Customer Insights */}
          <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
            <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
              <CustomersIcon className="w-6 h-6 mr-2 text-[var(--color-primary)]" />
              Customer Insights
            </h3>
            {totalCustomers === 0 ? (
              <p className="text-[var(--color-text-secondary)]">No customers to display insights for. Add one via Customer Management.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerInsights.map((insight) => (
                  <div key={insight.customerName} className={`p-4 rounded-md border-2 ${getCustomerCategoryColors(insight.customerCategory)}`}>
                    <p className="text-lg font-bold mb-2 flex items-center">
                       {insight.customerCategory === CustomerCategory.ENTHUSIASTIC && <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />}
                       {insight.customerCategory === CustomerCategory.POTENTIAL && <ListBulletIcon className="w-5 h-5 mr-2" />}
                       {insight.customerCategory === CustomerCategory.NEEDS_ATTENTION && <InfoCircleIcon className="w-5 h-5 mr-2" />}
                       {insight.customerCategory === CustomerCategory.GENERAL && <UsersIcon className="w-5 h-5 mr-2" />}
                      {insight.customerName}
                    </p>
                    <p className="text-sm">Meetings: <span className="font-medium">{insight.meetingCount}</span></p>
                    <p className="text-sm">Calls: <span className="font-medium">{insight.callCount}</span></p>
                    {insight.callCount > 0 && (
                      <div className="mt-2 pt-2 border-t border-[var(--color-border-default)]">
                        <p className="text-sm font-semibold mb-1">Call Vibe Breakdown:</p>
                        <ul className="list-disc list-inside text-xs">
                          {Object.entries(insight.vibeBreakdown).map(([vibe, count]) => (
                            <li key={`${insight.customerName}-${vibe}`}>{vibe}: {count}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                     <div className="mt-2 pt-2 border-t border-[var(--color-border-default)]">
                      <p className="text-xs font-bold uppercase tracking-wider">Category:</p>
                      <p className="text-sm font-semibold">{insight.customerCategory}</p>
                    </div>
                    {/* NEW: Display Arc Summaries */}
                    <div className="mt-2 pt-2 border-t border-[var(--color-border-default)]">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1">Overall Trends:</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{insight.overallMomentumArc}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{insight.overallVibeArc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;