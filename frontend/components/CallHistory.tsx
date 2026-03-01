
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth, useTheme } from '../App';
import { Call, Customer, Meeting, DealMomentum, VibeCategory } from '../types';
import { demoService } from '../services/demoService';
import CallCard from './CallCard';
import LoadingSpinner from './LoadingSpinner';
import VibeBadge from './VibeBadge'; // Import VibeBadge
import { getOverallDealMomentumArc, getOverallVibeArc } from '../utils/arcHelpers'; // NEW: Import arc helpers
import { downloadCallReportPdf } from '../utils/callReportPdf';
import {
  TableCellsIcon,
  Squares2X2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
  ListBulletIcon, // Re-using ListBulletIcon for generic filter/sort UI
  ArrowTrendingUpIcon, // For momentum arc display
  PieChartIcon // For vibe arc display
} from './Icons';

interface CallHistoryProps {
  calls: Call[];
  setCalls: React.Dispatch<React.SetStateAction<Call[]>>;
  customers: Customer[]; // Added as prop
  meetings: Meeting[];   // Added as prop
  cleanNameForDisplay: (nameWithSuffix: string, userId: string) => string;
}

type ViewMode = 'table' | 'grid';
type SortKey = keyof Call | 'customer_name' | 'meeting_name';

const CallHistory: React.FC<CallHistoryProps> = ({ calls, setCalls, customers, meetings, cleanNameForDisplay }) => {
  const { session, isDemoMode } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true); // This loading state is for fetching calls
  const [error, setError] = useState('');
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table'); // Default to table view

  // States for filters
  const [filterCustomerId, setFilterCustomerId] = useState<string | 'all'>('all');
  const [filterMeetingId, setFilterMeetingId] = useState<string | 'all'>('all'); // NEW: Meeting filter
  const [filterMomentum, setFilterMomentum] = useState<DealMomentum | 'all'>('all');
  const [filterVibeCategory, setFilterVibeCategory] = useState<VibeCategory | 'all'>('all'); // NEW: Vibe Category Filter
  const [searchTerm, setSearchTerm] = useState('');

  const [sortBy, setSortBy] = useState<SortKey>('created_at'); // Default sort key
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Default sort direction

  const fetchCalls = useCallback(async () => {
    if (!session?.user?.id) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    if (isDemoMode) {
      console.log('[CallHistory] Demo Mode active. Fetching from demoService.');
      setCalls(demoService.getCalls());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      const rawCalls = data || [];
      const cleanedCalls = rawCalls.map((call: any) => ({
        ...call,
        customer_name: call.customer_id ? cleanNameForDisplay(call.customer_name || '', session.user.id) : call.customer_name,
        meeting_name: call.meeting_id ? cleanNameForDisplay(call.meeting_name || '', session.user.id) : call.meeting_name,
      }));

      setCalls(cleanedCalls);
    } catch (err: any) {
      console.error('Error fetching calls:', err.message);
      setError('Failed to load calls.');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, setCalls]); // setCalls is a stable setter

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const handleClearSelection = useCallback(() => {
    setSelectedCall(null);
  }, []); // setSelectedCall is a stable setter

  const handleDownloadReport = useCallback((event: React.MouseEvent<HTMLElement>, call: Call) => {
    event.stopPropagation();
    downloadCallReportPdf(call);
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc'); // Default to ascending when changing sort column
    }
  }, [sortBy]); // setSortDirection, setSortBy are stable setters

  const getSortIcon = useCallback((key: SortKey) => {
    if (sortBy === key) {
      return sortDirection === 'asc' ? (
        <ChevronUpIcon className="w-4 h-4 ml-1" />
      ) : (
        <ChevronDownIcon className="w-4 h-4 ml-1" />
      );
    }
    return null;
  }, [sortBy, sortDirection]);

  const filteredAndSortedCalls = useMemo(() => {
    let currentCalls = [...calls];

    // Apply text search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentCalls = currentCalls.filter(
        (call) =>
          call.file_name.toLowerCase().includes(lowerSearchTerm) ||
          call.transcription.toLowerCase().includes(lowerSearchTerm) ||
          (call.customer_name && call.customer_name.toLowerCase().includes(lowerSearchTerm)) ||
          (call.meeting_name && call.meeting_name.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Apply customer filter
    if (filterCustomerId !== 'all' && filterCustomerId !== null) {
      currentCalls = currentCalls.filter((call) => call.customer_id === filterCustomerId);
    }

    // Apply meeting filter (NEW)
    if (filterMeetingId !== 'all' && filterMeetingId !== null) {
      currentCalls = currentCalls.filter((call) => call.meeting_id === filterMeetingId);
    }

    // Apply momentum filter
    if (filterMomentum !== 'all') {
      currentCalls = currentCalls.filter((call) => call.deal_momentum === filterMomentum);
    }

    // Apply vibe category filter (NEW)
    if (filterVibeCategory !== 'all') {
      currentCalls = currentCalls.filter((call) => call.vibe_category === filterVibeCategory);
    }

    // Apply sorting
    currentCalls.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortBy === 'customer_name') {
        aValue = a.customer_name || '';
        bValue = b.customer_name || '';
      } else if (sortBy === 'meeting_name') {
        aValue = a.meeting_name || '';
        bValue = b.meeting_name || '';
      } else {
        aValue = a[sortBy];
        bValue = b[sortBy];
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // Fallback for dates or other types if needed
      if (sortBy === 'created_at') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    return currentCalls;
  }, [calls, searchTerm, filterCustomerId, filterMeetingId, filterMomentum, filterVibeCategory, sortBy, sortDirection]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCustomerId('all');
    setFilterMeetingId('all'); // Clear new filter
    setFilterMomentum('all');
    setFilterVibeCategory('all'); // Clear new filter
  }, []); // All setters are stable

  const momentumOptions = Object.values(DealMomentum).filter(
    (value) => typeof value === 'string'
  ) as DealMomentum[];

  const vibeCategoryOptions = Object.values(VibeCategory).filter(
    (value) => typeof value === 'string'
  ) as VibeCategory[];

  // Calculate arc summaries for currently filtered calls
  const overallMomentumArc = useMemo(() => getOverallDealMomentumArc(filteredAndSortedCalls), [filteredAndSortedCalls]);
  const overallVibeArc = useMemo(() => getOverallVibeArc(filteredAndSortedCalls), [filteredAndSortedCalls]);


  if (loading) { // Only check `loading` for calls, as customers/meetings are from props
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
        <p className="ml-2 text-[var(--color-text-secondary)]" style={{ fontFamily: 'inherit' }}>Loading call history...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-[var(--color-error)] text-center mb-4" style={{ fontFamily: 'inherit' }}>{error}</p>;
  }

  return (
    <div className="space-y-8" style={{ fontFamily: 'inherit' }}>
      {selectedCall ? (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-md border border-[var(--color-border-accent)] transition-colors duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-[var(--color-primary)]">Call Details</h3>
            <button
              onClick={handleClearSelection}
              className="px-4 py-2 bg-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-md hover:bg-[var(--color-border-default)]/[0.8] transition-colors duration-200"
              style={{ fontFamily: 'inherit' }}
            >
              Back to List
            </button>
          </div>
          <CallCard call={selectedCall} isDetailedView={true} onSelectCall={() => {}} />
        </div>
      ) : (
        <>
          {/* Controls: View Toggles, Filters, Clear Filters */}
          <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)] mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0">
              {/* View Toggles */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]'}`}
                  title="Table View"
                  aria-label="Switch to table view"
                >
                  <TableCellsIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]'}`}
                  title="Grid View"
                  aria-label="Switch to grid view"
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || filterCustomerId !== 'all' || filterMeetingId !== 'all' || filterMomentum !== 'all' || filterVibeCategory !== 'all') && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center px-4 py-2 bg-[var(--color-error)] text-white text-sm font-medium rounded-md hover:bg-[var(--color-error)]/[0.8] transition-colors duration-200"
                  style={{ fontFamily: 'inherit' }}
                >
                  <XMarkIcon className="w-4 h-4 mr-1" /> Clear Filters
                </button>
              )}
            </div>

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4"> {/* Adjusted grid columns for new filters */}
              {/* Search Term */}
              <input
                type="text"
                placeholder="Search file name, transcription..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)] sm:text-sm"
                style={{ fontFamily: 'inherit' }}
              />

              {/* Customer Filter */}
              <select
                value={filterCustomerId || 'all'}
                onChange={(e) => setFilterCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)] sm:text-sm"
                style={{ fontFamily: 'inherit' }}
              >
                <option value="all">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>

              {/* Meeting Filter (NEW) */}
              <select
                value={filterMeetingId || 'all'}
                onChange={(e) => setFilterMeetingId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)] sm:text-sm"
                style={{ fontFamily: 'inherit' }}
              >
                <option value="all">All Meetings</option>
                {meetings.map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    {meeting.name}
                  </option>
                ))}
              </select>

              {/* Momentum Filter */}
              <select
                value={filterMomentum}
                onChange={(e) => setFilterMomentum(e.target.value as DealMomentum | 'all')}
                className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)] sm:text-sm"
                style={{ fontFamily: 'inherit' }}
              >
                <option value="all">All Momentum</option>
                {momentumOptions.map((momentum) => (
                  <option key={momentum} value={momentum}>
                    {momentum}
                  </option>
                ))}
              </select>

              {/* Vibe Category Filter (NEW) */}
              <select
                value={filterVibeCategory}
                onChange={(e) => setFilterVibeCategory(e.target.value as VibeCategory | 'all')}
                className="w-full px-3 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)] sm:text-sm"
                style={{ fontFamily: 'inherit' }}
              >
                <option value="all">All Vibe Categories</option>
                {vibeCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Arc Summary for Filtered Results (NEW) */}
          {(filterCustomerId !== 'all' || filterMeetingId !== 'all') && filteredAndSortedCalls.length > 0 && (
            <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)] mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
                <ListBulletIcon className="w-5 h-5 mr-2 text-[var(--color-primary)]" />
                Overall Trends for Filtered Calls
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center text-md font-semibold text-[var(--color-text-primary)]">
                    <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-[var(--color-primary)]" /> Deal Momentum Arc:
                  </div>
                  <p className="ml-7 text-[var(--color-text-secondary)]">{overallMomentumArc}</p>
                </div>
                <div>
                  <div className="flex items-center text-md font-semibold text-[var(--color-text-primary)]">
                    <PieChartIcon className="w-5 h-5 mr-2 text-[var(--color-primary)]" /> Overall Vibe Arc:
                  </div>
                  <p className="ml-7 text-[var(--color-text-secondary)]">{overallVibeArc}</p>
                </div>
              </div>
            </div>
          )}

          {/* Render Calls based on ViewMode */}
          {filteredAndSortedCalls.length === 0 ? (
            <p className="col-span-full text-[var(--color-text-secondary)] text-center py-8" style={{ fontFamily: 'inherit' }}>
              {calls.length === 0
                ? 'No calls analyzed yet. Upload one via the Navbar to get started!'
                : 'No calls match your current filters.'}
            </p>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto bg-[var(--color-bg-card)] rounded-lg shadow-lg border border-[var(--color-border-default)]">
              <table className="min-w-full divide-y divide-[var(--color-border-default)]">
                <thead className="bg-[var(--color-bg-body)]">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-bg-card-hover)] transition-colors duration-200"
                      onClick={() => handleSort('file_name')}
                    >
                      <div className="flex items-center">
                        File Name {getSortIcon('file_name')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-bg-card-hover)] transition-colors duration-200"
                      onClick={() => handleSort('customer_name')}
                    >
                      <div className="flex items-center">
                        Customer {getSortIcon('customer_name')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-bg-card-hover)] transition-colors duration-200"
                      onClick={() => handleSort('meeting_name')}
                    >
                      <div className="flex items-center">
                        Meeting {getSortIcon('meeting_name')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-bg-card-hover)] transition-colors duration-200"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Date Analyzed {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-bg-card-hover)] transition-colors duration-200"
                      onClick={() => handleSort('deal_momentum')}
                    >
                      <div className="flex items-center">
                        Deal Momentum {getSortIcon('deal_momentum')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-bg-card-hover)] transition-colors duration-200"
                      onClick={() => handleSort('vibe_category')} // Sort by vibe category
                    >
                      <div className="flex items-center">
                        Vibe {getSortIcon('vibe_category')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-default)]">
                  {filteredAndSortedCalls.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className="hover:bg-[var(--color-bg-card-hover)] cursor-pointer transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)]">
                        {call.file_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                        {call.customer_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                        {call.meeting_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                        {new Date(call.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                        {call.deal_momentum}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                        {/* Use VibeBadge here */}
                        <VibeBadge category={call.vibe_category} summary={call.vibe_summary} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors p-2 inline-block"
                          onClick={(e) => handleDownloadReport(e, call)}
                          title="Download PDF Report"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> {/* Added xl:grid-cols-4 for more cards on larger screens */}
              {filteredAndSortedCalls.map((call) => (
                <CallCard key={call.id} call={call} onSelectCall={setSelectedCall} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CallHistory;
