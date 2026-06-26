export const STATUS_FLOW = [
  { key: 'submitted',          label: 'Submitted' },
  { key: 'ai_processed',       label: 'AI Processed' },
  { key: 'evidence_verified',  label: 'Evidence Verified' },
  { key: 'community_verified', label: 'Community Verified' },
  { key: 'under_review',       label: 'Under Review' },
  { key: 'approved',           label: 'Approved' },
  { key: 'assigned',           label: 'Assigned' },
  { key: 'in_progress',        label: 'In Progress' },
  { key: 'resolved',           label: 'Resolved' },
  { key: 'closed',             label: 'Closed' },
];

export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'critical'];

export const CATEGORIES = [
  'Roads',
  'Drainage',
  'Water Supply',
  'Waste Management',
  'Environment',
  'Healthcare',
  'Electricity',
  'Transportation',
  'Public Safety',
  'Education',
];

export const BADGE_THRESHOLDS = [
  { name: 'Reporter',        min: 0,    max: 99   },
  { name: 'Community Voice', min: 100,  max: 299  },
  { name: 'Change Maker',    min: 300,  max: 599  },
  { name: 'Civic Guardian',  min: 600,  max: 999  },
  { name: 'Civic Hero',      min: 1000, max: 1999 },
  { name: 'Civic Legend',    min: 2000, max: null  },
];

export const LANGUAGES = [
  { code: 'en', native: 'English',   label: 'English'  },
  { code: 'hi', native: 'हिन्दी',    label: 'Hindi'    },
  { code: 'mr', native: 'मराठी',     label: 'Marathi'  },
  { code: 'bn', native: 'বাংলা',     label: 'Bengali'  },
  { code: 'ta', native: 'தமிழ்',     label: 'Tamil'    },
  { code: 'te', native: 'తెలుగు',    label: 'Telugu'   },
  { code: 'gu', native: 'ગુજરાતી',   label: 'Gujarati' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ',    label: 'Punjabi'  },
  { code: 'ur', native: 'اردو',      label: 'Urdu'     },
  { code: 'ar', native: 'العربية',   label: 'Arabic'   },
  { code: 'fr', native: 'Français', label: 'French'   },
  { code: 'de', native: 'Deutsch',  label: 'German'   },
  { code: 'es', native: 'Español',  label: 'Spanish'  },
  { code: 'zh', native: '中文',      label: 'Chinese'  },
  { code: 'ja', native: '日本語',    label: 'Japanese' },
  { code: 'ko', native: '한국어',    label: 'Korean'   },
  { code: 'ru', native: 'Русский',  label: 'Russian'  },
];
