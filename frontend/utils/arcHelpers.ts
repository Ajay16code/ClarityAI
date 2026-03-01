
import { Call, DealMomentum, VibeCategory } from '../types';

/**
 * Calculates the overall deal momentum arc from a list of calls.
 * Considers the trend of individual call momentum over time.
 * @param calls A sorted array of calls (most recent first) for a specific customer/meeting.
 * @returns A string describing the overall momentum arc.
 */
export function getOverallDealMomentumArc(calls: Call[]): string {
  if (calls.length === 0) {
    return "No calls to determine momentum arc.";
  }
  if (calls.length === 1) {
    return `New deal initiated: ${calls[0].deal_momentum}.`;
  }

  // Analyze the trend over the last few calls, e.g., 3-5 calls
  const recentCalls = calls.slice(0, Math.min(calls.length, 5));
  let increasingCount = 0;
  let coolingCount = 0;
  let stableCount = 0;
  let newCount = 0;

  for (const call of recentCalls) {
    if (call.deal_momentum === DealMomentum.INCREASING) {
      increasingCount++;
    } else if (call.deal_momentum === DealMomentum.COOLING) {
      coolingCount++;
    } else if (call.deal_momentum === DealMomentum.STABLE) {
      stableCount++;
    } else if (call.deal_momentum === DealMomentum.NEW) {
        newCount++;
    }
  }

  if (increasingCount > coolingCount && increasingCount > stableCount) {
    return "Overall Deal Momentum: Increasing (Positive trend over recent interactions).";
  } else if (coolingCount > increasingCount && coolingCount > stableCount) {
    return "Overall Deal Momentum: Cooling (Negative trend, potential risks detected).";
  } else if (stableCount > increasingCount && stableCount > coolingCount) {
    return "Overall Deal Momentum: Stable (Consistent progress, no significant shifts).";
  } else if (newCount > 0 && recentCalls.length === 1) {
    return "Overall Deal Momentum: New (First interaction, setting baseline).";
  } else if (calls.length > 1 && increasingCount === 0 && coolingCount === 0 && stableCount === 0) {
      return "Overall Deal Momentum: Undetermined (Inconsistent or insufficient data for a clear trend).";
  }


  return "Overall Deal Momentum: Mixed (Fluctuating trends across recent calls).";
}

/**
 * Calculates the overall vibe arc from a list of calls.
 * Aggregates vibe categories to provide a summary of sentiment trend.
 * @param calls A sorted array of calls (most recent first) for a specific customer/meeting.
 * @returns A string describing the overall vibe arc.
 */
export function getOverallVibeArc(calls: Call[]): string {
  if (calls.length === 0) {
    return "No calls to determine vibe arc.";
  }
  if (calls.length === 1) {
    return `Initial Vibe: ${calls[0].vibe_category} (${calls[0].vibe_summary.substring(0, 50)}...).`;
  }

  const vibeCounts = calls.reduce((acc, call) => {
    acc[call.vibe_category] = (acc[call.vibe_category] || 0) + 1;
    return acc;
  }, {} as Record<VibeCategory, number>);

  const totalCalls = calls.length;

  const positivePercentage = ((vibeCounts[VibeCategory.POSITIVE] || 0) / totalCalls) * 100;
  const negativePercentage = ((vibeCounts[VibeCategory.NEGATIVE] || 0) / totalCalls) * 100;
  const mixedPercentage = ((vibeCounts[VibeCategory.MIXED] || 0) / totalCalls) * 100;
  const neutralPercentage = ((vibeCounts[VibeCategory.NEUTRAL] || 0) / totalCalls) * 100;

  if (positivePercentage > 60) {
    return `Overall Vibe: Strongly Positive (${positivePercentage.toFixed(0)}% positive calls).`;
  } else if (negativePercentage > 50) {
    return `Overall Vibe: Predominantly Negative (${negativePercentage.toFixed(0)}% negative calls).`;
  } else if (mixedPercentage > 40 && positivePercentage > 20 && negativePercentage > 20) {
    return `Overall Vibe: Highly Mixed (Significant positive and negative sentiments).`;
  } else if (neutralPercentage > 70) {
    return `Overall Vibe: Mostly Neutral (Factual, less emotional interactions).`;
  } else if (positivePercentage > 30 && negativePercentage < 20) {
    return `Overall Vibe: Generally Positive (Some positive sentiment, few concerns).`;
  } else if (negativePercentage > 30 && positivePercentage < 20) {
    return `Overall Vibe: Generally Negative (Some concerns, few positives).`;
  }

  return `Overall Vibe: Undetermined (Diverse sentiments across ${totalCalls} calls).`;
}
