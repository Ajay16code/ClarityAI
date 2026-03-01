import { Customer, Meeting, Call } from '../types';

const STORAGE_KEYS = {
  CUSTOMERS: 'bohemai_demo_customers',
  MEETINGS: 'bohemai_demo_meetings',
  CALLS: 'bohemai_demo_calls',
};

export const demoService = {
  // Customers
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [
      { id: 'demo-cust-1', name: 'Default Customer', user_id: 'demo-user-id', created_at: new Date().toISOString() }
    ];
  },
  saveCustomer: (customer: Customer): Customer => {
    const customers = demoService.getCustomers();
    const newCustomer = { ...customer, id: customer.id || `demo-cust-${Date.now()}`, created_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([...customers, newCustomer]));
    return newCustomer;
  },
  updateCustomer: (customer: Customer): Customer => {
    const customers = demoService.getCustomers();
    const updated = customers.map(c => c.id === customer.id ? customer : c);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
    return customer;
  },
  deleteCustomer: (id: string) => {
    const customers = demoService.getCustomers();
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers.filter(c => c.id !== id)));
    // Also cleanup calls
    const calls = demoService.getCalls();
    const updatedCalls = calls.map(c => c.customer_id === id ? { ...c, customer_id: null, customer_name: null } : c);
    localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify(updatedCalls));
  },

  // Meetings
  getMeetings: (): Meeting[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MEETINGS);
    return data ? JSON.parse(data) : [
      { id: 'demo-meet-1', name: 'Default Meeting', user_id: 'demo-user-id', created_at: new Date().toISOString() }
    ];
  },
  saveMeeting: (meeting: Meeting): Meeting => {
    const meetings = demoService.getMeetings();
    const newMeeting = { ...meeting, id: meeting.id || `demo-meet-${Date.now()}`, created_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify([newMeeting, ...meetings]));
    return newMeeting;
  },
  updateMeeting: (meeting: Meeting): Meeting => {
    const meetings = demoService.getMeetings();
    const updated = meetings.map(m => m.id === meeting.id ? meeting : m);
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(updated));
    return meeting;
  },
  deleteMeeting: (id: string) => {
    const meetings = demoService.getMeetings();
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings.filter(m => m.id !== id)));
    // Also cleanup calls
    const calls = demoService.getCalls();
    const updatedCalls = calls.map(c => c.meeting_id === id ? { ...c, meeting_id: null, meeting_name: null } : c);
    localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify(updatedCalls));
  },

  // Calls
  getCalls: (): Call[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CALLS);
    return data ? JSON.parse(data) : [];
  },
  saveCall: (call: Call): Call => {
    const calls = demoService.getCalls();
    const newCall = { ...call, id: call.id || `demo-call-${Date.now()}`, created_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify([newCall, ...calls]));
    return newCall;
  },
  deleteCall: (id: string) => {
    const calls = demoService.getCalls();
    localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify(calls.filter(c => c.id !== id)));
  },
  purgeAll: () => {
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.MEETINGS);
    localStorage.removeItem(STORAGE_KEYS.CALLS);
  }
};
