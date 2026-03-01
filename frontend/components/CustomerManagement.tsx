
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth, useTheme } from '../App';
import { Customer } from '../types';
import { demoService } from '../services/demoService';
import LoadingSpinner from './LoadingSpinner';
import { PlusIcon, EditIcon, DeleteIcon, CheckIcon, XMarkIcon } from './Icons'; // Assuming these icons are in Icons.tsx

interface CustomerManagementProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  getUserSuffix: (userId: string) => string; // New prop
  cleanNameForDisplay: (nameWithSuffix: string, userId: string) => string; // New prop
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  setCustomers,
  getUserSuffix,
  cleanNameForDisplay,
}) => {
  const { session, isDemoMode } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingCustomerName, setEditingCustomerName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!session?.user?.id) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    if (isDemoMode) {
      console.log('[CustomerManagement] Demo Mode active. Fetching from demoService.');
      setCustomers(demoService.getCustomers());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      // Clean names for display before setting state
      const cleanedCustomers = (data || []).map(c => ({
        ...c,
        name: cleanNameForDisplay(c.name, session.user.id)
      }));
      setCustomers(cleanedCustomers);
    } catch (err: any) {
      console.error('Error fetching customers:', err.message);
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, setCustomers, cleanNameForDisplay]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !session?.user?.id) return;

    // Validate for duplicate names (case-insensitive)
    const normalizedNewName = newCustomerName.trim().toLowerCase();
    if (customers.some(c => c.name.toLowerCase() === normalizedNewName)) {
      setError(`A customer named "${newCustomerName.trim()}" already exists.`);
      return;
    }

    setLoading(true);
    setError('');

    if (isDemoMode) {
      const newCust: Customer = {
        id: `demo-cust-${Date.now()}`,
        user_id: session.user.id,
        name: newCustomerName.trim(),
        created_at: new Date().toISOString()
      };
      const saved = demoService.saveCustomer(newCust);
      setCustomers((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCustomerName('');
      setLoading(false);
      return;
    }

    try {
      const nameWithSuffix = newCustomerName.trim() + getUserSuffix(session.user.id);
      const { data, error: insertError } = await supabase
        .from('customers')
        .insert({ user_id: session.user.id, name: nameWithSuffix })
        .select()
        .single();

      if (insertError) throw insertError;

      // Clean the name for display before adding to local state
      const cleanedData = { ...data, name: cleanNameForDisplay(data.name, session.user.id) };
      setCustomers((prev) => [...prev, cleanedData].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCustomerName('');
    } catch (err: any) {
      console.error('Error adding customer:', err.message);
      setError(`Failed to add customer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomerId || !editingCustomerName.trim() || !session?.user?.id) return;

    // Validate for duplicate names (case-insensitive, excluding the current customer being edited)
    const normalizedEditingName = editingCustomerName.trim().toLowerCase();
    if (customers.some(c => c.id !== editingCustomerId && c.name.toLowerCase() === normalizedEditingName)) {
      setError(`A customer named "${editingCustomerName.trim()}" already exists.`);
      return;
    }

    setLoading(true);
    setError('');

    if (isDemoMode) {
      const updatedCust: Customer = {
        ...customers.find(c => c.id === editingCustomerId)!,
        name: editingCustomerName.trim()
      };
      demoService.updateCustomer(updatedCust);
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomerId ? updatedCust : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingCustomerId(null);
      setEditingCustomerName('');
      setLoading(false);
      return;
    }

    try {
      const nameWithSuffix = editingCustomerName.trim() + getUserSuffix(session.user.id);
      const { data, error: updateError } = await supabase
        .from('customers')
        .update({ name: nameWithSuffix })
        .eq('id', editingCustomerId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Clean the name for display before updating local state
      const cleanedData = { ...data, name: cleanNameForDisplay(data.name, session.user.id) };
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomerId ? cleanedData : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingCustomerId(null);
      setEditingCustomerName('');
    } catch (err: any) {
      console.error('Error updating customer:', err.message);
      setError(`Failed to update customer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError('');

    if (isDemoMode) {
      demoService.deleteCustomer(customerId);
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setConfirmDeleteId(null);
      setLoading(false);
      return;
    }

    try {
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('id')
        .eq('customer_id', customerId);

      if (callsError) {
        throw callsError;
      }

      if (callsData && callsData.length > 0) {
        // If calls are linked, update them to set customer_id and customer_name to NULL
        const { error: updateCallsError } = await supabase
          .from('calls')
          .update({ customer_id: null, customer_name: null }) // Cleared names for linked calls
          .eq('customer_id', customerId)
          .eq('user_id', session.user.id);

        if (updateCallsError) {
          throw updateCallsError;
        }
      }

      // Then delete the customer
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('user_id', session.user.id);

      if (deleteError) throw deleteError;

      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Error deleting customer:', err.message);
      setError(`Failed to delete customer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" style={{ fontFamily: 'inherit' }}>
      {error && <p className="text-[var(--color-error)] text-center mb-4">{error}</p>}

      {/* Add New Customer Form */}
      <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Add New Customer</h3>
        <form onSubmit={handleAddCustomer} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Customer Name"
            value={newCustomerName}
            onChange={(e) => { setNewCustomerName(e.target.value); setError(''); }}
            className="flex-grow px-4 py-2 border border-[var(--color-border-default)] rounded-md shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)]"
            disabled={loading}
            required
            style={{ fontFamily: 'inherit' }}
          />
          <button
            type="submit"
            className="flex items-center justify-center px-6 py-2 bg-[var(--color-primary)] text-white font-medium rounded-md shadow-sm hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 transition-colors duration-200"
            disabled={loading || !newCustomerName.trim()}
            style={{ fontFamily: 'inherit' }}
          >
            {loading ? <LoadingSpinner className="h-5 w-5 mr-2" /> : <PlusIcon className="w-5 h-5 mr-2" />}
            Add Customer
          </button>
        </form>
      </div>

      {/* Customer List */}
      <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-lg border border-[var(--color-border-default)]">
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Your Customers</h3>
        {loading && customers.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
            <p className="ml-2 text-[var(--color-text-secondary)]" style={{ fontFamily: 'inherit' }}>Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <p className="text-[var(--color-text-secondary)] text-center py-8" style={{ fontFamily: 'inherit' }}>No customers found. Add one above!</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border-default)]">
            {customers.map((customer) => (
              <li key={customer.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4">
                {editingCustomerId === customer.id ? (
                  <form onSubmit={handleEditCustomer} className="flex-grow flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={editingCustomerName}
                      onChange={(e) => { setEditingCustomerName(e.target.value); setError(''); }}
                      className="flex-grow px-3 py-1 border border-[var(--color-border-default)] rounded-md shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-body)] text-[var(--color-text-primary)]"
                      disabled={loading}
                      required
                      style={{ fontFamily: 'inherit' }}
                    />
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button
                        type="submit"
                        className="flex items-center px-3 py-1 bg-[var(--color-success)] text-white text-sm rounded-md hover:bg-[var(--color-success)]/[0.8] disabled:opacity-50 transition-colors duration-200"
                        disabled={loading || !editingCustomerName.trim()}
                        style={{ fontFamily: 'inherit' }}
                      >
                        <CheckIcon className="w-4 h-4 mr-1" /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingCustomerId(null); setEditingCustomerName(''); setError(''); }}
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
                    <span className="text-lg text-[var(--color-text-primary)] font-medium" style={{ fontFamily: 'inherit' }}>
                      {customer.name}
                    </span>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => { setEditingCustomerId(customer.id); setEditingCustomerName(customer.name); setError(''); }}
                        className="flex items-center px-3 py-1 bg-[var(--color-primary)] text-white text-sm rounded-md hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors duration-200"
                        disabled={loading}
                        style={{ fontFamily: 'inherit' }}
                      >
                        <EditIcon className="w-4 h-4 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(customer.id)}
                        className="flex items-center px-3 py-1 bg-[var(--color-error)] text-white text-sm rounded-md hover:bg-[var(--color-error)]/[0.8] disabled:opacity-50 transition-colors duration-200"
                        disabled={loading}
                        style={{ fontFamily: 'inherit' }}
                      >
                        <DeleteIcon className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </div>
                  </>
                )}
                {confirmDeleteId === customer.id && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--color-bg-card)] p-6 rounded-lg shadow-2xl max-w-sm w-full text-center relative" style={{ fontFamily: 'inherit' }}>
                      <p className="text-lg text-[var(--color-text-primary)] mb-4" style={{ fontFamily: 'inherit' }}>
                        Are you sure you want to delete "{customer.name}"?
                        This will also unset this customer from any associated calls.
                      </p>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
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
    </div>
  );
};

export default CustomerManagement;