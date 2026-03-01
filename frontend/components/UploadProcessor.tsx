
import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
// --- MODIFIED: Import new analysis functions ---
import { analyzeAudioContent, analyzeTextContent, analyzeJsonContent, fileToBase64, categorizeVibe } from '../services/geminiService';
import { useAuth, useTheme } from '../App';
import { Call, Customer, Meeting, DealMomentum, VibeCategory, GeminiCallAnalysisResult } from '../types';
import { demoService } from '../services/demoService';
import LoadingSpinner from './LoadingSpinner';
import { XCircleIcon, ArrowTrendingUpIcon, PieChartIcon } from './Icons'; // Added icons for arc summary
import { getOverallDealMomentumArc, getOverallVibeArc } from '../utils/arcHelpers'; // NEW: Import arc helpers
import VibeBadge from './VibeBadge'; // Import VibeBadge for consistent display

interface UploadProcessorProps {
  file: File;
  onUploadComplete: (newCall: Call) => void;
  onCancel: () => void;
  allCalls: Call[]; // Changed from previousCalls to allCalls for full context
  customers: Customer[];
  meetings: Meeting[];
  getUserSuffix: (userId: string) => string; // New prop for user-specific suffix
  cleanNameForDisplay: (nameWithSuffix: string, userId: string) => string; // New prop to clean names for display
  onAddCustomer: (customer: Customer) => void; // Callback to add new customer to global state
  onAddMeeting: (meeting: Meeting) => void;   // Callback to add new meeting to global state
}

const UploadProcessor: React.FC<UploadProcessorProps> = ({
  file,
  onUploadComplete,
  onCancel,
  allCalls, // Use allCalls here
  customers,
  meetings,
  getUserSuffix,
  cleanNameForDisplay,
  onAddCustomer,
  onAddMeeting,
}) => {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [error, setError] = useState('');
  const [removeSilences, setRemoveSilences] = useState(false);

  // Customer states (managed locally for form input)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  // Meeting states (managed locally for form input)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isAddingNewMeeting, setIsAddingNewMeeting] = useState(false);
  const [newMeetingName, setNewMeetingName] = useState('');

  // NEW: State for displaying analysis summary after processing
  const [analysisResultData, setAnalysisResultData] = useState<{ newCall: Call; customerName: string | null; meetingName: string | null; } | null>(null);
  const [showAnalysisSummary, setShowAnalysisSummary] = useState(false);
  const [saveInfo, setSaveInfo] = useState<{ target: 'supabase' | 'demo'; verified: boolean; callId: string | null; fileUrl: string | null } | null>(null);


  const { session, isDemoMode } = useAuth();
  const { theme } = useTheme();

  // Pre-select logic for customers and meetings based on available data
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId && !isAddingNewCustomer) {
      const defaultCustomer = customers.find(c => c.name === 'Default Customer') || customers[0];
      setSelectedCustomerId(defaultCustomer.id);
    }
  }, [customers, selectedCustomerId, isAddingNewCustomer]); // Removed setSelectedCustomerId, setIsAddingNewCustomer

  useEffect(() => {
    if (meetings.length > 0 && !selectedMeetingId && !isAddingNewMeeting) {
      const defaultMeeting = meetings.find(m => m.name === 'Default Meeting') || meetings[0];
      setSelectedMeetingId(defaultMeeting.id);
    }
  }, [meetings, selectedMeetingId, isAddingNewMeeting]); // Removed setSelectedMeetingId, setIsAddingNewMeeting

  const handleCustomerSelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new-customer') {
      setIsAddingNewCustomer(true);
      setSelectedCustomerId(null);
      setNewCustomerName('');
    } else {
      setIsAddingNewCustomer(false);
      setSelectedCustomerId(value);
      setNewCustomerName('');
    }
    setError(''); // Clear error on selection change
  }, []); // All setters are stable

  const handleMeetingSelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new-meeting') {
      setIsAddingNewMeeting(true);
      setSelectedMeetingId(null);
      setNewMeetingName('');
    } else {
      setIsAddingNewMeeting(false);
      setSelectedMeetingId(value);
      setNewMeetingName('');
    }
    setError(''); // Clear error on selection change
  }, []); // All setters are stable

  const isFormValid = useCallback(() => {
    const customerValid = (selectedCustomerId !== null) || (isAddingNewCustomer && newCustomerName.trim() !== '');
    const meetingValid = (selectedMeetingId !== null) || (isAddingNewMeeting && newMeetingName.trim() !== '');
    return customerValid && meetingValid;
  }, [selectedCustomerId, isAddingNewCustomer, newCustomerName, selectedMeetingId, isAddingNewMeeting, newMeetingName]);


  const processFile = async () => {
    if (!session?.user?.id) {
      setError('User not authenticated. Please log in again.');
      return;
    }
    if (!file) {
      setError('No file selected for processing.');
      return;
    }
    if (!isFormValid()) {
      setError('Please select or add a customer and a meeting to proceed.');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setUploadMessage('Starting processing...');
    setError(''); // Clear previous errors
    setSaveInfo(null);

    try {
      console.log('User ID for Supabase operations:', session.user.id);

      // Customer Processing
      let finalCustomerId = selectedCustomerId;
      let finalCustomerNameForCall: string | null = null; // This will store the CLEAN name for the 'calls' table

      if (isAddingNewCustomer) {
        setUploadMessage(`Creating new customer: ${newCustomerName.trim()}...`);
        const customerNameWithSuffix = newCustomerName.trim() + getUserSuffix(session.user.id);

        if (isDemoMode) {
          const newCust = demoService.saveCustomer({
            id: `demo-cust-${Date.now()}`,
            user_id: session.user.id,
            name: newCustomerName.trim(),
            created_at: new Date().toISOString()
          });
          finalCustomerId = newCust.id;
          finalCustomerNameForCall = newCustomerName.trim();
          onAddCustomer(newCust);
        } else {
          // Check for duplicate BEFORE inserting
          const { data: existingCustomers, error: fetchExistingError } = await supabase
            .from('customers')
            .select('id, name')
            .eq('user_id', session.user.id)
            .eq('name', customerNameWithSuffix);

          if (fetchExistingError) throw fetchExistingError;
          if (existingCustomers && existingCustomers.length > 0) {
            throw new Error(`Customer with name "${newCustomerName.trim()}" already exists.`);
          }

          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({ user_id: session.user.id, name: customerNameWithSuffix })
            .select('*')
            .single();
          if (customerError) {
            throw customerError;
          }
          finalCustomerId = newCustomer.id;
          finalCustomerNameForCall = newCustomerName.trim(); // Store the CLEAN name in the call record
          onAddCustomer(newCustomer); // Notify App.tsx to update global customer list
        }
      } else if (selectedCustomerId) {
        finalCustomerNameForCall = customers.find(c => c.id === selectedCustomerId)?.name || null;
      }

      // Meeting Processing
      let finalMeetingId = selectedMeetingId;
      let finalMeetingNameForCall: string | null = null; // This will store the CLEAN name for the 'calls' table

      if (isAddingNewMeeting) {
        setUploadMessage(`Creating new meeting: ${newMeetingName.trim()}...`);
        const meetingNameWithSuffix = newMeetingName.trim() + getUserSuffix(session.user.id);

        if (isDemoMode) {
          const newMeet = demoService.saveMeeting({
            id: `demo-meet-${Date.now()}`,
            user_id: session.user.id,
            name: newMeetingName.trim(),
            created_at: new Date().toISOString()
          });
          finalMeetingId = newMeet.id;
          finalMeetingNameForCall = newMeetingName.trim();
          onAddMeeting(newMeet);
        } else {
          // Check for duplicate BEFORE inserting
          const { data: existingMeetings, error: fetchExistingError } = await supabase
            .from('meetings')
            .select('id, name')
            .eq('user_id', session.user.id)
            .eq('name', meetingNameWithSuffix);

          if (fetchExistingError) throw fetchExistingError;
          if (existingMeetings && existingMeetings.length > 0) {
            throw new Error(`Meeting with name "${newMeetingName.trim()}" already exists.`);
          }

          const { data: newMeeting, error: meetingError } = await supabase
            .from('meetings')
            .insert({ user_id: session.user.id, name: meetingNameWithSuffix })
            .select('*')
            .single();
          if (meetingError) {
            throw meetingError;
          }
          finalMeetingId = newMeeting.id;
          finalMeetingNameForCall = newMeetingName.trim(); // Store the CLEAN name in the call record
          onAddMeeting(newMeeting); // Notify App.tsx to update global meeting list
        }
      } else if (selectedMeetingId) {
        finalMeetingNameForCall = meetings.find(m => m.id === selectedMeetingId)?.name || null;
      }

      // --- NEW: File type detection and processing ---
      const mimeType = file.type || 'application/octet-stream'; // Default if type is unknown
      let analysisResult: GeminiCallAnalysisResult;

      if (mimeType.startsWith('audio/')) {
        setUploadMessage('Converting audio to Base64 and analyzing with Gemini...');
        const base64Audio = await fileToBase64(file);
        // Pass allCalls for a comprehensive history for momentum calculation
        analysisResult = await analyzeAudioContent(base64Audio, mimeType, allCalls.filter(c => c.customer_id === finalCustomerId || c.meeting_id === finalMeetingId));
      } else if (mimeType === 'text/plain') {
        setUploadMessage('Reading text file and analyzing with Gemini...');
        const fileContent = await file.text(); // Read plain text content
        analysisResult = await analyzeTextContent(fileContent, allCalls.filter(c => c.customer_id === finalCustomerId || c.meeting_id === finalMeetingId));
      } else if (mimeType === 'application/json') {
        setUploadMessage('Reading JSON file and analyzing content...');
        const fileContent = await file.text(); // Read JSON content as string
        analysisResult = await analyzeJsonContent(fileContent, allCalls.filter(c => c.customer_id === finalCustomerId || c.meeting_id === finalMeetingId));
      } else {
        throw new Error(`Unsupported file type: ${mimeType}. Please upload an audio, plain text (.txt), or JSON (.json) file.`);
      }

      // --- Handle "Remove Silences" (simulated) - only for audio. Skip for text/json ---
      if (removeSilences && mimeType.startsWith('audio/')) {
        setUploadMessage('Simulating silence removal (this is a placeholder for a complex feature)...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
      } else if (removeSilences && !mimeType.startsWith('audio/')) {
        console.warn('Silence removal is only applicable to audio files. Skipping for text/JSON.');
      }

      setUploadMessage('Uploading file to storage...');
      let fileUrl = 'https://picsum.photos/200/300'; // Placeholder for demo

      if (!isDemoMode) {
        // 1. Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;
        // Note: Supabase bucket is 'call-audio'. For broader file types, consider renaming bucket to 'call-files' in Supabase.
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('call-audio')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('call-audio')
          .getPublicUrl(filePath);

        fileUrl = publicUrlData.publicUrl;
      }

      setUploadMessage('Saving analysis to database...');
      // 4. Save analysis results to Supabase Database
      let newCallData: Call;

      if (isDemoMode) {
        newCallData = demoService.saveCall({
          id: `demo-call-${Date.now()}`,
          user_id: session.user.id,
          file_url: fileUrl,
          file_name: file.name,
          transcription: analysisResult.transcription,
          bant_budget: analysisResult.bant.budget,
          bant_authority: analysisResult.bant.authority,
          bant_need: analysisResult.bant.need,
          bant_timeline: analysisResult.bant.timeline,
          vibe_summary: analysisResult.vibeSummary,
          deal_momentum: analysisResult.dealMomentum,
          vibe_category: analysisResult.vibeCategory,
          customer_id: finalCustomerId,
          customer_name: finalCustomerNameForCall,
          meeting_id: finalMeetingId,
          meeting_name: finalMeetingNameForCall,
          sentiment_analysis: analysisResult.sentiment,
          engagement_metrics: analysisResult.engagement,
          momentum_engine: analysisResult.momentum,
          buying_signals: analysisResult.buyingSignals,
          rep_effectiveness: analysisResult.repEffectiveness,
          risk_engine: analysisResult.riskEngine,
          unified_deal_health_score: analysisResult.unifiedDealHealthScore,
          geography: analysisResult.geography,
          product: analysisResult.product,
          created_at: new Date().toISOString()
        } as Call);
        setSaveInfo({
          target: 'demo',
          verified: true,
          callId: newCallData.id,
          fileUrl: newCallData.file_url,
        });
      } else {
        const { data, error: insertError } = await supabase
          .from('calls')
          .insert({
            user_id: session.user.id,
            file_url: fileUrl,
            file_name: file.name,
            transcription: analysisResult.transcription,
            bant_budget: analysisResult.bant.budget,
            bant_authority: analysisResult.bant.authority,
            bant_need: analysisResult.bant.need,
            bant_timeline: analysisResult.bant.timeline,
            vibe_summary: analysisResult.vibeSummary,
            deal_momentum: analysisResult.dealMomentum,
            vibe_category: analysisResult.vibeCategory, // NEW: Save vibe category
            raw_gemini_response: analysisResult.rawResponse,
            customer_id: finalCustomerId,
            customer_name: finalCustomerNameForCall, // Store the CLEAN name
            meeting_id: finalMeetingId,
            meeting_name: finalMeetingNameForCall,   // Store the CLEAN name
            sentiment_analysis: analysisResult.sentiment,
            engagement_metrics: analysisResult.engagement,
            momentum_engine: analysisResult.momentum,
            buying_signals: analysisResult.buyingSignals,
            rep_effectiveness: analysisResult.repEffectiveness,
            risk_engine: analysisResult.riskEngine,
            unified_deal_health_score: analysisResult.unifiedDealHealthScore,
            geography: analysisResult.geography,
            product: analysisResult.product,
          })
          .select('*')
          .single();

        if (insertError) {
          throw insertError;
        }
        newCallData = data;

        const { data: verifiedCall, error: verifyError } = await supabase
          .from('calls')
          .select('id, file_url')
          .eq('id', newCallData.id)
          .single();

        if (verifyError || !verifiedCall) {
          throw new Error('Call saved but verification failed. Please check Supabase connection and RLS policies.');
        }

        setSaveInfo({
          target: 'supabase',
          verified: true,
          callId: verifiedCall.id,
          fileUrl: verifiedCall.file_url,
        });
      }

      setUploadMessage(isDemoMode ? 'Analysis complete. Saved in demo local storage.' : 'Analysis complete and saved to Supabase successfully!');
      // NEW: Store results locally to display summary
      setAnalysisResultData({
        newCall: newCallData,
        customerName: finalCustomerNameForCall,
        meetingName: finalMeetingNameForCall
      });
      setShowAnalysisSummary(true); // Show the summary page
      // Do NOT call onUploadComplete here immediately. It will be called by the "Done" button.

    } catch (err: any) {
      console.error('Upload/Analysis error:', err.message);
      setError(`Failed to process content: ${err.message}`); // Generic error message
      setUploadMessage(''); // Clear message on error
      setSaveInfo(null);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // NEW: Component to display the arc summary
  const ArcSummary: React.FC<{ newCall: Call; customerName: string | null; meetingName: string | null; }> = useCallback(({ newCall, customerName, meetingName }) => {
    // Filter all calls relevant to the new call's customer and meeting, including the new call itself
    const relevantCalls = allCalls.filter(
      (call) =>
        (newCall.customer_id && call.customer_id === newCall.customer_id) ||
        (newCall.meeting_id && call.meeting_id === newCall.meeting_id)
    ).concat([newCall]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Ensure sorted by most recent first

    const momentumArc = getOverallDealMomentumArc(relevantCalls);
    const vibeArc = getOverallVibeArc(relevantCalls);

    return (
      <div className="mt-6 space-y-4 text-left">
        <h3 className="text-xl font-bold text-[var(--color-primary)]">Analysis Summary</h3>
        <p className="text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text-primary)]">File:</span> {newCall.file_name}
        </p>
        {customerName && (
          <p className="text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)]">Customer:</span> {customerName}
          </p>
        )}
        {meetingName && (
          <p className="text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)]">Meeting:</span> {meetingName}
          </p>
        )}

        <div className="border-t border-[var(--color-border-default)] pt-4 mt-4 space-y-3">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="w-6 h-6 mr-2 text-[var(--color-primary)]" />
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">Deal Momentum Arc:</p>
          </div>
          <p className="text-[var(--color-text-secondary)]">{momentumArc}</p>

          <div className="flex items-center mt-4">
            <PieChartIcon className="w-6 h-6 mr-2 text-[var(--color-primary)]" />
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">Overall Vibe Arc:</p>
          </div>
          <p className="text-[var(--color-text-secondary)]">{vibeArc}</p>
        </div>

        <div className="border-t border-[var(--color-border-default)] pt-4 mt-4">
          <p className="text-md font-semibold text-[var(--color-text-primary)] mb-2">New Call's Vibe:</p>
          <VibeBadge category={newCall.vibe_category} summary={newCall.vibe_summary} className="text-base" />
        </div>
        <div className="mt-2">
            <p className="text-md font-semibold text-[var(--color-text-primary)] mb-2">New Call's Momentum:</p>
            <span className={`inline-block px-3 py-1 text-base font-semibold rounded-full ${newCall.deal_momentum === DealMomentum.INCREASING ? 'bg-[var(--color-momentum-increasing-bg)] text-[var(--color-momentum-increasing-text)]' :
            newCall.deal_momentum === DealMomentum.COOLING ? 'bg-[var(--color-momentum-cooling-bg)] text-[var(--color-momentum-cooling-text)]' :
            newCall.deal_momentum === DealMomentum.STABLE ? 'bg-[var(--color-momentum-stable-bg)] text-[var(--color-momentum-stable-text)]' :
            newCall.deal_momentum === DealMomentum.NEW ? 'bg-[var(--color-momentum-new-bg)] text-[var(--color-momentum-new-text)]' :
            'bg-[var(--color-border-default)] text-[var(--color-text-secondary)]'}`}>
            {newCall.deal_momentum}
            </span>
        </div>
      </div>
    );
  }, [allCalls, cleanNameForDisplay, getUserSuffix]); // Dependencies for ArcSummary itself

  const handleDone = () => {
    if (analysisResultData) {
      onUploadComplete(analysisResultData.newCall);
    }
    onCancel(); // Close the modal
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-card)] p-8 rounded-lg shadow-2xl max-w-lg w-full text-center relative transition-colors duration-300" style={{ fontFamily: 'inherit' }}>
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors duration-200"
          aria-label="Cancel upload and analysis"
          disabled={loading || isSubmitting}
        >
          <XCircleIcon className="w-6 h-6" />
        </button>

        {showAnalysisSummary && analysisResultData ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-[var(--color-primary)]">Analysis Complete!</h2>
            {saveInfo && (
              <div className="mb-4 p-3 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-body)] text-left">
                <p className="text-sm text-[var(--color-text-primary)]">
                  <span className="font-semibold">Save Mode:</span> {saveInfo.target === 'supabase' ? 'Supabase Database + Storage' : 'Demo Mode (Local Browser Storage)'}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  <span className="font-semibold text-[var(--color-text-primary)]">Call ID:</span> {saveInfo.callId || 'N/A'}
                </p>
                {saveInfo.fileUrl && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1 break-all">
                    <span className="font-semibold text-[var(--color-text-primary)]">File URL:</span> {saveInfo.fileUrl}
                  </p>
                )}
                {saveInfo.target === 'supabase' && (
                  <p className="text-sm text-[var(--color-success)] mt-1">
                    Database save verified.
                  </p>
                )}
              </div>
            )}
            <ArcSummary
              newCall={analysisResultData.newCall}
              customerName={analysisResultData.customerName}
              meetingName={analysisResultData.meetingName}
            />
            <button
              onClick={handleDone}
              className="mt-6 px-8 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg shadow-md hover:bg-[var(--color-primary-dark)] transition-colors duration-200"
              style={{ fontFamily: 'inherit' }}
            >
              Done
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-[var(--color-primary)]">
              {loading ? 'Processing Content...' : 'Configure Content Details'}
            </h2>

            {file && (
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">File: <span className="font-semibold text-[var(--color-text-primary)]">{file.name}</span></p>
            )}

            {/* Customer Selection */}
            {!loading && (
              <div className="mb-4 text-left">
                <label htmlFor="customer-select" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Select Customer for this Content:
                </label>
                <select
                  id="customer-select"
                  value={isAddingNewCustomer ? 'new-customer' : (selectedCustomerId || '')}
                  onChange={handleCustomerSelectChange}
                  className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)] sm:text-sm"
                  disabled={loading || isSubmitting}
                  aria-required="true"
                  style={{ fontFamily: 'inherit' }}
                >
                  <option value="" disabled>Select a customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                  <option value="new-customer">--- Add New Customer ---</option>
                </select>
                {isAddingNewCustomer && (
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => { setNewCustomerName(e.target.value); setError(''); }} // Clear error on typing
                    placeholder="New Customer Name"
                    className="mt-2 block w-full px-3 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)] sm:text-sm"
                    disabled={loading || isSubmitting}
                    aria-label="New customer name"
                    aria-required="true"
                    style={{ fontFamily: 'inherit' }}
                  />
                )}
              </div>
            )}

            {/* Meeting Selection */}
            {!loading && (
              <div className="mb-4 text-left">
                <label htmlFor="meeting-select" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Select Meeting for this Content:
                </label>
                <select
                  id="meeting-select"
                  value={isAddingNewMeeting ? 'new-meeting' : (selectedMeetingId || '')}
                  onChange={handleMeetingSelectChange}
                  className="mt-1 block w-full px-3 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)] sm:text-sm"
                  disabled={loading || isSubmitting}
                  aria-required="true"
                  style={{ fontFamily: 'inherit' }}
                >
                  <option value="" disabled>Select a meeting...</option>
                  {meetings.map((meeting) => (
                    <option key={meeting.id} value={meeting.id}>
                      {meeting.name}
                    </option>
                  ))}
                  <option value="new-meeting">--- Create New Meeting ---</option>
                </select>
                {isAddingNewMeeting && (
                  <input
                    type="text"
                    value={newMeetingName}
                    onChange={(e) => { setNewMeetingName(e.target.value); setError(''); }} // Clear error on typing
                    placeholder="New Meeting Name"
                    className="mt-2 block w-full px-3 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)] sm:text-sm"
                    disabled={loading || isSubmitting}
                    aria-label="New meeting name"
                    aria-required="true"
                    style={{ fontFamily: 'inherit' }}
                  />
                )}
              </div>
            )}

            {/* Remove Silences Checkbox - only show for audio files */}
            {file && file.type.startsWith('audio/') && !loading && (
              <div className="flex items-center mt-4 mb-4 text-left">
                <input
                  id="remove-silences"
                  type="checkbox"
                  checked={removeSilences}
                  onChange={(e) => {
                    setRemoveSilences(e.target.checked);
                    if (e.target.checked) {
                      alert('Silence removal is a complex task usually handled server-side or with specialized libraries. For now, this is a placeholder UI feature.');
                    }
                  }}
                  className="h-4 w-4 text-[var(--color-primary)] rounded border-[var(--color-border-default)] focus:ring-[var(--color-primary)] bg-[var(--color-bg-body)]"
                  disabled={loading || isSubmitting}
                />
                <label htmlFor="remove-silences" className="ml-2 block text-sm text-[var(--color-text-primary)]" style={{ fontFamily: 'inherit' }}>
                  Remove Silences (beta)
                </label>
                <span className="relative ml-1 group">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[var(--color-text-secondary)] cursor-help">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.02M12 21a9 9 0 110-18 9 9 0 010 18zm-.375-7.005h.008v.008h-.008v-.008z" />
                  </svg>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-60 p-2 bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ fontFamily: 'inherit' }}>
                    Silence removal is a complex task usually handled server-side or with specialized libraries. For now, this is a placeholder UI feature.
                  </div>
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-[var(--color-error)] font-medium text-left mb-4" style={{ fontFamily: 'inherit' }}>{error}</p>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center space-x-4">
              {loading ? (
                <div className="my-6 flex flex-col items-center">
                  <LoadingSpinner className="h-12 w-12" />
                  <p className="mt-4 text-[var(--color-text-secondary)]" style={{ fontFamily: 'inherit' }}>{uploadMessage}</p>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]" style={{ fontFamily: 'inherit' }}>This may take a moment, please do not close this window.</p>
                </div>
              ) : error ? (
                <>
                  <button
                    onClick={processFile}
                    disabled={isSubmitting || !isFormValid() || !file || !session?.user?.id}
                    className="px-8 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg shadow-md hover:bg-[var(--color-primary-dark)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'inherit' }}
                  >
                    Retry Analysis
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-6 py-3 bg-[var(--color-border-default)] text-[var(--color-text-primary)] font-medium rounded-md shadow-sm hover:bg-[var(--color-border-default)]/[0.8] transition-colors duration-200"
                    style={{ fontFamily: 'inherit' }}
                  >
                    Close
                  </button>
                </>
              ) : ( // Initial state or after successful processing (before onUploadComplete closes)
                <button
                  onClick={processFile}
                  disabled={isSubmitting || !isFormValid() || !file || !session?.user?.id}
                  className="px-8 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg shadow-md hover:bg-[var(--color-primary-dark)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'inherit' }}
                >
                  Start Analysis
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadProcessor;