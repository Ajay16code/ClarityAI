

import React from 'react';
import { BohemAILogo } from './BohemAILogo';
import {
  DashboardIcon,
  HistoryIcon,
  CustomersIcon,
  MeetingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ThemeToggleIcon, // Import ThemeToggleIcon
  FontIcon,       // Import FontIcon
  SettingsIcon,   // Import new SettingsIcon
  UsersIcon,      // Import UsersIcon
} from './Icons'; // Consolidated icons
import { useTheme } from '../App'; // Import useTheme

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeNav: string;
  onNavigate: (item: string) => void;
  // New props for theme and font management
  theme: string;
  toggleTheme: () => void;
  font: string;
  toggleFont: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeNav, onNavigate, toggleSidebar, theme, toggleTheme, font, toggleFont }) => {
  // const { theme } = useTheme(); // No longer needed as theme is passed via props

  const navItems = [
    { name: 'Dashboard', icon: DashboardIcon },
    { name: 'Intelligence', icon: UsersIcon }, // New Intelligence item
    { name: 'History', icon: HistoryIcon },
    { name: 'Customers', icon: CustomersIcon },
    { name: 'Meetings', icon: MeetingsIcon },
    { name: 'Settings', icon: SettingsIcon }, // New Settings item
  ];

  return (
    // Fixed for mobile overlay, dynamic width for desktop sidebar
    <div
      className={`fixed top-0 left-0 h-full bg-[var(--color-bg-card)] shadow-lg transition-all duration-300 ease-in-out z-20
        ${isOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full'}
        md:translate-x-0 md:flex md:flex-col md:overflow-y-auto ${isOpen ? 'md:w-64' : 'md:w-16'}
      `}
      style={{ fontFamily: 'inherit' }}
    >
      <div className="flex flex-col h-full p-4">
        {/* Logo and App Title */}
        <div className="flex items-center justify-center py-4 border-b border-[var(--color-border-default)] mb-6">
          <BohemAILogo className={`w-10 h-10 text-[var(--color-primary)] ${isOpen ? 'mr-2' : ''}`} />
          {isOpen && <h1 className="text-2xl font-bold text-[var(--color-primary)]">ClarityAI</h1>}
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                onNavigate(item.name);
                // Close sidebar on small screens after navigation
                if (window.innerWidth < 768) { // Assuming md breakpoint is 768px
                  toggleSidebar();
                }
              }}
              className={`flex items-center w-full px-4 py-2 rounded-md text-left transition-colors duration-200
                ${activeNav === item.name
                  ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)]'
                }
                ${isOpen ? 'justify-start' : 'justify-center'}
              `}
              aria-label={item.name}
              style={{ fontFamily: 'inherit' }}
            >
              {/* Ensure icon always visible and doesn't shrink */}
              <item.icon className={`w-6 h-6 flex-shrink-0 ${isOpen ? 'mr-3' : ''}`} />
              {isOpen && <span>{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Theme and Font Switchers (moved from Navbar) */}
        <div className="pt-4 border-t border-[var(--color-border-default)] space-y-2">
          {isOpen ? (
            <>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm text-[var(--color-text-primary)] font-medium">Theme: {theme}</span>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors duration-200"
                  aria-label={`Switch theme (current: ${theme})`}
                  title={`Current Theme: ${theme}`}
                >
                  <ThemeToggleIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm text-[var(--color-text-primary)] font-medium">Font: {font}</span>
                <button
                  onClick={toggleFont}
                  className="p-2 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors duration-200"
                  aria-label={`Switch font (current: ${font})`}
                  title={`Current Font: ${font}`}
                >
                  <FontIcon className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            // Collapsed view for theme/font toggles
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors duration-200"
                aria-label={`Switch theme (current: ${theme})`}
                title={`Current Theme: ${theme}`}
              >
                <ThemeToggleIcon className="w-6 h-6" />
              </button>
              <button
                onClick={toggleFont}
                className="p-2 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border-default)] transition-colors duration-200"
                aria-label={`Switch font (current: ${font})`}
                title={`Current Font: ${font}`}
              >
                <FontIcon className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        {/* Collapse Button (only visible on desktop) */}
        <div className="mt-auto pt-4 border-t border-[var(--color-border-default)] md:block hidden">
          <button
            onClick={toggleSidebar}
            className="flex items-center w-full px-4 py-2 rounded-md justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] transition-colors duration-200"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{ fontFamily: 'inherit' }}
          >
            {isOpen ? (
              <>
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;