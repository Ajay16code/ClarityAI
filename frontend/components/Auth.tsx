


import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { BohemAILogo } from './BohemAILogo';
import {
  ArrowTrendingUpIcon,
  AudioWaveformIcon,
  TranscriptionIcon,
  BANTIcon,
  ContinuousDocumentationIcon,
} from './Icons';
import { useAuth, useTheme } from '../App';

// --- Types ---
interface WorkflowStep {
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  xPos: number;
  yPos: number;
  mainColor: string;
  accentColor: string;
  gradientStart: string;
  gradientEnd: string;
}

// --- Data ---
const workflowSteps: WorkflowStep[] = [
  {
    icon: AudioWaveformIcon,
    title: 'Seamless Audio Ingestion',
    description: 'Effortlessly upload call recordings to ClarityAI for intelligent processing.',
    xPos: 100, yPos: 75,
    mainColor: '#007bff',
    accentColor: '#007bff',
    gradientStart: '#007bff',
    gradientEnd: '#0056b3',
  },
  {
    icon: TranscriptionIcon,
    title: 'AI-Powered Transcription',
    description: 'Get accurate transcripts and instantly gauge the emotional tone of every conversation.',
    xPos: 250, yPos: 75,
    mainColor: '#20c997',
    accentColor: '#20c997',
    gradientStart: '#28a745',
    gradientEnd: '#1e7e34',
  },
  {
    icon: BANTIcon,
    title: 'Actionable BANT Insights',
    description: 'Automatically identify Budget, Authority, Need, and Timeline to qualify leads faster.',
    xPos: 400, yPos: 75,
    mainColor: '#ffc107',
    accentColor: '#ffc107',
    gradientStart: '#c4490b',
    gradientEnd: '#ffc107',
  },
  {
    icon: ArrowTrendingUpIcon,
    title: 'Deal Arc Momentum',
    description: 'Visualize and track the real-time psychological and structural trajectory of your deals.',
    xPos: 550, yPos: 75,
    mainColor: '#6f42c1',
    accentColor: '#6f42c1',
    gradientStart: '#6f42c1',
    gradientEnd: '#563d7c',
  },
  {
    icon: ContinuousDocumentationIcon,
    title: 'Living Memory',
    description: 'ClarityAI builds a continuous, living memory of every customer relationship.',
    xPos: 700, yPos: 75,
    mainColor: '#17a2b8',
    accentColor: '#17a2b8',
    gradientStart: '#17a2b8',
    gradientEnd: '#138496',
  },
];

const Auth: React.FC = () => {
  // --- State ---
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // New state for username
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isTypingInForm, setIsTypingInForm] = useState(false);
  const { theme } = useTheme(); // Now only using theme, font is global via body
  const { setSession } = useAuth();

  // --- Constants ---
  // Removed FONT_MAP, relying on global font set in App.tsx

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, timeoutMs = 45000): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Authentication timed out. Cannot reach Supabase over HTTPS (port 443). Check firewall/VPN/proxy or try a different internet connection.'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }, []);

  // --- Handlers ---
  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error('Username is required for sign up.');
        }
        const { data: signUpData, error: signUpError } = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username: username.trim(), // Pass username in user_metadata
              },
            },
          })
        );
        if (signUpError) throw signUpError;

        if (signUpData.session) {
          setSession(signUpData.session);
          setMessage('Account created successfully!');
        } else {
          setMessage('Account created. Check your email to verify your account, then log in.');
        }
      } else {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password })
        );
        if (error) throw error;
        if (data?.session) {
          setSession(data.session);
        }
        setMessage('Logged in successfully!');
      }
    } catch (error: any) {
      const rawMessage = error?.message || 'Unknown authentication error';
      const lowerMessage = rawMessage.toLowerCase();
      if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('timed out')) {
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // ignore local sign-out cleanup failures
        }
        setMessage('Error: Cannot reach Supabase from this network. DNS resolves, but HTTPS connection to Supabase is timing out. Try mobile hotspot, disable VPN/proxy/firewall, or allow outbound port 443.');
      } else {
        setMessage(`Error: ${rawMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        })
      );
      if (error) {
        if (error.message.includes('not enabled') || error.message.includes('Unsupported provider')) {
          setMessage('Google sign-in is not enabled. Please enable Google OAuth in your Supabase dashboard (Authentication > Providers > Google) or use email/password.');
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      const rawMessage = error?.message || 'Unknown authentication error';
      const lowerMessage = rawMessage.toLowerCase();
      if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('timed out')) {
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // ignore local sign-out cleanup failures
        }
        setMessage('Error: Cannot reach Supabase from this network. DNS resolves, but HTTPS connection to Supabase is timing out. Try mobile hotspot, disable VPN/proxy/firewall, or allow outbound port 443.');
      } else {
        setMessage(`Error: ${rawMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => (prev + 1) % workflowSteps.length);
  }, []);

  // --- Effects ---
  useEffect(() => {
    let timer: number;
    if (!isTypingInForm) {
      timer = window.setInterval(nextStep, 5000); // 5 Seconds on the node
    }
    return () => clearInterval(timer);
  }, [nextStep, isTypingInForm]);

  // --- Render Helpers ---
  const CurrentIcon = workflowSteps[currentStep].icon;
  const currentStepData = workflowSteps[currentStep];
  const currentGradient = `linear-gradient(to bottom right, ${currentStepData.gradientStart}, ${currentStepData.gradientEnd})`;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans text-white bg-[#0F1115]">
      
      {/* --- INJECTED STYLES --- */}
      <style>{`
        /* Text entry animation */
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-text-enter {
          animation: fadeInSlide 0.5s ease-out forwards;
        }
        
        /* SONAR RIPPLE ANIMATION - Perfectly centered */
        @keyframes rippleExpand {
          0% {
            r: 0;
            opacity: 0.8;
            stroke-width: 2;
          }
          100% {
            r: 50;
            opacity: 0;
            stroke-width: 0;
          }
        }
        .sonar-ripple {
          fill: none;
          animation: rippleExpand 2.5s infinite linear;
          transform-origin: center;
        }
      `}</style>

      {/* --- LEFT SECTION: ANIMATION --- */}
      <div className="hidden md:flex md:w-3/5 lg:w-2/3 flex-col items-center justify-center p-8 relative overflow-hidden bg-[#0F1115] transition-colors duration-700 border-r border-white/10">
        
        {/* Ambient Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.08] pointer-events-none" 
          style={{ 
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, 
            backgroundSize: '40px 40px',
            backgroundPosition: 'center'
          }}
        />

        {/* Header */}
        <div className="absolute top-8 left-8 flex items-center z-20">
          <BohemAILogo className="w-10 h-10 text-white mr-3" />
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'inherit' }}>ClarityAI</h1> {/* Use inherit */}
        </div>

        {/* MAIN ANIMATION SVG */}
        <div className="relative w-full max-w-4xl h-40 flex items-center justify-center z-10">
          <svg viewBox="0 0 800 150" className="w-full h-full overflow-visible">
            
            {/* 1. Base Track Line */}
            <line x1="100" y1="75" x2="700" y2="75" stroke="#333" strokeWidth="4" strokeLinecap="round" />

            {/* 2. Active Progress Trail - Duration 500ms for a decisive slide */}
            <line 
              x1="100" 
              y1="75" 
              x2={currentStepData.xPos} 
              y2="75" 
              stroke={currentStepData.mainColor} 
              strokeWidth="6" 
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out" 
              style={{ filter: `drop-shadow(0 0 8px ${currentStepData.mainColor})` }}
            />

            {/* 3. Nodes (Milestones) */}
            {workflowSteps.map((step, index) => {
              const isActive = index === currentStep;
              const isPassed = index < currentStep;
              
              return (
                <g key={`node-${index}`} className="transition-all duration-300">
                  {/* Ping Effect for Active Node */}
                  <circle 
                    cx={step.xPos} cy={step.yPos} 
                    r={isActive ? 20 : 0} 
                    fill="none" 
                    stroke={step.mainColor} 
                    strokeWidth="2" 
                    opacity="0.6"
                    className={isActive ? "animate-ping" : ""}
                  />
                  
                  {/* Main Dot */}
                  <circle
                    cx={step.xPos}
                    cy={step.yPos}
                    r={isActive ? 8 : 6}
                    fill={isActive || isPassed ? step.mainColor : '#444'}
                    stroke={isActive ? '#fff' : 'none'}
                    strokeWidth="2"
                    className="transition-all duration-300 ease-out"
                  />
                  
                  {/* Step Number */}
                  <text
                    x={step.xPos}
                    y={step.yPos + 35} 
                    textAnchor="middle"
                    fill={isActive ? '#fff' : '#666'}
                    fontSize="12"
                    fontWeight="bold"
                    style={{ fontFamily: 'inherit' }}
                  >
                    0{index + 1}
                  </text>
                </g>
              );
            })}

            {/* 4. THE SQUARE CURSOR + SONAR RIPPLES */}
            {/* Duration: 500ms (0.5s). 
                Effect: It will slide decisively to the next dot and then SIT STILL for 4.5 seconds.
                No pulsing on the square body itself.
            */}
            <g 
              className="transition-transform duration-500 ease-in-out" 
              style={{ transform: `translate(${currentStepData.xPos}px, 75px)` }}
            >
               {/* Sonar Ripples - Independent animation from the square's body */}
               <circle cx="0" cy="0" className="sonar-ripple" stroke={currentStepData.mainColor} style={{ animationDelay: '0s' }} />
               <circle cx="0" cy="0" className="sonar-ripple" stroke={currentStepData.mainColor} style={{ animationDelay: '0.8s' }} />
               <circle cx="0" cy="0" className="sonar-ripple" stroke={currentStepData.mainColor} style={{ animationDelay: '1.6s' }} />

              {/* Square Glow (Static Blur) */}
              <rect 
                x="-16" y="-16" width="32" height="32" 
                fill={currentStepData.mainColor} 
                opacity="0.4" 
                filter="blur(6px)" 
                rx="4"
              />
              
              {/* Main Square Body - STATIC (Removed cursor-pulse class) */}
              <rect 
                x="-12" y="-12" width="24" height="24" 
                fill="#FFD700" 
                rx="4"
                className="drop-shadow-md"
              />
              
              {/* Inner Detail (Chip look) */}
              <rect 
                x="-5" y="-5" width="10" height="10" 
                fill="#000" 
                opacity="0.25" 
                rx="2"
              />
            </g>
          </svg>
        </div>

        {/* TEXT CONTENT */}
        <div className="relative w-full max-w-lg text-center z-10 flex flex-col items-center justify-start min-h-[160px]">
          <div key={currentStep} className="animate-text-enter">
             <div className="mb-4 flex justify-center">
                <CurrentIcon 
                  className="w-16 h-16 drop-shadow-xl"
                  style={{ color: currentStepData.mainColor }} 
                />
             </div>

            <h2
              className="text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md"
              style={{ fontFamily: 'inherit' }}
            >
              {currentStepData.title}
            </h2>
            <p
              className="text-lg text-gray-300 leading-relaxed max-w-md mx-auto"
              style={{ fontFamily: 'inherit' }}
            >
              {currentStepData.description}
            </p>
          </div>
        </div>
      </div>

      {/* --- RIGHT SECTION: AUTH FORM --- */}
      <div className="w-full md:w-2/5 lg:w-1/3 flex items-center justify-center p-4 bg-[#0F1115]">
        <div
          className="w-full max-w-md p-8 space-y-6 rounded-2xl shadow-2xl transition-all duration-1000 ease-in-out relative overflow-hidden"
          style={{ background: currentGradient, fontFamily: 'inherit' }}
        >
          {/* Glassmorphism Background Artifacts */}
          <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>

          <div className="flex flex-col items-center mb-6 relative z-10">
            <BohemAILogo className="w-20 h-20 mb-3 text-white drop-shadow-md" />
              <h1 className="text-3xl font-extrabold text-center text-white tracking-wide">ClarityAI</h1>
            <p className="text-center text-white text-sm mt-2 opacity-90 font-medium tracking-wider uppercase">Magic Summary Engine</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5 relative z-10">
            {isSignUp && ( // Conditional username input
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white opacity-80 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setIsTypingInForm(true); }}
                  onFocus={() => setIsTypingInForm(true)}
                  className="block w-full px-4 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent bg-black/20 text-white placeholder-white/60 transition-all outline-none backdrop-blur-sm"
                  required={isSignUp}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white opacity-80 mb-1">Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setIsTypingInForm(true); }}
                onFocus={() => setIsTypingInForm(true)}
                className="block w-full px-4 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent bg-black/20 text-white placeholder-white/60 transition-all outline-none backdrop-blur-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white opacity-80 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setIsTypingInForm(true); }}
                onFocus={() => setIsTypingInForm(true)}
                className="block w-full px-4 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent bg-black/20 text-white placeholder-white/60 transition-all outline-none backdrop-blur-sm"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white uppercase tracking-wide transition-all duration-300 transform hover:-translate-y-0.5"
              style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.25)'}
              disabled={loading}
            >
              {loading ? 'PLEASE WAIT...' : (isSignUp ? 'Sign Up' : 'Log In')}
            </button>
          </form>

          {message && (
            <div className={`p-3 rounded-md text-center text-sm font-medium backdrop-blur-md bg-black/10 ${message.startsWith('Error') ? 'text-red-100 border border-red-200/30' : 'text-green-100 border border-green-200/30'}`}>
              {message}
            </div>
          )}
          
          <div className="text-center relative z-10 pt-2">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-white opacity-70 hover:opacity-100 transition-opacity uppercase tracking-wider"
              disabled={loading}
            >
              {isSignUp ? 'Already have an account? Log In' : 'Create an Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;