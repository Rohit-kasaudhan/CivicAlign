import { CATEGORIES } from './constants';
import { parseIsoDate } from './helpers';


export const statusKey = (status = '') => `status_${String(status).toLowerCase()}`;

export const categoryKey = (category = '') => {
  const map = {
    Roads: 'cat_roads',
    Drainage: 'cat_drainage',
    'Water Supply': 'cat_water',
    'Waste Management': 'cat_waste',
    Environment: 'cat_environment',
    Healthcare: 'cat_healthcare',
    Electricity: 'cat_electricity',
    Transportation: 'cat_transport',
    'Public Safety': 'cat_safety',
    Education: 'cat_education',
  };
  return map[category] || category;
};

export const badgeKey = (badge = '') => {
  const map = {
    Reporter: 'badge_reporter',
    'Community Voice': 'badge_voice',
    'Change Maker': 'badge_maker',
    'Civic Guardian': 'badge_guardian',
    'Civic Hero': 'badge_hero',
    'Civic Legend': 'badge_legend',
  };
  return map[badge] || badge;
};

export const priorityKey = (priority = '') => `priority_${String(priority).toLowerCase()}`;

export const translateCategory = (t, category) => t(categoryKey(category));
export const translateBadge = (t, badge) => t(badgeKey(badge));
export const translatePriority = (t, priority) => t(priorityKey(priority));
export const translateStatus = (t, status) => t(statusKey(status));

export const localizedCategoryOptions = (t) =>
  CATEGORIES.map((value) => ({ value, label: translateCategory(t, value) }));

export const formatRelativeTimeLocalized = (dateString, t) => {
  if (!dateString) return '';
  const parsed = parseIsoDate(dateString);
  if (!parsed) return '';
  const diff = Date.now() - parsed.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('time_just_now');
  if (mins < 60) return `${mins}${t('time_min_suffix')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t('time_hour_suffix')}`;
  const days = Math.floor(hrs / 24);
  return `${days}${t('time_day_suffix')}`;
};

const quoted = (text = '') => {
  const match = text.match(/["“](.+?)["”]/);
  return match?.[1] || '';
};

const assignedDepartment = (text = '') => {
  const match = text.match(/assigned to (.+?)\.?$/i);
  return match?.[1] || '';
};

export const translateNotification = (notification, t) => {
  const title = notification?.title || '';
  const message = notification?.message || '';
  const complaintTitle = quoted(message);
  const department = assignedDepartment(message);

  if (/Complaint Submitted/i.test(title)) {
    return {
      title: t('notif_complaint_submitted_title'),
      message: t('notif_complaint_submitted_message').replace('{title}', complaintTitle),
    };
  }

  if (/verified/i.test(title)) {
    return {
      title: t('notif_verified_title'),
      message: t('notif_verified_message').replace('{title}', complaintTitle),
    };
  }

  if (/supported/i.test(title)) {
    return {
      title: t('notif_supported_title'),
      message: t('notif_supported_message').replace('{title}', complaintTitle),
    };
  }

  if (/New Badge|Badge Unlocked/i.test(title)) {
    const badge = Object.keys({
      Reporter: true,
      'Community Voice': true,
      'Change Maker': true,
      'Civic Guardian': true,
      'Civic Hero': true,
      'Civic Legend': true,
    }).find((name) => title.includes(name) || message.includes(name));
    return {
      title: t('notif_badge_title'),
      message: t('notif_badge_message').replace('{badge}', badge ? translateBadge(t, badge) : ''),
    };
  }

  if (/resolved/i.test(title)) {
    return {
      title: t('notif_resolved_title'),
      message: t('notif_resolved_message').replace('{title}', complaintTitle),
    };
  }

  if (/assigned/i.test(title)) {
    return {
      title: t('notif_assigned_title'),
      message: t('notif_assigned_message')
        .replace('{title}', complaintTitle)
        .replace('{department}', department),
    };
  }

  if (/approved/i.test(title)) {
    return {
      title: t('notif_approved_title'),
      message: t('notif_approved_message').replace('{title}', complaintTitle),
    };
  }

  if (/in progress/i.test(title)) {
    return {
      title: t('notif_progress_title'),
      message: t('notif_progress_message').replace('{title}', complaintTitle),
    };
  }

  return { title, message };
};
