import React, { useEffect, useState, useCallback } from 'react';
import {
  User, Mail, Phone, MapPin, Edit2, Save, X,
  Shield, Star, Calendar, Loader2, Trophy,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../context/ToastContext';
import { updateProfile, getMyStats, getMyBadges } from '../../api/auth';
import { BADGE_INFO, getBadgeInfo, formatDate } from '../../utils/helpers';

// Deterministic avatar color from name
const AVATAR_COLORS = [
  '#1e40af', '#0891b2', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#db2777', '#65a30d', '#ea580c', '#0284c7',
];
const avatarColor = (name = '') => {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const initials = (name = '') =>
  name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />
);

// ── Field row ─────────────────────────────────────────────────────────────────
const Field = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={14} className="text-[#1e40af]" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      {children}
    </div>
  </div>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ value, label, sub }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
    <p className="text-2xl font-extrabold text-[#1e40af]">{value ?? '—'}</p>
    <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const Profile = () => {
  const { user, updateUser }      = useAuth();
  const { language, changeLanguage } = useLanguage();
  const toast                     = useToast();

  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({});

  const [stats, setStats]         = useState(null);
  const [statsLoading, setStatsL] = useState(true);

  const [badges, setBadges]       = useState([]);
  const [badgesLoading, setBadgeL]= useState(true);
  const [earnedMap, setEarnedMap] = useState({});

  // Populate form whenever user data changes
  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        phone:     user.phone     || '',
        country:   user.country   || '',
        state:     user.state     || '',
        city:      user.city      || '',
        language:  user.preferred_language || language || 'en',
      });
    }
  }, [user]);

  // Fetch stats + badge history in parallel
  useEffect(() => {
    getMyStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsL(false));

    getMyBadges()
      .then((data) => {
        const earned = {};
        (data.badges || []).forEach((b) => { earned[b.badge_name] = b.earned_at; });
        setEarnedMap(earned);
        setBadges(data.badges || []);
      })
      .catch(() => {})
      .finally(() => setBadgeL(false));
  }, []);

  const badgeInfo = getBadgeInfo(stats?.points ?? user?.points ?? 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const profileData = {
        full_name: form.full_name,
        phone:     form.phone,
        country:   form.country,
        state:     form.state,
        city:      form.city,
      };
      const result = await updateProfile(profileData);
      updateUser(result.user);

      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }, [form, user, updateUser, changeLanguage, toast]);

  const handleCancel = () => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        phone:     user.phone     || '',
        country:   user.country   || '',
        state:     user.state     || '',
        city:      user.city      || '',
        language:  user.preferred_language || language || 'en',
      });
    }
    setEditing(false);
  };

  const color = avatarColor(user?.full_name || '');
  const pts   = stats?.points ?? user?.points ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Avatar + Info card ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-extrabold shadow"
              style={{ background: color }}
            >
              {initials(user?.full_name)}
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg leading-tight">{user?.full_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full">
              <Shield size={12} className="text-[#1e40af]" />
              <span className="text-xs font-semibold text-[#1e40af] capitalize">{user?.role}</span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Info fields (view mode) */}
          {!editing && (
            <div className="space-y-3">
              <Field icon={Mail} label="Email">
                <p className="text-sm text-gray-700 break-all">{user?.email || '—'}</p>
              </Field>
              <Field icon={Phone} label="Phone">
                <p className="text-sm text-gray-700">{user?.phone || '—'}</p>
              </Field>
              <Field icon={MapPin} label="Location">
                <p className="text-sm text-gray-700">
                  {[user?.city, user?.state, user?.country].filter(Boolean).join(', ') || '—'}
                </p>
              </Field>
              {stats?.member_since && (
                <Field icon={Calendar} label="Member since">
                  <p className="text-sm text-gray-700">{formatDate(stats.member_since)}</p>
                </Field>
              )}
            </div>
          )}

          {/* Edit button */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Edit2 size={13} /> Edit Profile
            </button>
          )}
        </div>

        {/* ── Right col: Stats + Edit form + Badges ─────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Edit form ──────────────────────────────────────────── */}
          {editing && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800">Edit Profile</h2>
                <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'full_name', label: 'Full Name', type: 'text', required: true },
                  { name: 'phone',     label: 'Phone',     type: 'tel'  },
                  { name: 'country',   label: 'Country',   type: 'text' },
                  { name: 'state',     label: 'State',     type: 'text' },
                  { name: 'city',      label: 'City',      type: 'text' },
                ].map(({ name, label, type, required }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    <input
                      type={type}
                      name={name}
                      value={form[name] || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af]"
                    />
                  </div>
                ))}

              </div>

              <p className="text-xs text-gray-400">Email cannot be changed.</p>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.full_name?.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1e40af] text-white rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ── Stats section ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4">Your Impact</h2>

            {statsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard value={stats?.total}    label="Complaints"  sub="Total submitted" />
                <StatCard value={stats?.approved} label="Approved"    sub="Picked up" />
                <StatCard value={stats?.resolved} label="Resolved"    sub="Completed" />
                <StatCard value={pts}             label="Points"      sub="Reputation" />
              </div>
            )}

            {/* Badge progress */}
            <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy size={15} className="text-amber-500" />
                  <span className="text-sm font-bold text-gray-700">
                    {badgeInfo.current.emoji} {badgeInfo.current.name}
                  </span>
                </div>
                {badgeInfo.next && (
                  <span className="text-xs text-gray-400">
                    {badgeInfo.next.emoji} {badgeInfo.next.name} at {badgeInfo.next.min} pts
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#1e40af] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${badgeInfo.progress}%` }}
                />
              </div>
              {badgeInfo.next ? (
                <p className="text-xs text-gray-400 mt-1.5">
                  {pts} / {badgeInfo.next.min} points · {badgeInfo.next.min - pts} to go
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1.5">Maximum badge achieved!</p>
              )}
            </div>
          </div>

          {/* ── Badge history ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-4">Badge Collection</h2>

            {badgesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BADGE_INFO.map((badge) => {
                  const earnedAt = earnedMap[badge.name];
                  const earned   = Boolean(earnedAt);
                  return (
                    <div
                      key={badge.name}
                      className={`rounded-xl border p-4 text-center transition-all
                        ${earned
                          ? 'bg-blue-50 border-blue-100'
                          : 'bg-gray-50 border-gray-100 opacity-50'
                        }`}
                    >
                      <span className="text-3xl">{badge.emoji}</span>
                      <p className={`text-xs font-bold mt-1.5 ${earned ? 'text-[#1e40af]' : 'text-gray-400'}`}>
                        {badge.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{badge.min} pts required</p>
                      {earned ? (
                        <p className="text-[10px] text-green-600 font-medium mt-1">
                          Earned {formatDate(earnedAt)}
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-300 mt-1">Not yet earned</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
