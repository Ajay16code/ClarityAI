import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { AuthSession as Session } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';
import UploadProcessor from './components/UploadProcessor';
import CustomerManagement from './components/CustomerManagement';
import MeetingList from './components/MeetingList';
import CallHistory from './components/CallHistory';
import InfoPopup from './components/InfoPopup';
import SettingsPage from './components/SettingsPage';
import CustomerIntelligence from './components/CustomerIntelligence';
import { UserProfile, Call, Customer, Meeting } from './types';
import { demoService } from './services/demoService';

// Add AuthResponse, User, AuthError imports for explicit typing
import type { AuthResponse, User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  isDemoMode: boolean;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
}

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
  font: string;
  toggleFont: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const THEMES = [
  'Clarity', 'Clean Corporate', 'Soft Modern', 'Deep Ocean', 'Carbon Minimalist'
];

const FONTS = ['Jura', 'SN Pro', 'Google Sans', 'Cause', 'Momo Trust Sans', 'Cosette Texte'];

const FONT_MAP: { [key: string]: string } = {
  'Jura': 'Jura, sans-serif',
  'SN Pro': 'Inter, sans-serif',
  'Google Sans': 'Noto Sans, sans-serif',
  'Cause': 'Titan One, sans-serif',
  'Momo Trust Sans': 'Quicksand, sans-serif',
  'Cosette Texte': 'Source Sans 3, sans-serif',
};

const NAV_TO_PATH: Record<string, string> = {
  Dashboard: '/dashboard',
  Intelligence: '/intelligence',
  History: '/history',
  Customers: '/customers',
  Meetings: '/meetings',
  Settings: '/settings',
};

const PATH_TO_NAV: Record<string, string> = Object.entries(NAV_TO_PATH).reduce((acc, [nav, path]) => {
  acc[path] = nav;
  return acc;
}, {} as Record<string, string>);

const getNavItemFromPath = (pathname: string): string => {
  const normalizedPath = pathname.toLowerCase();
  return PATH_TO_NAV[normalizedPath] || 'Dashboard';
};

// Utility to add timeout to a promise
async function fetchWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

const App: React.FC = () => {
  const getDemoSession = useCallback(() => {
    return {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: 'demo-user-id',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'demo@clarityiq.local',
        phone: '',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { username: 'Demo User' },
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_anonymous: false,
      },
    } as unknown as Session;
  }, []);

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Global app loading state
  const [appError, setAppError] = useState<string | null>(null);
  const [isDemoMode] = useState(() => import.meta.env.VITE_DEMO_MODE === 'true');
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('theme') || 'Clarity';
  });
  const [font, setFont] = useState<string>(() => {
    return localStorage.getItem('font') || 'Google Sans';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedNavItem, setSelectedNavItem] = useState(() => getNavItemFromPath(window.location.pathname));
  const [fileToProcess, setFileToProcess] = useState<File | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [calls, setCalls] = useState<Call[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [dashboardContentLoading, setDashboardContentLoading] = useState(false); // Loading for dashboard/content area

  // Ref to track if the initial full data load has completed
  const isInitialLoadRef = useRef(true);
  
  // NEW: Ref to track session inside event listeners to avoid stale closures
  const sessionRef = useRef<Session | null>(null);

  // Sync ref with state
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const getUserSuffix = useCallback((userId: string) => {
    return `_user_${userId.substring(0, 8)}`;
  }, []);

  const cleanNameForDisplay = useCallback((nameWithSuffix: string, userId: string): string => {
    const suffix = getUserSuffix(userId);
    if (nameWithSuffix.endsWith(suffix)) {
      return nameWithSuffix.substring(0, nameWithSuffix.length - suffix.length);
    }
    return nameWithSuffix;
  }, [getUserSuffix]);


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.fontFamily = FONT_MAP[font] || 'sans-serif';
    localStorage.setItem('font', font);
  }, [font]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const currentIndex = THEMES.indexOf(prevTheme);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      return THEMES[nextIndex];
    });
  }, [THEMES, setTheme]);

  const toggleFont = useCallback(() => {
    setFont((prevFont) => {
      const currentIndex = FONTS.indexOf(prevFont);
      const nextIndex = (currentIndex + 1) % FONTS.length;
      return FONTS[nextIndex];
    });
  }, [FONTS, setFont]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, [setIsSidebarOpen]);

  const navigateToNavItem = useCallback((item: string, replace = false) => {
    const targetPath = NAV_TO_PATH[item] || NAV_TO_PATH.Dashboard;
    if (window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({}, '', targetPath);
      } else {
        window.history.pushState({}, '', targetPath);
      }
    }
    setSelectedNavItem(item);
    setShowInfoPopup(false);
  }, [setSelectedNavItem, setShowInfoPopup]);

  const handleNavigate = useCallback((item: string) => {
    navigateToNavItem(item);
  }, [navigateToNavItem]);

  const handleStartUpload = useCallback((file: File) => {
    setFileToProcess(file);
    setIsProcessingUpload(true);
  }, [setFileToProcess, setIsProcessingUpload]);

  const handleUploadComplete = useCallback((newCall: Call) => {
    if (session?.user?.id) {
      const cleanedNewCall = {
        ...newCall,
        customer_name: newCall.customer_id ? cleanNameForDisplay(newCall.customer_name!, session.user.id) : null,
        meeting_name: newCall.meeting_id ? cleanNameForDisplay(newCall.meeting_name!, session.user.id) : null,
      };
      setCalls((prevCalls) => [cleanedNewCall, ...prevCalls]);
    } else {
      setCalls((prevCalls) => [newCall, ...prevCalls]);
    }
    setFileToProcess(null);
    setIsProcessingUpload(false);
    navigateToNavItem('History');
  }, [session, cleanNameForDisplay, setCalls, setFileToProcess, setIsProcessingUpload, navigateToNavItem]);

  useEffect(() => {
    const handlePopState = () => {
      setSelectedNavItem(getNavItemFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    const navFromPath = getNavItemFromPath(window.location.pathname);
    const expectedPath = NAV_TO_PATH[navFromPath] || NAV_TO_PATH.Dashboard;

    setSelectedNavItem(navFromPath);
    if (window.location.pathname !== expectedPath) {
      window.history.replaceState({}, '', expectedPath);
    }
  }, [session]);

  const handleUploadCancel = useCallback(() => {
    setFileToProcess(null);
    setIsProcessingUpload(false);
  }, [setFileToProcess, setIsProcessingUpload]);

  const handleAddCustomerFromUpload = useCallback((newCustomer: Customer) => {
    if (session?.user?.id) {
      const cleanedCustomer = { ...newCustomer, name: cleanNameForDisplay(newCustomer.name, session.user.id) };
      setCustomers(prev => [...prev, cleanedCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [session, cleanNameForDisplay, setCustomers]);

  const handleAddMeetingFromUpload = useCallback((newMeeting: Meeting) => {
    if (session?.user?.id) {
      const cleanedMeeting = { ...newMeeting, name: cleanNameForDisplay(newMeeting.name, session.user.id) };
      setMeetings(prev => [...[cleanedMeeting, ...prev]].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }
  }, [session, cleanNameForDisplay, setMeetings]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsSidebarOpen]);

  const getProfile = useCallback(async (userId: string, userMetadataUsername?: string) => {
    console.log(`[getProfile] Fetching profile for userId: ${userId}`);
    try {
      const { data, error, status } = await fetchWithTimeout(
        supabase.from('profiles').select(`id, username, created_at`).eq('id', userId).single() as unknown as Promise<any>,
        30000
      );

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile(data);
        if (data.username.startsWith('user_') && userMetadataUsername && data.username !== userMetadataUsername + getUserSuffix(userId)) {
          console.log(`[getProfile] Updating default username for user: ${userId} to ${userMetadataUsername}`);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ username: userMetadataUsername + getUserSuffix(userId) })
            .eq('id', userId);
          if (updateError) {
            console.error('[getProfile] Error updating default username:', updateError.message);
          } else {
            setProfile(prev => prev ? { ...prev, username: cleanNameForDisplay(userMetadataUsername + getUserSuffix(userId), userId) } : null);
          }
        } else {
           setProfile(prev => prev ? { ...prev, username: cleanNameForDisplay(prev.username, userId) } : null);
        }
      } else {
        const initialCleanUsername = userMetadataUsername || `user_${userId.substring(0, 8)}`;
        const initialUsernameWithSuffix = initialCleanUsername + getUserSuffix(userId);
        console.log(`[getProfile] Creating profile for new user: ${userId} with username: ${initialCleanUsername}`);
        const { error: insertError, data: newProfileData } = await supabase
          .from('profiles')
          .insert({ id: userId, username: initialUsernameWithSuffix })
          .select('*')
          .single();
        if (insertError) {
          throw insertError;
        }
        setProfile({ ...newProfileData, username: cleanNameForDisplay(newProfileData.username, userId) });
      }
      console.log(`[getProfile] Profile fetch complete for userId: ${userId}`);
    } catch (error: any) {
      console.error(`[getProfile] Error fetching/creating profile for userId ${userId}:`, error.message);
      throw error;
    }
  }, [supabase, getUserSuffix, cleanNameForDisplay, setProfile]);

  const fetchCustomers = useCallback(async (userId: string) => {
    console.log(`[fetchCustomers] Fetching customers for userId: ${userId}`);
    try {
      const { data, error } = await fetchWithTimeout(
        supabase.from('customers').select('*').eq('user_id', userId).order('name', { ascending: true }) as unknown as Promise<any>,
        15000
      );

      if (error) {
        throw error;
      }

      let currentCustomersInDB = (data || []);
      let cleanedCustomersForState = currentCustomersInDB.map(c => ({
        ...c,
        name: cleanNameForDisplay(c.name, userId)
      }));

      const cleanedDefaultCustomerName = 'Default Customer';
      const isDefaultCustomerPresentInCleanedList = cleanedCustomersForState.some(c => c.name === cleanedDefaultCustomerName);

      if (!isDefaultCustomerPresentInCleanedList) {
        console.log('[fetchCustomers] No default customer found, attempting to create one...');
        const nameToInsert = cleanedDefaultCustomerName + getUserSuffix(userId);
        const { data: newDefaultCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({ user_id: userId, name: nameToInsert })
          .select('*')
          .single();

        if (insertError) {
          console.error('[fetchCustomers] Error creating default customer:', insertError.message);
        } else if (newDefaultCustomer) {
          console.log('[fetchCustomers] Default customer created successfully:', newDefaultCustomer);
          const cleanedNewDefaultCustomer = {
            ...newDefaultCustomer,
            name: cleanNameForDisplay(newDefaultCustomer.name, userId)
          };
          cleanedCustomersForState.push(cleanedNewDefaultCustomer);
          cleanedCustomersForState.sort((a, b) => a.name.localeCompare(b.name));
        }
      }

      const uniqueCustomersMap = new Map<string, Customer>();
      cleanedCustomersForState.forEach(c => uniqueCustomersMap.set(c.id, c));
      setCustomers(Array.from(uniqueCustomersMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
      console.log(`[fetchCustomers] Customers fetch complete for userId: ${userId}`);
    } catch (err: any) {
      console.error(`[fetchCustomers] Error fetching customers for userId ${userId}:`, err.message);
      setAppError('Failed to load customers.');
      throw err;
    }
  }, [supabase, cleanNameForDisplay, getUserSuffix, setCustomers, setAppError]);

  const fetchMeetings = useCallback(async (userId: string) => {
    console.log(`[fetchMeetings] Fetching meetings for userId: ${userId}`);
    try {
      const { data, error } = await fetchWithTimeout(
        supabase.from('meetings').select('*').eq('user_id', userId).order('created_at', { ascending: false }) as unknown as Promise<any>,
        15000
      );

      if (error) {
        throw error;
      }

      let currentMeetingsInDB = (data || []);
      let cleanedMeetingsForState = currentMeetingsInDB.map(m => ({
        ...m,
        name: cleanNameForDisplay(m.name, userId)
      }));

      const cleanedDefaultMeetingName = 'Default Meeting';
      const isDefaultMeetingPresentInCleanedList = cleanedMeetingsForState.some(m => m.name === cleanedDefaultMeetingName);

      if (!isDefaultMeetingPresentInCleanedList) {
        console.log('[fetchMeetings] No default meeting found, attempting to create one...');
        const nameToInsert = cleanedDefaultMeetingName + getUserSuffix(userId);
        const { data: newDefaultMeeting, error: insertError } = await supabase
          .from('meetings')
          .insert({ user_id: userId, name: nameToInsert })
          .select('*')
          .single();

        if (insertError) {
          console.error('[fetchMeetings] Error creating default meeting:', insertError.message);
        } else if (newDefaultMeeting) {
          console.log('[fetchMeetings] Default meeting created successfully:', newDefaultMeeting);
          const cleanedNewDefaultMeeting = {
            ...newDefaultMeeting,
            name: cleanNameForDisplay(newDefaultMeeting.name, userId)
          };
          cleanedMeetingsForState.push(cleanedNewDefaultMeeting);
          cleanedMeetingsForState.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
      }

      const uniqueMeetingsMap = new Map<string, Meeting>();
      cleanedMeetingsForState.forEach(m => uniqueMeetingsMap.set(m.id, m));
      setMeetings(Array.from(uniqueMeetingsMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      console.log(`[fetchMeetings] Meetings fetch complete for userId: ${userId}`);
    } catch (err: any) {
      console.error(`[fetchMeetings] Error fetching meetings for userId ${userId}:`, err.message);
      setAppError('Failed to load meetings.');
      throw err;
    }
  }, [supabase, cleanNameForDisplay, getUserSuffix, setMeetings, setAppError]);

  const fetchCalls = useCallback(async (userId: string) => {
    console.log(`[fetchCalls] Fetching calls for userId: ${userId}`);
    try {
      const { data, error } = await fetchWithTimeout(
        supabase.from('calls').select('*').eq('user_id', userId).order('created_at', { ascending: false }) as unknown as Promise<any>,
        15000
      );

      if (error) {
        throw error;
      }
      
      const rawCalls = data || [];
      const cleanedCalls = rawCalls.map((call: any) => ({
        ...call,
        customer_name: call.customer_id ? cleanNameForDisplay(call.customer_name || '', userId) : call.customer_name,
        meeting_name: call.meeting_id ? cleanNameForDisplay(call.meeting_name || '', userId) : call.meeting_name,
      }));

      setCalls(cleanedCalls);
      console.log(`[fetchCalls] Calls fetch complete for userId: ${userId}`);
    } catch (err: any) {
      console.error(`[fetchCalls] Error fetching calls for userId ${userId}:`, err.message);
      throw err;
    }
  }, [supabase, setCalls]);


  const handleSessionAndData = useCallback(async (currentSession: Session | null) => {
    console.log(`[handleSessionAndData] Entered. CurrentSession userId: ${currentSession ? currentSession.user.id : 'null'}`);
    setAppError(null);

    if (currentSession) {
      console.log(`[handleSessionAndData] User is logged in. Starting data fetches for user: ${currentSession.user.id}`);
      setDashboardContentLoading(true);
      const metadataUsername = currentSession.user.user_metadata?.username as string | undefined;
      
      // Set minimal profile immediately so app can render
      setProfile({
        id: currentSession.user.id,
        username: currentSession.user.user_metadata?.username || `user_${currentSession.user.id.substring(0, 8)}`,
        created_at: new Date().toISOString()
      });
      
      try {
        await getProfile(currentSession.user.id, metadataUsername);
        await fetchCustomers(currentSession.user.id);
        await fetchMeetings(currentSession.user.id);
        await fetchCalls(currentSession.user.id);
        console.log(`[handleSessionAndData] All data fetches completed successfully for user: ${currentSession.user.id}`);
      } catch (error: any) {
        console.error('[handleSessionAndData] Error fetching user data after session:', error.message);
        console.warn('[handleSessionAndData] Non-blocking error - app will continue with empty data.');
        // Don't set appError - let the app load with empty state instead of blocking
      } finally {
        setDashboardContentLoading(false);
        console.log('[handleSessionAndData] Exiting. Dashboard content loading set to false.');
      }
    } else {
      console.log('[handleSessionAndData] No active session. Clearing user data.');
      setProfile(null);
      setCustomers([]);
      setMeetings([]);
      setCalls([]);
      setAppError(null);
      setDashboardContentLoading(false);
    }
    console.log('[handleSessionAndData] Exiting.');
  }, [
    supabase,
    getProfile,
    fetchCustomers,
    fetchMeetings,
    fetchCalls,
    setAppError,
    setDashboardContentLoading,
    setSession,
    setProfile,
    setCustomers,
    setMeetings,
    setCalls,
  ]);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('--- App initialization started ---');
      setLoading(true);
      try {
        if (isDemoMode) {
          const demoSession = getDemoSession();
          setSession(demoSession);
          sessionRef.current = demoSession;
          setProfile({ id: 'demo-user-id', username: 'Demo User', created_at: new Date().toISOString() });
          setCustomers(demoService.getCustomers());
          setMeetings(demoService.getMeetings());
          setCalls(demoService.getCalls());
          setAppError(null);
          setDashboardContentLoading(false);
          console.log('[initializeApp] Demo mode enabled. Using local demo session and storage.');
          return;
        }

        console.log('[initializeApp] Fetching initial session...');
        let initialSession = null;
        try {
          const authResponse = await fetchWithTimeout(
            supabase.auth.getSession(),
            8000 // Reasonable timeout - fail fast if connection is dead
          ) as AuthResponse;
          initialSession = authResponse.data.session;
        } catch (sessionError: any) {
          console.warn('[initializeApp] Session fetch failed or timed out:', sessionError.message);
          // If persisted auth state is stale and network is unreachable, clear local tokens
          // to prevent repeated refresh attempts (often triggered on tab focus/input interaction).
          try {
            await supabase.auth.signOut({ scope: 'local' });
            console.log('[initializeApp] Cleared local Supabase session after session fetch failure.');
          } catch (clearError: any) {
            console.warn('[initializeApp] Failed to clear local Supabase session:', clearError?.message || clearError);
          }
          // Non-blocking - continue to render auth screen
          initialSession = null;
        }
        
        setSession(initialSession);
        // Sync Ref immediately for initialize
        sessionRef.current = initialSession; 

        // Validate persisted session early: if refresh fails (common on stale/bad network state),
        // clear local auth to stop repeated background refresh errors on focus/input interactions.
        if (initialSession) {
          try {
            const refreshed = await fetchWithTimeout(
              supabase.auth.refreshSession(),
              8000
            );
            if (refreshed.error) {
              throw refreshed.error;
            }
            initialSession = refreshed.data.session;
            setSession(initialSession);
            sessionRef.current = initialSession;
          } catch (refreshError: any) {
            console.warn('[initializeApp] Session refresh failed, clearing local auth:', refreshError?.message || refreshError);
            try {
              await supabase.auth.signOut({ scope: 'local' });
              console.log('[initializeApp] Cleared local Supabase session after refresh failure.');
            } catch (clearError: any) {
              console.warn('[initializeApp] Failed to clear local Supabase session after refresh failure:', clearError?.message || clearError);
            }
            initialSession = null;
            setSession(null);
            sessionRef.current = null;
          }
        }

        console.log('[initializeApp] Initial session obtained:', initialSession ? initialSession.user.id : 'null');
        await handleSessionAndData(initialSession);
      } catch (error: any) {
        console.error('[initializeApp] Initial app load error:', error.message);
        // This catch should rarely hit now since we made errors non-blocking above
      } finally {
        setLoading(false);
        isInitialLoadRef.current = false;
        console.log('--- App initialization finished ---');
      }
    };

    initializeApp();

    if (isDemoMode) {
      return;
    }

    console.log('[useEffect] Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log(`--- Auth state change detected. Event: ${_event}, New session userId: ${newSession ? newSession.user.id : 'null'} ---`);
        
        if (_event === 'SIGNED_OUT') {
          console.log('[onAuthStateChange] User signed out, explicitly clearing all states.');
          setSession(null);
          sessionRef.current = null; // Clear Ref on sign out
          setProfile(null);
          setCustomers([]);
          setMeetings([]);
          setCalls([]);
          setAppError(null);
          setDashboardContentLoading(false);
          setLoading(false);
          isInitialLoadRef.current = true;
        } else if (newSession) {
          const previousSession = sessionRef.current;
          setSession(newSession); 
          // Sync Ref whenever session changes
          sessionRef.current = newSession;

          // === FIX START: Prevent infinite loading on window focus ===
          // Check if we are already logged in as this user by comparing with the Ref
          // Note: sessionRef.current was just updated above, so we need to check if the PREVIOUS value was the same.
          // Actually, let's compare with the state 'session' which hasn't updated yet in this tick.
          const isSameUser = previousSession?.user?.id === newSession.user.id;
          
          if (_event === 'SIGNED_IN' && isSameUser && !isInitialLoadRef.current) {
             console.log('[onAuthStateChange] SIGNED_IN event for already authenticated user. Skipping data re-fetch to prevent stuck loading.');
             return; 
          }
          // === FIX END ===

          if (_event === 'SIGNED_IN' || (_event === 'INITIAL_SESSION' && isInitialLoadRef.current)) {
              console.log(`[onAuthStateChange] Handling ${_event} event: Fetching all user data.`);
              setLoading(true); // Only set loading for genuine new logins
              await handleSessionAndData(newSession);
              isInitialLoadRef.current = false;
              setLoading(false);
          } else if (_event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') {
              console.log(`[onAuthStateChange] Handling ${_event} event: Session updated silently.`);
          }
        }
        console.log('--- Auth state change handler finished ---');
      }
    );

    return () => {
      console.log('[useEffect] Cleaning up auth state change listener.');
      subscription?.unsubscribe();
    };
  }, [
    isDemoMode,
    getDemoSession,
    supabase,
    handleSessionAndData,
    setLoading,
    setSession,
    setAppError,
    setProfile,
    setCustomers,
    setMeetings,
    setCalls,
    setDashboardContentLoading,
  ]);

  const renderMainContent = useCallback(() => {
    if (isProcessingUpload && fileToProcess) {
      return (
        <UploadProcessor
          file={fileToProcess}
          onUploadComplete={handleUploadComplete}
          onCancel={handleUploadCancel}
          allCalls={calls}
          customers={customers}
          meetings={meetings}
          getUserSuffix={getUserSuffix}
          cleanNameForDisplay={cleanNameForDisplay}
          onAddCustomer={handleAddCustomerFromUpload}
          onAddMeeting={handleAddMeetingFromUpload}
        />
      );
    }

    switch (selectedNavItem) {
      case 'Dashboard':
        return <Dashboard customers={customers} meetings={meetings} calls={calls} onShowInfo={() => setShowInfoPopup(true)} isDashboardContentLoading={dashboardContentLoading} />;
      case 'Intelligence':
        return <CustomerIntelligence customers={customers} calls={calls} />;
      case 'History':
        return <CallHistory calls={calls} setCalls={setCalls} customers={customers} meetings={meetings} cleanNameForDisplay={cleanNameForDisplay} />;
      case 'Customers':
        return <CustomerManagement customers={customers} setCustomers={setCustomers} getUserSuffix={getUserSuffix} cleanNameForDisplay={cleanNameForDisplay} />;
      case 'Meetings':
        return <MeetingList meetings={meetings} setMeetings={setMeetings} calls={calls} getUserSuffix={getUserSuffix} cleanNameForDisplay={cleanNameForDisplay} />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return <Dashboard customers={customers} meetings={meetings} calls={calls} onShowInfo={() => setShowInfoPopup(true)} isDashboardContentLoading={dashboardContentLoading} />;
    }
  }, [
    isProcessingUpload,
    fileToProcess,
    handleUploadComplete,
    handleUploadCancel,
    calls,
    customers,
    meetings,
    getUserSuffix,
    cleanNameForDisplay,
    handleAddCustomerFromUpload,
    handleAddMeetingFromUpload,
    selectedNavItem,
    dashboardContentLoading,
    setCalls,
    setCustomers,
    setMeetings,
    setShowInfoPopup,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-body)]">
        <LoadingSpinner />
      </div>
    );
  }

  if (appError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-body)] p-4">
        <div className="bg-[var(--color-bg-card)] p-8 rounded-lg shadow-lg text-center max-w-md border border-[var(--color-error)]/20">
          <div className="w-16 h-16 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-[var(--color-error)] text-xl font-bold mb-2">Something went wrong</p>
          <p className="text-[var(--color-text-secondary)] mb-6 text-sm leading-relaxed">
            {appError}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-all duration-200 font-bold shadow-lg shadow-[var(--color-primary)]/20"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-6 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-200 text-[10px] font-bold uppercase tracking-widest mt-2"
            >
              Reset App & Clear Cache
            </button>
          </div>
          <p className="mt-6 text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest opacity-50">
            Please try again after checking network connectivity
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, profile, isDemoMode, setProfile, setSession }}>
      <ThemeContext.Provider value={{ theme, toggleTheme, font, toggleFont }}>
        <div className="min-h-screen flex text-[var(--color-text-primary)] transition-colors duration-300">
          {session ? (
            <>
              <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                activeNav={selectedNavItem}
                onNavigate={handleNavigate}
                theme={theme}
                toggleTheme={toggleTheme}
                font={font}
                toggleFont={toggleFont}
              />

              <div className={`flex-grow flex flex-col transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}
              `}>
                <Navbar
                  toggleSidebar={toggleSidebar}
                  selectedNavItem={selectedNavItem}
                  onStartUpload={handleStartUpload}
                  onShowInfoPopup={() => setShowInfoPopup(true)}
                />
                <main className="flex-grow p-4 md:p-8">
                  {renderMainContent()}
                </main>
              </div>

              {isSidebarOpen && window.innerWidth < 768 && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                  onClick={toggleSidebar}
                ></div>
              )}

              {showInfoPopup && <InfoPopup isOpen={showInfoPopup} onClose={() => setShowInfoPopup(false)} />}
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <Auth />
            </div>
          )}
        </div>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;