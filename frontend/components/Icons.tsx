


import React from 'react';

interface IconProps {
  className?: string;
  onClick?: () => void;
  'aria-label'?: string; // Add aria-label for accessibility
  style?: React.CSSProperties; 
}

// NEW ThemeToggleIcon using the provided SVG
export const ThemeToggleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    x="0px"
    y="0px"
    viewBox="0 0 29.73 29.73"
    enableBackground="new 0 0 29.73 29.73"
    xmlSpace="preserve"
    fill="currentColor" // Set fill to currentColor for theme consistency
    className={className}
    {...props}
  >
    <g>
      <path d="M14.865,0C6.655,0,0,6.655,0,14.865c0,1.714,0.201,2.83,0.767,4.546c1.104,3.188,6.896-2.808,9.388,0.729
		c2.492,3.535-5.62,6.64-0.18,8.764c2.475,0.601,3.175,0.826,4.89,0.826c8.21,0,14.865-6.654,14.865-14.864
		C29.73,6.655,23.075,0,14.865,0z M22.077,4.955c1.694,0,3.069,1.170,3.069,2.614c0,1.442-1.375,2.613-3.069,2.613
		c-1.695,0-3.070-1.171-3.070-2.613C19.007,6.125,20.381,4.955,22.077,4.955z M4.74,15.802c-1.695,0-3.069-1.171-3.069-2.614
		s1.375-2.614,3.069-2.614c1.696,0,3.071,1.171,3.071,2.614S6.437,15.802,4.74,15.802z M8.335,9.784c-1.695,0-3.070-1.170-3.070-2.614
		c0-1.444,1.375-2.614,3.070-2.614s3.070,1.170,3.070,2.614C11.405,8.614,10.030,9.784,8.335,9.784z M12.078,4.189
		c0-1.443,1.374-2.615,3.070-2.615c1.694,0,3.068,1.172,3.068,2.615s-1.375,2.614-3.068,2.614
		C13.452,6.803,12.078,5.632,12.078,4.189z M17.341,27.627c-1.696,0-3.069-1.170-3.069-2.613s1.375-2.613,3.069-2.613
		c1.695,0,3.070,1.170,3.070,2.613S19.036,27.627,17.341,27.627z M23.480,23.155c-1.695,0-3.069-1.173-3.069-2.614
		c0-1.443,1.374-2.614,3.069-2.614c1.694,0,3.069,1.171,3.069,2.614C26.550,21.982,25.176,23.155,23.480,23.155z M25.146,16.604
		c-1.695,0-3.070-1.170-3.070-2.614s1.375-2.614,3.070-2.614s3.070,1.170,3.070,2.614S26.843,16.604,25.146,16.604z"/>
    </g>
  </svg>
);


// Removed SunIcon and MoonIcon definitions as they are no longer used for theme toggling.

export const HamburgerIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

export const DashboardIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <style>{`.cls-1{fill:none;}`}</style>
    </defs>
    <title>dashboard</title>
    {/* Corrected path for the pie chart part of the dashboard icon */}
    <path d="M12,26a5,5,0,1,1,5-5A5.0059,5.0059,0,0,1,12,26ZM12,18a3,3,0,1,0,3,3A3.0033,3.0033,0,0,0,12,18Z" fill="currentColor"/>
    <rect x="24" y="21" width="2" height="5" fill="currentColor"/>
    <rect x="20" y="16" width="2" height="10" fill="currentColor"/>
    {/* Main frame and internal divisions - kept as was, seems correct */}
    <path d="M28,2H4A2.002,2.002,0,0,0,2,4V28a2.0023,2.0023,0,0,0,2,2H28a2.0027,2.0027,0,0,0,2-2V4A2.0023,2.0023,0,0,0,28,2ZM28,11H14V4H28ZM12,4V11H4V4ZM4,28V13H28.0007L28.0013,28Z" fill="currentColor"/>
    <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" className="cls-1" width="32" height="32"/>
  </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export const CustomersIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  // NEW CustomersIcon
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" className={className} {...props}>
    <circle cx="5" cy="9" r="2.25" />
    <circle cx="11" cy="4" r="2.25" />
    <path d="m7.75 9.25c0-1 .75-3 3.25-3s3.25 2 3.25 3m-12.5 5c0-1 .75-3 3.25-3s3.25 2 3.25 3" />
  </svg>
);

export const MeetingsIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  // NEW MeetingsIcon
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M4 10H20V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.77778 5H4V10H20V5H18.2222M11.1111 5H12.8889" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="4" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="16" y1="4" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9.654" cy="14.5274" r="0.827004" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 18.1111V17.8354C8 16.9219 8.74052 16.1814 9.65401 16.1814V16.1814C10.5675 16.1814 11.308 16.9219 11.308 17.8354V18.1111" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="14.346" cy="14.5274" r="0.827004" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.692 18.1111V17.8354C12.692 16.9219 13.4325 16.1814 14.346 16.1814V16.1814C15.2595 16.1814 16 16.9219 16 17.8354V18.1111" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export const UserCircleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 9 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export const ArrowTrendingUpIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path fill="currentColor" d="M12 6c0-.55-.45-1-1-1H5.82l.66-3.18.02-.23c0-.31-.13-.59-.33-.8L5.38 0 .44 4.94C.17 5.21 0 5.59 0 6v6.5c0 .83.67 1.5 1.5 1.5h6.75c.62 0 1.15-.38 1.38-.91l2.26-5.29c.07-.17.11-.36.11-.55V6zm10.5 4h-6.75c-.62 0-1.15.38-1.38.91l-2.26 5.29c-.07.17-.11.36-.11.55V18c0 .55.45 1 1 1h5.18l-.66 3.18-.02.24c0 .31.13.59.33.8l.79.78 4.94-4.94c.27-.27.44-.65.44-1.06v-6.5c0-.83-.67-1.5-1.5-1.5z"/>
  </svg>
);

export const AudioWaveformIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path fill="currentColor" d="M13,4V20a1,1,0,0,1-2,0V4a1,1,0,0,1,2,0ZM8,5A1,1,0,0,0,7,6V18a1,1,0,0,0,2,0V6A1,1,0,0,0,8,5ZM4,7A1,1,0,0,0,3,8v8a1,1,0,0,0,2,0V8A1,1,0,0,0,4,7ZM16,5a1,1,0,0,0-1,1V18a1,1,0,0,0,2,0V6A1,1,0,0,0,16,5Zm4,2a1,1,0,0,0-1,1v8a1,1,0,0,0,2,0V8A1,1,0,0,0,20,7Z"/>
  </svg>
);

export const TranscriptionIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path fill="currentColor" d="M117.8,4C65,4,22.3,46.7,22.4,99.5c0,30.5,14.3,57.6,36.5,75.1v81h23.6v-13h22.6v13h55.5v-29.2h15c20.8,0,37.6-16.9,37.6-37.7V162H226c4.3,0,7.7-3.5,7.7-7.7c0-1.1-0.2-2.1-0.6-3l-19.9-50.2c0,0-2.1-20.8-3.9-28.8C201,36.5,161.1,4,117.8,4M105.1,202.4H82.5v-12.2h22.6V202.4z M105.1,185H82.5v-12.2h22.6V185z M105.1,220H82.5v-12.3h22.6V220z M105.1,237.4H82.5v-12.3h22.6V237.4z M105.1,167.6H82.4v-9.5c0-0.9-0.1-1.8-0.1-2.7h22.8V167.6z M42.4,84.9c0-5.7,1.9-10.8,5-14.7c-0.5-2-0.8-4.2-0.8-6.4c0-11.1,7.3-20.4,17.4-23.5c3.9-8.6,12.5-14.6,22.4-14.6c2,0,3.9,0.3,5.7,0.7c4.4-4.1,10.3-6.6,16.7-6.6c5,0,9.7,1.5,13.6,4.1c3.5-1.9,7.4-2.9,11.6-2.9c8.5,0,16,4.2,20.4,10.7c0.6,0,1.2-0.1,1.8-0.1c11.8,0,21.6,8.3,24,19.3c8.9,3.8,15.2,12.7,15.2,23.1c0,13.9-11.2,25.1-25.1,25.1c-5.1,0-9.8-1.5-13.7-4.1c-3.9,2.6-8.7,4.2-13.8,4.2c-5.1,0-9.8-1.6-13.8-4.3c-2.7,3.1-6.6,5.5-10.2,6.9c-7.6,3.2-13.7,12.4-13.7,22.1v26.4h-9v-27.7c0.1-9.8-3.5-17.7-11-22.1c-2.1-1.3-3.9-2.6-5.4-4.1c-0.1-0.1-0.3-0.3-0.4-0.4c-1.9-2.1-3.2-4.4-3.8-7.3c1.8-0.6,3.7-0.9,5.7-0.9c2.4,0,4.9,0.4,7.3,1.4c1.4,0.6,2.9-0.1,3.4-1.4c0.6-1.3-0.1-2.9-1.4-3.4c-3-1.2-6.1-1.8-9.2-1.8c-2.2,0-4.3,0.3-6.3,0.8c0-10.8,8.7-19.5,19.5-19.5l0,0l0,0c4,0,7.7-1,11-2.6c3.1,3.6,4.7,8.1,4.7,12.7v0.7c0,0.1,0,0.1,0,0.2c-0.1,4.7-1.9,9.3-5.4,13l0,0c-1,1.1-1,2.7,0.1,3.7c0.5,0.5,1.2,0.7,1.8,0.7c0,0,1.4-0.3,1.9-0.8c3.9-4.1,6.1-9.3,6.7-14.5c1.3-0.3,2.6-0.4,4-0.4c3.1,0,6.2,0.7,9.2,2.3c0.4,0.2,0.8,0.3,1.2,0.3c0.9,0,1.8-0.5,2.3-1.4c0.6-1.3,0.2-2.8-1.1-3.5c-3.7-2-7.7-2.9-11.6-2.9c-1.3,0-2.7,0.1-4,0.3c-0.5-4.6-2.3-9.1-5.4-12.9c3-2.5,5.5-5.6,7.1-9.2c4.3,3.1,9.4,4.7,14.5,4.7c1.8,0,3.5-0.2,5.3-0.6c1.7,12,12,21.3,24.5,21.3l0,0l0,0h0.3c5.3,0,10.1,2.1,13.6,5.5c0.5,0.5,1.1,0.7,1.7,0.7c0.7,0,1.4-0.3,1.9-0.8c1.1-1.1,1.1-2.7,0-3.7c-4.4-4.4-10.5-7-17.2-7h-0.3l0,0c-1.7,0-3.4-0.3-5-0.7c2.4-3.2,5.7-5.8,9.9-7.1c1.4-0.4,2.1-1.8,1.7-3.2c-0.5-1.4-1.9-2.1-3.3-1.7c-5.6,1.7-10.2,5.4-13.2,10c-5.2-3.1-9-8.6-9.5-15.1c2.6-1.2,5-2.9,7.1-5c1-1.1,1-2.7,0-3.7c-1.1-1-2.7-1-3.7,0c-2.1,2-4.5,3.6-7.1,4.5c-0.1,0-0.1,0-0.1,0c-2.1,0.8-4.3,1.2-6.6,1.2c-4.6,0-9.1-1.6-12.8-4.8c0.3-1.6,0.5-3.2,0.5-4.9c0-1.4-1.1-2.6-2.6-2.6c-1.4,0-2.6,1.2-2.6,2.6c0,10-7.4,18.2-17.1,19.4c-0.7-5.7-3.3-10.9-7.1-14.7c-1-1-2.7-1-3.7,0s-1,2.6,0,3.6c3.1,3,5.1,7,5.6,11.4c-8.2,1-15.2,5.9-19,12.9c-4.7-0.6-8.8-2.9-11.9-6.2c-0.9-1.1-2.5-1.2-3.6-0.2c-1.1,1-1.2,2.6-0.2,3.7c3.5,3.8,8.3,6.6,13.7,7.6c-0.7,2.2-1,4.5-1,6.8c0,0.1,0,0.1,0,0.1c-0.1,5.2,1.2,9.6,3.6,13.2c-4.6,2-8.6,5.6-11.3,10.3l0,0c-0.7,1.2-0.3,2.8,1,3.5c0.4,0.2,0.9,0.3,1.3,0.3c0.9,0,1.8-0.5,2.3-1.3c2.4-4.2,6.2-7.2,10.4-8.7c1.6,1.5,3.5,2.9,5.6,4.1c5.7,3.4,8.4,9,8.5,17.6v27.7h-9.4c-1.8-12-7.8-22-17.8-27.8v-0.1c-8.2-3.6-14.1-11.4-14.8-20.7C45,97.3,42.4,91.4,42.4,84.9"/>
  </svg>
);

export const BANTIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <g fill="currentColor">
      <path d="M330.666667,213.333333 C383.686003,213.333333 426.666667,256.313997 426.666667,309.333333 C426.666667,362.352669 383.686003,405.333333 330.666667,405.333333 C277.647331,405.333333 234.666667,362.352669 234.666667,309.333333 C234.666667,256.313997 277.647331,213.333333 330.666667,213.333333 Z M298.666667,256 L298.666667,362.666667 L394.666667,309.333333 L298.666667,256 Z M217.750247,277.332553 C214.872978,287.505196 213.333333,298.239463 213.333333,309.333333 C213.333333,312.929471 213.495114,316.487822 213.811795,320.001506 L7.10542736e-15,320 L7.10542736e-15,277.333333 L217.750247,277.332553 Z M85.3333333,106.666667 L85.3333333,256 L21.3333333,256 L21.3333333,106.666667 L85.3333333,106.666667 Z M192,170.666667 L192,256 L128,256 L128,170.666667 L192,170.666667 Z M298.666667,149.333333 L298.665886,196.416914 C272.44898,203.832203 249.96235,220.131918 234.664106,241.857949 L234.666667,149.333333 L298.666667,149.333333 Z M405.333333,170.666667 L405.335205,218.821004 C387.620087,204.19017 365.537062,194.659753 341.33484,192.478461 L341.333333,170.666667 L405.333333,170.666667 Z M266.666667,1.42108547e-14 C284.339779,1.42108547e-14 298.666667,14.326888 298.666667,32 C298.666667,32.4356001 298.657963,32.8691674 298.64072,33.3005374 L349.283,53.5572349 C355.147737,46.8807505 363.748409,42.6666667 373.333333,42.6666667 C391.006445,42.6666667 405.333333,56.9935547 405.333333,74.6666667 C405.333333,92.3397787 391.006445,106.666667 373.333333,106.666667 C355.660221,106.666667 341.333333,92.3397787 341.333333,74.6666667 C341.333333,74.2307299 341.34205,73.7968291 341.35932,73.3651292 L290.718082,53.1081995 C284.853321,59.7853977 276.25218,64 266.666667,64 C258.917401,64 251.81149,61.245474 246.274635,56.6621239 L191.36331,89.6169018 C191.780845,91.6795653 192,93.8141895 192,96 C192,113.673112 177.673112,128 160,128 C142.326888,128 128,113.673112 128,96 C128,93.8156034 128.218871,91.6823268 128.63588,89.6209045 L73.7162402,56.6696749 C68.1807035,61.2484992 61.0783421,64 53.3333333,64 C35.6602213,64 21.3333333,49.673112 21.3333333,1.42108547e-14 C21.3333333,14.326888 35.6602213,1.42108547e-14 53.3333333,1.42108547e-14 C71.0064453,1.42108547e-14 85.3333333,14.326888 85.3333333,32 C85.3333333,34.1847501 85.1143912,36.3183635 84.697251,38.3800962 L139.615099,71.3319749 C145.150924,66.7521617 152.254061,64 160,64 C167.745554,64 174.848371,66.7518885 180.384077,71.3312928 L235.302749,38.3800962 C234.885609,36.3183635 234.666667,34.1847501 234.666667,32 C234.666667,14.326888 248.993555,1.42108547e-14 266.666667,1.42108547e-14 Z"/>
    </g>
  </svg>
);

export const ContinuousDocumentationIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg viewBox="0 0 512.001 512.001" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <g fill="currentColor">
      <path d="M184.757,208.096c-11.337,0-20.529-9.193-20.529-20.529V30.187h-143.7C9.191,30.187,0,39.379,0,50.716v410.571 C0,472.023,9.191,481.215,20.529,481.215h301.086c11.337,0,20.529-9.193-20.529-20.529V208.096H184.757z M239.5,386.016H102.643 c-11.337,0-20.529-9.193-20.529-20.529c0-11.339,9.191-20.529,20.529-20.529H239.5c11.337,0,20.529,9.19,20.529,20.529 C260.028,376.823,250.837,386.016,239.5,386.016z M239.5,303.901H102.643c-11.337,0-20.529-9.193-20.529-20.529 c0-11.339,9.191-20.529,20.529-20.529H239.5c11.337,0,20.529,9.19,20.529,20.529C260.028,294.709,250.837,303.901,239.5,303.901z"/>
      <polygon points="205.286,42.212 205.286,167.039 330.117,167.039"/>
      <path d="M505.988,36.199c-3.85-3.85-9.071-6.013-14.516-6.013h-87.743c-5.446,0-10.667,2.162-14.516,6.013 c-3.85,3.85-6.012,9.071-6.012,14.516l0.001,118.043v37.615l0.001,211.043c0,5.444,2.162,10.665,6.014,14.514l43.87,43.87 c4.009,4.01,9.263,6.015,14.515,6.015c5.253,0,10.508-2.005,14.515-6.015l43.87-43.87c3.85-3.85,6.013-9.071,6.013-14.514 l0.003-366.702C512,45.27,509.838,40.049,505.988,36.199z"/>
    </g>
  </svg>
);

// NEW RecordIcon (circle)
export const RecordIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
  </svg>
);

// NEW StopIcon (square)
export const StopIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
);

// NEW UploadIcon
export const UploadIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M20.987 16c0-.105-.004-.211-.039-.316l-2-6c-.136-.409-.517-.684-.948-.684h-4v2h3.279l1.667 5h-13.892l1.667-5h3.279v-2h-4c-.431 0-.812.275-.948.684l-2 6c-.035.105-.039.211-.039.316-.013 0-.013 5-.013 5 0 .553.447 1 1 1h16c.553 0 1-.447 1-1 0 0 0-5-.013-5zM16 7.904c.259 0 .518-.095.707-.283.39-.39.39-1.024 0-1.414l-4.707-4.707-4.707 4.707c-.39.39-.39 1.024 0 1.414.189.189.448.283.707.283s.518-.094.707-.283l2.293-2.293v6.672c0 .552.448 1 1 1s1-.448 1-1v-6.672l2.293 2.293c.189.189.448.283.707.283z"/>
  </svg>
);
// Fix: Added XCircleIcon
export const XCircleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// New Icons for CRUD operations
export const PlusIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const EditIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

export const DeleteIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.927a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.166m-1.022.165L5.757 19.673a2.25 2.25 0 002.244 2.077h8.927a2.25 2.25 0 002.244-2.077L19.58 5.79m-4.744-3.21l.935-.935A.75.75 0 0014.25 2h-4.5a.75.75 0 00-.53.22l-.935.935m-4.744-3.21l.935-.935A.75.75 0 0014.25 2h-4.5a.75.75 0 00-.53.22l-.935.935" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export const XMarkIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 3h.008v.008H12v-.008zM15 6.75h.008v.008H15v-.008zM15 9.75h.008v.008H15V9.75zm0 3h.008v.008H15v-.008zM18 6.75h.008v.008H18v-.008zM18 9.75h.008v.008H18V9.75zm0 3h.008v.008H18v-.008zM6.75 6.75h.008v.008H6.75v-.008zM6.75 9.75h.008v.008H6.75V9.75zm0 3h.008v.008H6.75v-.008zM9.75 6.75h.008v.008H9.75v-.008zM9.75 9.75h.008v.008H9.75V9.75z" />
  </svg>
);

export const ListBulletIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h-1.5a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25v-1.5m-4.5 0l-.75.75m-7.5-3v-6m0-3h.008v.008H4.5V3.75zm-.375 0h.008v.008h-.008V3.75zM7.5 3.75h.008v.008H7.5V3.75zm-.375 0h.008v.008h-.008V3.75zM3.75 3.75h.008v.008h-.008V3.75zm-.375 0h.008v.008h-.008V3.75zM12 3.75h.008v.008H12V3.75zm-.375 0h.008v.008h-.008V3.75zM15 3.75h.008v.008H15V3.75zm-.375 0h.008v.008h-.008V3.75zM18 3.75h.008v.008H18V3.75zm-.375 0h.008v.008h-.008V3.75zM21 3.75h.008v.008H21V3.75zm-.375 0h.008v.008h-.008V3.75z" />
  </svg>
);

// NEW Icons for Dashboard Visualizations
export const PieChartIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
);

export const LineChartIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l6.75 6.75L17.25 7.5h-5.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 3L12 12l-3-3" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.75V10.5a2.25 2.25 0 00-2.25-2.25H13.5M18 18.75H5.25A2.25 2.25 0 013 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5c1.11 0 2.22.895 2.22 1.995v1.005M18 18.75h-12.5m12.5 0v-6a2.25 2.25 0 00-2.25-2.25h-5.5a2.25 2.25 0 00-2.25 2.25v6m-9-6v6a2.25 2.25 0 002.25 2.25h5.5a2.25 2.25 0 002.25-2.25v-6m-9 0V9a2.25 2.25 0 012.25-2.25h5.5A2.25 2.25 0 0115 9v3" />
  </svg>
);

// NEW: InfoCircleIcon (used for help/info button)
export const InfoCircleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg fill="currentColor"
    xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 512 512" enableBackground="new 0 0 512 512" xmlSpace="preserve" className={className} {...props}>
<g>
	<path d="M285.172,331.453c-12.453,13.25-20.547,18.781-26.094,18.781c-3.859,0-5.172-3.422-4.312-11.141
		c2.594-20.062,17.531-84.578,21.781-107.625c4.266-19.719,3-29.953-2.562-29.953c-10.641,0-36.734,17.516-53.828,35.016
		c-0.875,1.344-2.562,8.578-1.688,11.125c0,0.875,1.266,1.312,1.266,1.312c10.266-8.125,18.391-12.844,23.109-12.844
		c2.109,0,2.938,3.406,1.688,9.406c-5.125,25.625-13.672,65.406-20.078,98.281c-5.984,28.672-2.172,40.188,6.812,40.188
		s33.766-11.984,53.906-38.906c0.812-2.094,1.641-10.188,1.25-12.359C286.422,331.906,285.172,331.453,285.172,331.453z"/>
	<path d="M281.281,128c-7.297,0-16.25,3.414-20.516,7.703c-1.688,2.141-3.406,8.539-3.859,11.945
		c0.453,7.711,2.578,11.984,6.859,14.562c2.109,1.68,16.219,0.414,19.219-1.312c5.188-3.398,9.828-10.25,10.703-18.375
		c0.375-3.82-0.438-8.984-2.141-11.531C290.688,129.719,287.25,128,281.281,128z"/>
	<path d="M256,0C114.609,0,0,114.609,0,256s114.609,256,256,256s256-114.609,256-256S397.391,0,256,0z M256,472
		c-119.297,0-216-96.703-216-216S136.703,40,256,40s216,96.703,216,216S375.297,472,256,472z"/>
</g>
</svg>
);

// NEW FontIcon (representing text/font)
export const FontIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg // Removed version="1.1" and id="_x32_"
    xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 512 512" xmlSpace="preserve" className={className} {...props}>
<g>
	<path fill="currentColor" d="M452.349,174.924c-2.95-11.607-13.402-19.726-25.377-19.726h-34.875c-11.326,0-21.369,7.27-24.892,18.034
		l-45.107,137.825l21.184,83.224l19.365-59.17h72.836l18.873,74.142H512L452.349,174.924z M373.354,302.417l27.032-82.607h5.751
		l21.028,82.607H373.354z"/>
	<path fill="currentColor" d="M205.804,65.185h-52.385c-17.012,0-32.097,10.933-37.392,27.108L0,446.815h72.74l36.447-111.374h109.41
		l28.35,111.374h86.578L243.929,94.818C239.492,77.385,223.794,65.185,205.804,65.185z M125.257,286.338l40.61-124.094h8.641
		l31.588,124.094H125.257z"/>
</g>
</svg>
);

// NEW: TableCellsIcon (for table view toggle)
export const TableCellsIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25zM13.5 6A2.25 2.25 0 0115.75 3.75h2.25A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25H15.75a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75A2.25 2.25 0 0115.75 13.5h2.25A2.25 2.25 0 0120.25 15.75V18a2.25 2.25 0 01-2.25 2.25H15.75a2.25 2.25 0 01-2.25-2.25v-2.25z" />
  </svg>
);

// NEW: Squares2X2Icon (for grid view toggle)
export const Squares2X2Icon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM14.25 6a2.25 2.25 0 012.25-2.25h2.25A2.25 2.25 0 0121 6v2.25a2.25 2.25 0 01-2.25 2.25H16.5a2.25 2.25 0 01-2.25-2.25V6zM3.75 14.25A2.25 2.25 0 016 12h2.25a2.25 2.25 0 012.25 2.25h0c0 1.242-1.008 2.25-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v0zM14.25 14.25A2.25 2.25 0 0116.5 12h2.25a2.25 2.25 0 012.25 2.25v0c0 1.242-1.008 2.25-2.25 2.25H16.5a2.25 2.25 0 01-2.25-2.25v0z" />
  </svg>
);

// New icons for sort direction
export const ChevronUpIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

// NEW: SettingsIcon for the settings page
export const SettingsIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.525 3.116c1.087-.905 2.8-.905 3.889 0l.439.366A2.25 2.25 0 0015.59 5.093l.363 1.054a.825.825 0 01.785.586 11.47 11.47 0 01.498 1.498 1.5 1.5 0 001.042 1.042l1.054.363a2.25 2.25 0 001.621 2.23l1.054.362c1.087.905 1.087 2.366 0 3.271l-1.054.362a2.25 2.25 0 00-1.621 2.23l-1.054.363a.825.825 0 01-.785.586 11.47 11.47 0 01-.498 1.498 1.5 1.5 0 00-1.042 1.042l-.363 1.054a2.25 2.25 0 01-2.23 1.621l-1.054.362c-1.087.905-2.8.905-3.889 0l-.439-.366a2.25 2.25 0 00-2.23-1.621l-.363-1.054a.825.825 0 01-.785-.586 11.47 11.47 0 01-.498-1.498 1.5 1.5 0 00-1.042-1.042l-1.054-.363a2.25 2.25 0 01-1.621-2.23l-1.054-.362c-1.087-.905-1.087-2.366 0-3.271l1.054-.362a2.25 2.25 0 001.621-2.23l1.054-.363a.825.825 0 01.785-.586 11.47 11.47 0 01.498-1.498 1.5 1.5 0 001.042-1.042l.363-1.054a2.25 2.25 0 012.23-1.621l1.054-.362z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
export const CopyIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

export const GlobeIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);
