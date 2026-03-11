import React from 'react';
import { XMarkIcon } from './Icons'; // Assuming XMarkIcon is in Icons.tsx
import { useTheme } from '../App';

interface InfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoPopup: React.FC<InfoPopupProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme(); // Now only using theme, font is global via body

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-card)] p-8 rounded-lg shadow-2xl max-w-2xl w-full text-left relative transition-colors duration-300 overflow-y-auto max-h-[90vh]" style={{ fontFamily: 'inherit' }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors duration-200"
          aria-label="Close information popup"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-6">ClarityIQ - How It Works</h2>

        {/* Get Started Section */}
        <div className="bg-[var(--color-bg-body)] p-6 rounded-lg shadow-inner border border-[var(--color-border-default)] mb-6">
          <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">Get Started</h3>
          <p className="text-[var(--color-text-secondary)]">
            Use the "Upload New Audio File" button <span className="inline-block px-1 py-0.5 rounded bg-[var(--color-primary)] text-white text-xs">Upload</span> in the top right to analyze your first sales call.
            ClarityIQ will extract key insights, BANT information, and assess deal momentum.
          </p>
        </div>

        {/* Navigation Guide */}
        <div className="bg-[var(--color-bg-body)] p-6 rounded-lg shadow-inner border border-[var(--color-border-default)] mb-6">
          <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">Navigation</h3>
          <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-2">
            <li><strong>Dashboard:</strong> Your overview of key metrics, deal momentum, and customer vibes.</li>
            <li><strong>History:</strong> View all your analyzed calls with detailed breakdowns.</li>
            <li><strong>Customers:</strong> Manage your customer list – add, edit, or delete customer records.</li>
            <li><strong>Meetings:</strong> Organize your calls by meetings, and add new meetings here.</li>
          </ul>
        </div>

        {/* The Deal Arc Engine */}
        <div className="bg-[var(--color-bg-body)] p-6 rounded-lg shadow-inner border border-[var(--color-border-default)]">
          <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">The Deal Arc Engine</h3>
          <p className="text-[var(--color-text-secondary)]">
            ClarityIQ helps you eliminate 'deal decay' by providing a continuous, psychological,
            and structural memory of every customer relationship. Understand the emotional
            and structural trajectory of your deals across their entire lifecycle.
            It leverages advanced AI to interpret vocal micro-shifts and contextual data
            to give you a real-time pulse on your deals.
          </p>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[var(--color-primary)] text-white font-medium rounded-md shadow-sm hover:bg-[var(--color-primary-dark)] transition-colors duration-200"
            style={{ fontFamily: 'inherit' }}
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoPopup;