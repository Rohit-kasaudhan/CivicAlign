export const parseIsoDate = (dateString) => {
  if (!dateString) return null;
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(dateString)) {
    return new Date(dateString + 'Z');
  }
  return new Date(dateString);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const parsed = parseIsoDate(dateString);
  if (!parsed) return '';
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const parsed = parseIsoDate(dateString);
  if (!parsed) return '';
  const diff = Date.now() - parsed.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'submitted':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'ai_processed':
      return 'bg-purple-100 text-purple-700 border border-purple-200';
    case 'evidence_verified':
      return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
    case 'community_verified':
      return 'bg-teal-100 text-teal-700 border border-teal-200';
    case 'under_review':
      return 'bg-orange-100 text-orange-700 border border-orange-200';
    case 'approved':
      return 'bg-lime-100 text-lime-700 border border-lime-200';
    case 'assigned':
      return 'bg-violet-100 text-violet-700 border border-violet-200';
    case 'in_progress':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'resolved':
      return 'bg-green-100 text-green-700 border border-green-200';
    case 'closed':
      return 'bg-gray-100 text-gray-600 border border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
};

export const getStatusLabel = (status) => {
  const labels = {
    submitted: 'Submitted',
    ai_processed: 'AI Processed',
    evidence_verified: 'Evidence Verified',
    community_verified: 'Community Verified',
    under_review: 'Under Review',
    approved: 'Approved',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labels[status] || status;
};

export const BADGE_INFO = [
  { name: 'Reporter',        min: 0,    max: 100,  emoji: '🌱' },
  { name: 'Community Voice', min: 100,  max: 300,  emoji: '📢' },
  { name: 'Change Maker',    min: 300,  max: 600,  emoji: '⚡' },
  { name: 'Civic Guardian',  min: 600,  max: 1000, emoji: '🛡️' },
  { name: 'Civic Hero',      min: 1000, max: 2000, emoji: '🦸' },
  { name: 'Civic Legend',    min: 2000, max: null, emoji: '🌟' },
];

export const getBadgeInfo = (points = 0) => {
  for (let i = BADGE_INFO.length - 1; i >= 0; i--) {
    if (points >= BADGE_INFO[i].min) {
      const current = BADGE_INFO[i];
      const next = BADGE_INFO[i + 1] || null;
      const progress = next
        ? Math.min(((points - current.min) / (next.min - current.min)) * 100, 100)
        : 100;
      return { current, next, progress };
    }
  }
  return { current: BADGE_INFO[0], next: BADGE_INFO[1], progress: 0 };
};
