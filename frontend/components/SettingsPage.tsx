

import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth, useTheme } from '../App';
import LoadingSpinner from './LoadingSpinner';
import { DeleteIcon, InfoCircleIcon } from './Icons';

const SettingsPage: React.FC = () => {
  const { session, setSession } = useAuth();
  const { theme } = useTheme(); // For font and styling consistency
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePurgeData = async () => {
    if (!session?.user?.id) {
      setError('Not authenticated. Please log in.');
      return;
    }

    if (!window.confirm('WARNING: Are you absolutely sure you want to delete ALL your data (calls, customers, meetings)? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const userId = session.user.id;

      // 1. Delete all calls for the user
      setError('Deleting call data...');
      const { error: callsDeleteError } = await supabase
        .from('calls')
        .delete()
        .eq('user_id', userId);
      if (callsDeleteError) throw callsDeleteError;
      console.log('Calls deleted.');

      // 2. Delete all meetings for the user
      setError('Deleting meeting data...');
      const { error: meetingsDeleteError } = await supabase
        .from('meetings')
        .delete()
        .eq('user_id', userId);
      if (meetingsDeleteError) throw meetingsDeleteError;
      console.log('Meetings deleted.');

      // 3. Delete all customers for the user
      setError('Deleting customer data...');
      const { error: customersDeleteError } = await supabase
        .from('customers')
        .delete()
        .eq('user_id', userId);
      if (customersDeleteError) throw customersDeleteError;
      console.log('Customers deleted.');

      // 4. Optionally, reset the user's profile (e.g., username) or delete the profile entry itself
      // For now, let's just update the username to a default one, not delete the profile record.
      // Deleting profile might have cascading effects on auth or be restricted by RLS.
      setError('Resetting user profile...');
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ username: `user_${userId.substring(0, 8)}` })
        .eq('id', userId);
      if (profileUpdateError) throw profileUpdateError;
      console.log('User profile reset.');


      // 5. Log the user out
      setError('Logging out...');
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) throw logoutError;
      console.log('Logged out.');

      setSuccessMessage('All your data has been purged successfully, and you have been logged out.');
      setSession(null); // Clear session state in App.tsx
      // Force a full page reload after logout to ensure all states are reset
      window.location.reload();

    } catch (err: any) {
      console.error('Purge data error:', err.message);
      setError(`Failed to purge data: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8" style={{ fontFamily: 'inherit' }}>
      <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-6">Application Settings</h2>

      {/* Purge Data Section */}
      <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4 flex items-center">
          <DeleteIcon className="w-6 h-6 mr-2 text-[var(--color-error)]" />
          Purge All My Data
        </h3>
        <p className="text-[var(--color-text-secondary)] mb-4">
          This irreversible action will permanently delete all your analyzed calls, customer records, and meeting information from ClarityAI. Your profile will also be reset, and you will be logged out.
        </p>
        <div className="flex items-center text-[var(--color-error)] font-semibold mb-6">
          <InfoCircleIcon className="w-5 h-5 mr-2" />
          This action cannot be undone. Proceed with extreme caution.
        </div>
        <button
          onClick={handlePurgeData}
          className="flex items-center justify-center px-8 py-3 bg-[var(--color-error)] text-white font-semibold rounded-lg shadow-md hover:bg-[var(--color-error)]/[0.8] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !session?.user?.id}
          aria-label="Purge all user data"
        >
          {loading ? <LoadingSpinner className="h-5 w-5 mr-2" /> : <DeleteIcon className="w-5 h-5 mr-2" />}
          {loading ? 'Purging Data...' : 'Purge All My Data'}
        </button>

        {error && <p className="text-[var(--color-error)] mt-4">{error}</p>}
        {successMessage && <p className="text-[var(--color-success)] mt-4">{successMessage}</p>}
      </div>

      {/* Add other settings sections here if desired */}
      {/*
      <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Account Settings</h3>
        <p className="text-[var(--color-text-secondary)]">Manage your account details.</p>
        </div>
      */}
    </div>
  );
};

export default SettingsPage;