
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth, useTheme } from '../App';
import { Meeting, Call } from '../types';
import { demoService } from '../services/demoService';
import LoadingSpinner from './LoadingSpinner';
import CallCard from './CallCard';
import { PlusIcon, EditIcon, DeleteIcon, CheckIcon, XMarkIcon, CalendarIcon, ListBulletIcon } from './Icons'; 

interface MeetingListProps {
  meetings: Meeting[];
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
  calls: Call[]; // All calls, to filter by meeting
  getUserSuffix: (userId: string) => string; // New prop
  cleanNameForDisplay: (nameWithSuffix: string, userId: string) => string; // New prop
}

const MeetingList: React.FC<MeetingListProps> = ({
  meetings,
  setMeetings,
  calls,
  getUserSuffix,
  cleanNameForDisplay,
}) => {
  const { session, isDemoMode } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMeetingName, setNewMeetingName] = useState('');
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editingMeetingName, setEditingMeetingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    if (!session?.user?.id) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    if (isDemoMode) {
      console.log('[MeetingList] Demo Mode active. Fetching from demoService.');
      const demoMeetings = demoService.getMeetings();
      setMeetings(demoMeetings);
      if (demoMeetings.length > 0 && !selectedMeetingId) {
        setSelectedMeetingId(demoMeetings[0].id);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      // Clean names for display before setting state
      const cleanedMeetings = (data || []).map(m => ({
        ...m,
        name: cleanNameForDisplay(m.name, session.user.id)
      }));
      setMeetings(cleanedMeetings);

      if (cleanedMeetings.length > 0 && !selectedMeetingId) {
        setSelectedMeetingId(cleanedMeetings[0].id); // Select the most recent meeting by default
      }
    } catch (err: any) {
      console.error('Error fetching meetings:', err.message);
      setError('Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, setMeetings, cleanNameForDisplay, selectedMeetingId]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleAddMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingName.trim() || !session?.user?.id) return;

    // Validate for duplicate names (case-insensitive)
    const normalizedNewName = newMeetingName.trim().toLowerCase();
    if (meetings.some(m => m.name.toLowerCase() === normalizedNewName)) {
      setError(`A meeting named "${newMeetingName.trim()}" already exists.`);
      return;
    }

    setLoading(true);
    setError('');

    if (isDemoMode) {
      const newMeet: Meeting = {
        id: `demo-meet-${Date.now()}`,
        user_id: session.user.id,
        name: newMeetingName.trim(),
        created_at: new Date().toISOString()
      };
      const saved = demoService.saveMeeting(newMeet);
      setMeetings((prev) => [saved, ...prev]);
      setNewMeetingName('');
      setSelectedMeetingId(saved.id);
      setLoading(false);
      return;
    }

    try {
      const nameWithSuffix = newMeetingName.trim() + getUserSuffix(session.user.id);
      const { data, error: insertError } = await supabase
        .from('meetings')
        .insert({ user_id: session.user.id, name: nameWithSuffix })
        .select()
        .single();

      if (insertError) throw insertError;

      // Clean the name for display before adding to local state
      const cleanedData = { ...data, name: cleanNameForDisplay(data.name, session.user.id) };
      setMeetings((prev) => [cleanedData, ...prev]); // Add new meeting to the top
      setNewMeetingName('');
      setSelectedMeetingId(cleanedData.id); // Select the newly created meeting
    } catch (err: any) {
      console.error('Error adding meeting:', err.message);
      setError(`Failed to add meeting: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeetingId || !editingMeetingName.trim() || !session?.user?.id) return;

    // Validate for duplicate names (case-insensitive, excluding the current meeting being edited)
    const normalizedEditingName = editingMeetingName.trim().toLowerCase();
    if (meetings.some(m => m.id !== editingMeetingId && m.name.toLowerCase() === normalizedEditingName)) {
      setError(`A meeting named "${editingMeetingName.trim()}" already exists.`);
      return;
    }

    setLoading(true);
    setError('');

    if (isDemoMode) {
      const updatedMeet: Meeting = {
        ...meetings.find(m => m.id === editingMeetingId)!,
        name: editingMeetingName.trim()
      };
      demoService.updateMeeting(updatedMeet);
      setMeetings((prev) =>
        prev.map((m) => (m.id === editingMeetingId ? updatedMeet : m)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
      setEditingMeetingId(null);
      setEditingMeetingName('');
      setLoading(false);
      return;
    }

    try {
      const nameWithSuffix = editingMeetingName.trim() + getUserSuffix(session.user.id);
      const { data, error: updateError } = await supabase
        .from('meetings')
        .update({ name: nameWithSuffix })
        .eq('id', editingMeetingId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Clean the name for display before updating local state
      const cleanedData = { ...data, name: cleanNameForDisplay(data.name, session.user.id) };
      setMeetings((prev) =>
        prev.map((m) => (m.id === editingMeetingId ? cleanedData : m)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
      setEditingMeetingId(null);
      setEditingMeetingName('');
    } catch (err: any) {
      console.error('Error updating meeting:', err.message);
      setError(`Failed to update meeting: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError('');

    if (isDemoMode) {
      demoService.deleteMeeting(meetingId);
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      setConfirmDeleteId(null);
      setSelectedMeetingId(null);
      setLoading(false);
      return;
    }

    try {
      const { error: updateCallsError } = await supabase
        .from('calls')
        .update({ meeting_id: null, meeting_name: null }) // Cleared names for linked calls
        .eq('meeting_id', meetingId)
        .eq('user_id', session.user.id);

      if (updateCallsError) {
        throw updateCallsError;
      }

      // Then delete the meeting
      const { error: deleteError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)
        .eq('user_id', session.user.id);

      if (deleteError) throw deleteError;

      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      setConfirmDeleteId(null);
      setSelectedMeetingId(null); // Deselect the meeting if it was deleted
    } catch (err: any) {
      console.error('Error deleting meeting:', err.message);
      setError(`Failed to delete meeting: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalls = selectedMeetingId
    ? calls.filter((call) => call.meeting_id === selectedMeetingId)
    : [];

  return (
    <div className="space-y-8" style={{ fontFamily: 'inherit' }}>

      {error && <p className="text-[var(--color-error)] text-center mb-4">{error}</p>}

      {/* Add New Meeting Form */}
      <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Add New Meeting</h3>
        <form onSubmit={handleAddMeeting} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Meeting Name"
            value={newMeetingName}
            onChange={(e) => { setNewMeetingName(e.target.value); setError(''); }}
            className="flex-grow px-4 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)]"
            disabled={loading}
            required
            style={{ fontFamily: 'inherit' }}
          />
          <button
            type="submit"
            className="flex items-center justify-center px-6 py-2 bg-[var(--color-primary)] text-white font-medium rounded-md shadow-sm hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 transition-colors duration-200"
            disabled={loading || !newMeetingName.trim()}
            style={{ fontFamily: 'inherit' }}
          >
            {loading ? <LoadingSpinner className="h-5 w-5 mr-2" /> : <PlusIcon className="w-5 h-5 mr-2" />}
            Add Meeting
          </button>
        </form>
      </div>

      {/* Meetings List and Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meetings List */}
        <div className="lg:col-span-1 bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Your Meetings</h3>
          {loading && meetings.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner />
              <p className="ml-2 text-[var(--color-text-secondary)]" style={{ fontFamily: 'inherit' }}>Loading meetings...</p>
            </div>
          ) : meetings.length === 0 ? (
            <p className="text-[var(--color-text-secondary)] text-center py-8" style={{ fontFamily: 'inherit' }}>No meetings found. Add one above!</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border-default)]">
              {meetings.map((meeting) => (
                <li
                  key={meeting.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 cursor-pointer group rounded-md
                    ${selectedMeetingId === meeting.id ? 'bg-[var(--color-primary)] bg-opacity-20' : 'hover:bg-[var(--color-bg-card-hover)]'}
                    transition-colors duration-200 px-2`}
                  onClick={() => setSelectedMeetingId(meeting.id)}
                >
                  {editingMeetingId === meeting.id ? (
                    <form onSubmit={handleEditMeeting} className="flex-grow flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={editingMeetingName}
                        onChange={(e) => { setEditingMeetingName(e.target.value); setError(''); }}
                        className="flex-grow px-3 py-1 border border-[var(--color-border-default)] rounded-md shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)]"
                        disabled={loading}
                        required
                        style={{ fontFamily: 'inherit' }}
                      />
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <button
                          type="submit"
                          className="flex items-center px-3 py-1 bg-[var(--color-success)] text-white text-sm rounded-md hover:bg-[var(--color-success)]/[0.8] disabled:opacity-50 transition-colors duration-200"
                          disabled={loading || !editingMeetingName.trim()}
                          style={{ fontFamily: 'inherit' }}
                        >
                          <CheckIcon className="w-4 h-4 mr-1" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingMeetingId(null); setEditingMeetingName(''); setError(''); }}
                          className="flex items-center px-3 py-1 bg-[var(--color-border-default)] text-[var(--color-text-primary)] text-sm rounded-md hover:bg-[var(--color-border-default)]/[0.8] disabled:opacity-50 transition-colors duration-200"
                          disabled={loading}
                          style={{ fontFamily: 'inherit' }}
                        >
                          <XMarkIcon className="w-4 h-4 mr-1" /> Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <CalendarIcon className={`w-5 h-5 mr-2 ${selectedMeetingId === meeting.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`} />
                        <span className="text-lg text-[var(--color-text-primary)] font-medium" style={{ fontFamily: 'inherit' }}>
                          {meeting.name}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingMeetingId(meeting.id); setEditingMeetingName(meeting.name); setError(''); }}
                          className="flex items-center px-3 py-1 bg-[var(--color-primary)] text-white text-sm rounded-md hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors duration-200"
                          disabled={loading}
                          style={{ fontFamily: 'inherit' }}
                        >
                          <EditIcon className="w-4 h-4 mr-1" /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(meeting.id); }}
                          className="flex items-center px-3 py-1 bg-[var(--color-error)] text-white text-sm rounded-md hover:bg-[var(--color-error)]/[0.8] disabled:opacity-50 transition-colors duration-200"
                          disabled={loading}
                          style={{ fontFamily: 'inherit' }}
                        >
                          <DeleteIcon className="w-4 h-4 mr-1" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                  {confirmDeleteId === meeting.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                      <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-2xl max-w-sm w-full text-center relative" style={{ fontFamily: 'inherit' }}>
                        <p className="text-lg text-[var(--color-text-primary)] mb-4" style={{ fontFamily: 'inherit' }}>
                          Are you sure you want to delete "{meeting.name}"?
                          This will also unset this meeting from any associated calls.
                        </p>
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="px-4 py-2 bg-[var(--color-error)] text-white rounded-md hover:bg-[var(--color-error)]/[0.8] disabled:opacity-50 transition-colors duration-200"
                            disabled={loading}
                            style={{ fontFamily: 'inherit' }}
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2 bg-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-md hover:bg-[var(--color-border-default)]/[0.8] disabled:opacity-50 transition-colors duration-200"
                            disabled={loading}
                            style={{ fontFamily: 'inherit' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Associated Calls */}
        <div className="lg:col-span-2 bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
            <ListBulletIcon className="w-5 h-5 mr-2 text-[var(--color-primary)]" />
            Calls for {meetings.find(m => m.id === selectedMeetingId)?.name || 'Selected Meeting'}
          </h3>
          {loading && (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner />
              <p className="ml-2 text-[var(--color-text-secondary)]" style={{ fontFamily: 'inherit' }}>Loading calls...</p>
            </div>
          )}
          {!loading && filteredCalls.length === 0 ? (
            <p className="text-[var(--color-text-secondary)] text-center py-8" style={{ fontFamily: 'inherit' }}>
              No calls found for this meeting.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCalls.map((call) => (
                <CallCard key={call.id} call={call} onSelectCall={() => { /* No direct selection in this view */ }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingList;