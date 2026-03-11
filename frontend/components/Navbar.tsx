


import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth, useTheme } from '../App';
import { HamburgerIcon, UserCircleIcon, RecordIcon, StopIcon, UploadIcon, InfoCircleIcon } from './Icons'; // Consolidated icons, removed FontIcon, ThemeToggleIcon

type DisplayMediaAudioConstraintsExtended = MediaTrackConstraints & {
  systemAudio?: 'include' | 'exclude';
};

type DisplayMediaVideoConstraintsExtended = MediaTrackConstraints & {
  displaySurface?: 'browser' | 'window' | 'monitor';
};

interface NavbarProps {
  toggleSidebar: () => void;
  selectedNavItem: string; // Added to display current page title
  onStartUpload: (file: File) => void; // New prop to handle file upload
  onShowInfoPopup: () => void; // New prop to trigger info popup
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, selectedNavItem, onStartUpload, onShowInfoPopup }) => {
  const { profile, setSession, session } = useAuth(); // Destructure setSession
  // const { theme, toggleTheme, font, toggleFont } = useTheme(); // Removed as theme/font toggles moved to Sidebar
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('clarityiq_demo_mode');
      localStorage.removeItem('clarityiq_force_demo_session');
      // Fix: Changed supabase.auth.signOut to supabase.auth.signOut()
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null); // Explicitly clear session state on logout
    } catch (error: any) {
      console.error('Error logging out:', error.message);
      setSession(null); // Still clear session if signOut fails (e.g. network error)
    }
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((prev) => !prev);
  };

  const uploadRecordingToMeetingBucket = async (file: File) => {
    if (!session?.user?.id) {
      return;
    }

    const storagePath = `${session.user.id}/${Date.now()}-${file.name}`;
    const { error: meetingBucketError } = await supabase.storage
      .from('meeting-recordings')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (!meetingBucketError) {
      return;
    }

    // Backward-compatible fallback for existing deployments configured with call-audio.
    const { error: callAudioError } = await supabase.storage
      .from('call-audio')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (callAudioError) {
      console.error('Backup upload failed for meeting-recordings and call-audio:', {
        meetingRecordingsError: meetingBucketError.message,
        callAudioError: callAudioError.message,
      });
      alert(`Recording captured, but backup upload failed: ${callAudioError.message}`);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        } as DisplayMediaVideoConstraintsExtended,
        audio: {
          systemAudio: 'include',
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } as DisplayMediaAudioConstraintsExtended,
      });

      displayStreamRef.current = stream;
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No system audio track detected. In the share dialog, choose the Meet tab and enable Share tab audio.');
      }

      // Record only audio by constructing an audio-only stream for MediaRecorder.
      const audioOnlyStream = new MediaStream(audioTracks);
      audioStreamRef.current = audioOnlyStream;

      // Check for supported mime types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/ogg') 
          ? 'audio/ogg' 
          : '';

      const mediaRecorder = new MediaRecorder(audioOnlyStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/wav' });
        const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'wav';
        const file = new File(
          [audioBlob], 
          `live_recording_${new Date().getTime()}.${extension}`, 
          { type: mimeType || 'audio/wav' }
        );

        // Open analysis workflow immediately (customer/meeting selection in UploadProcessor).
        onStartUpload(file);

        // Backup upload to dedicated meeting-recordings bucket without blocking UI flow.
        void uploadRecordingToMeetingBucket(file);

        // Stop all tracks to release screen/audio capture resources.
        displayStreamRef.current?.getTracks().forEach(track => track.stop());
        audioStreamRef.current?.getTracks().forEach(track => track.stop());
        displayStreamRef.current = null;
        audioStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      };

      mediaRecorder.start();

      // If user stops sharing from browser controls, finalize recording cleanly.
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        };
      });

      setIsRecording(true);
      console.log('Recording started...');
    } catch (err) {
      console.error('Error starting system audio recording:', err);
      alert('Could not start system audio capture. Select the Google Meet tab and enable Share tab audio.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('Recording stopped.');
      return;
    }

    // Fallback cleanup if recorder is already inactive but streams are still open.
    displayStreamRef.current?.getTracks().forEach(track => track.stop());
    audioStreamRef.current?.getTracks().forEach(track => track.stop());
    displayStreamRef.current = null;
    audioStreamRef.current = null;
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click(); // Trigger the hidden file input
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onStartUpload(event.target.files[0]);
      // Reset the input value to allow re-uploading the same file if needed
      event.target.value = '';
    }
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-[var(--color-bg-card)] shadow-md py-4 px-8 sticky top-0 z-10 transition-colors duration-300" style={{ fontFamily: 'inherit' }}>
      <div className="flex justify-between items-center">
        {/* Left side: Hamburger Icon (only visible on mobile) and Page Title */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors duration-200 md:hidden mr-2"
            aria-label="Toggle sidebar"
          >
            <HamburgerIcon className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {selectedNavItem}
          </h2>
        </div>

        {/* Right side: Record Button, Upload Button, Info Icon, Profile, Logout */}
        <div className="flex items-center space-x-4">
          {/* Record Button */}
          <button
            onClick={handleRecordToggle}
            className={`p-2 rounded-full text-[var(--color-primary)] hover:bg-[var(--color-border-default)] transition-colors duration-200 relative flex items-center
              ${isRecording ? 'animate-pulse-record text-red-500 bg-red-500/10' : ''}`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            title={isRecording ? 'Stop Recording' : 'Start Live Meeting Recording'}
          >
            {isRecording ? <StopIcon className="w-6 h-6" /> : <RecordIcon className="w-6 h-6" />}
            {isRecording && (
              <span className="ml-2 text-red-500 text-sm font-mono hidden sm:inline-block">
                {formatDuration(recordingDuration)}
              </span>
            )}
          </button>

          {/* Upload Button */}
          <button
            onClick={handleUploadClick}
            className="p-2 rounded-full text-[var(--color-primary)] hover:bg-[var(--color-border-default)] transition-colors duration-200"
            aria-label="Upload new audio file"
            title="Upload New Audio File"
          >
            <UploadIcon className="w-6 h-6" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            // --- MODIFIED: Allow audio, text, and JSON files ---
            accept="audio/*, text/plain, application/json"
            style={{ display: 'none' }} // Hidden file input
          />

          {/* Info Icon */}
          <button
            onClick={onShowInfoPopup}
            className="p-2 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors duration-200"
            aria-label="App Information and Help"
            title="App Information and Help"
          >
            <InfoCircleIcon className="w-6 h-6" />
          </button>

          {profile && (
            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={toggleProfileDropdown}
                className="p-2 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors duration-200"
                aria-label="User profile"
                aria-expanded={showProfileDropdown}
              >
                <UserCircleIcon className="w-6 h-6" />
              </button>
              {showProfileDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-48 bg-[var(--color-bg-card)] rounded-md shadow-lg z-30 ring-1 ring-black ring-opacity-5 focus:outline-none transition-colors duration-300"
                  style={{ fontFamily: 'inherit' }}
                >
                  <div className="py-1">
                    <div className="block px-4 py-2 text-sm text-[var(--color-text-primary)] border-b border-[var(--color-border-default)]">
                      <p className="font-semibold">{profile.username}</p>
                      <p className="text-[var(--color-text-secondary)] text-xs">
                        Member since: {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Add more profile options here if needed */}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-logout)] hover:bg-[var(--color-logout-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-logout)] disabled:opacity-50 transition-colors duration-200"
            style={{ fontFamily: 'inherit' }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;