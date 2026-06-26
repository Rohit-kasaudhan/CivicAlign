import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// ── Animated counter hook ────────────────────────────────────────────────────
const useCounter = (target, duration = 1800) => {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
};

// ── Mock leaderboard data ────────────────────────────────────────────────────
const TOP_CITIZENS = [
  { rank: 1, name: 'Priya Sharma',   city: 'Mumbai',     points: 2450, badge: 'Civic Legend',  emoji: '🌟' },
  { rank: 2, name: 'Ravi Kumar',     city: 'Bangalore',  points: 1820, badge: 'Civic Hero',    emoji: '🦸' },
  { rank: 3, name: 'Anita Singh',    city: 'Delhi',      points: 1340, badge: 'Civic Hero',    emoji: '🦸' },
  { rank: 4, name: 'Mohammad Ali',   city: 'Hyderabad',  points: 890,  badge: 'Civic Guardian',emoji: '🛡️' },
  { rank: 5, name: 'Deepa Nair',     city: 'Chennai',    points: 720,  badge: 'Civic Guardian',emoji: '🛡️' },
];

const FEATURES = [
  { icon: '📸', title: 'AI-Powered Evidence Analysis', desc: 'Upload photos and our AI instantly verifies the issue, scores the evidence, and extracts key facts.' },
  { icon: '📍', title: 'Geo-Location Mapping', desc: 'Pin issues on an interactive live map so authorities can locate and route them instantly.' },
  { icon: '🤝', title: 'Community Verification', desc: 'Neighbors confirm issues to boost credibility scores and fast-track resolution.' },
  { icon: '⚡', title: 'Smart Prioritization', desc: 'AI scores each complaint on impact, urgency, and citizens affected to surface what matters most.' },
  { icon: '📊', title: 'Development Initiatives', desc: 'Clustered complaints automatically become structured city development projects.' },
  { icon: '🏆', title: 'Civic Gamification', desc: 'Earn points and badges for every verified report, verification, and community contribution.' },
];

const HOW_IT_WORKS = [
  { num: 1, icon: '📝', title: 'Report',                desc: 'Describe your issue, upload photo or video evidence, and pin the exact location.' },
  { num: 2, icon: '🤖', title: 'AI Processes',          desc: '5 specialised AI agents verify authenticity, categorise, and assess community impact.' },
  { num: 3, icon: '👥', title: 'Community Verifies',    desc: 'Nearby citizens upvote and add supporting evidence to strengthen the case.' },
  { num: 4, icon: '🏗️', title: 'Initiative Created',   desc: 'Related complaints cluster into a structured development project for authorities.' },
  { num: 5, icon: '✅', title: 'Resolution Tracked',   desc: 'Follow progress from review → approved → in progress → resolved in real time.' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
const StatCounter = ({ target, suffix = '', label }) => {
  const value = useCounter(target);
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-extrabold text-white">
        {value.toLocaleString()}{suffix}
      </div>
      <div className="text-blue-200 text-sm mt-1">{label}</div>
    </div>
  );
};

// ── Landing Page ──────────────────────────────────────────────────────────────
const Landing = () => {
  return (
    <div className="bg-white min-h-screen font-sans">

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] text-white py-28 px-6 md:px-12 text-center overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full translate-x-1/3 translate-y-1/3" />

        <div className="relative max-w-4xl mx-auto space-y-6">
          <div className="inline-block bg-white/10 text-blue-200 text-xs font-semibold px-4 py-1.5 rounded-full mb-2 tracking-wide">
            Powered by Google Gemini 2.5 Flash
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Civic<span className="text-blue-300">Align</span>
          </h1>

          <p className="text-xl md:text-2xl font-medium text-blue-100 max-w-3xl mx-auto leading-snug">
            Where Citizens and AI Unite to Turn Community Challenges into Lasting Progress
          </p>

          <p className="text-base text-blue-200 max-w-2xl mx-auto">
            Empowering communities to identify problems, prioritize solutions, and drive meaningful
            development through human collaboration and artificial intelligence.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="bg-white text-[#1e40af] font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-blue-50 transition-all text-sm"
            >
              Report a Complaint
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white font-bold py-3 px-8 rounded-xl hover:bg-white/10 transition-all text-sm"
            >
              Administrator Portal
            </Link>
          </div>

          {/* Stat counters */}
          <div className="flex flex-wrap justify-center gap-12 pt-12 border-t border-white/20 mt-8">
            <StatCounter target={2400} suffix="+" label="Issues Reported" />
            <StatCounter target={89}   suffix="%" label="Resolution Rate" />
            <StatCounter target={14000} suffix="+" label="Citizens Engaged" />
          </div>
        </div>
      </section>

      {/* ── 2. Features ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Everything Your Community Needs</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              A full civic engagement platform built for real-world impact.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How It Works ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-3">From report to resolution in five simple steps.</p>
          </div>
          <div className="relative">
            {/* connector line */}
            <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-blue-100 hidden md:block" />
            <div className="space-y-8">
              {HOW_IT_WORKS.map((step) => (
                <div key={step.num} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[#1e40af] text-white flex flex-col items-center justify-center text-xl shadow-md z-10">
                    <span>{step.icon}</span>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs font-bold text-[#1e40af] uppercase tracking-widest mb-1">
                      Step {step.num}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-lg">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Community Impact ─────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Community Impact</h2>
          <p className="text-blue-200 mb-14">Real results, real communities, real change.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: '342',    label: 'Issues Resolved This Month', icon: '✅' },
              { value: '8.4',   label: 'Average Resolution Time (days)', icon: '⏱️' },
              { value: '24',    label: 'Cities Participating', icon: '🏙️' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-5xl font-extrabold text-white mb-2">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Leaderboard Preview ──────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Top Citizens</h2>
            <p className="text-gray-500 mt-3">The people driving change in their communities.</p>
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            {TOP_CITIZENS.map((citizen, i) => (
              <div
                key={citizen.rank}
                className={`flex items-center gap-4 px-6 py-4 ${
                  i < TOP_CITIZENS.length - 1 ? 'border-b border-gray-50' : ''
                } ${i === 0 ? 'bg-yellow-50/60' : ''}`}
              >
                <span className={`w-7 text-center font-extrabold text-sm ${
                  i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-400'
                }`}>
                  #{citizen.rank}
                </span>
                <div className="w-10 h-10 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {citizen.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{citizen.name}</div>
                  <div className="text-xs text-gray-400">{citizen.city}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{citizen.points.toLocaleString()} pts</div>
                  <div className="text-xs text-gray-500">
                    {citizen.emoji} {citizen.badge}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              to="/leaderboard"
              className="inline-block bg-[#1e40af] text-white font-semibold py-2.5 px-8 rounded-xl hover:bg-blue-800 transition-colors text-sm"
            >
              View Full Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-14 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="text-2xl font-extrabold text-white mb-1">
                Civic<span className="text-blue-400">Align</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs">
                Where Citizens and AI Unite to Turn Community Challenges into Lasting Progress.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {['About', 'How It Works', 'Privacy', 'Terms'].map((link) => (
                <a key={link} href="#" className="hover:text-white transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <span>© {new Date().getFullYear()} CivicAlign. All rights reserved.</span>
            <span className="flex items-center gap-2">
              ⚡ Powered by <span className="text-gray-400 font-semibold">Google Gemini 2.5 Flash</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
