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
  { icon: '📷', title: 'Report with Photos & Videos', desc: "Attach real visual evidence to your complaint so authorities can see exactly what's wrong — no more 'we need to investigate' delays." },
  { icon: '🗺️', title: 'See Issues on a Live Map', desc: "View all reported problems in your area on an interactive map. Know what your neighbors are dealing with too." },
  { icon: '👥', title: 'Verify & Support Others', desc: "Confirm issues reported by your neighbors to boost their priority. The more citizens verify, the faster it gets fixed." },
  { icon: '📊', title: 'Track Your Complaint Live', desc: "See exactly where your complaint stands — submitted, seen by admin, in progress, or resolved. No more wondering if anyone cared." },
  { icon: '🏆', title: 'Earn Civic Points', desc: "Every report you make earns Civic Points. Rise through the leaderboard. Get recognized as a Community Hero in your community." },
  { icon: '⚡', title: 'AI Turns Complaints into Plans', desc: "Our AI doesn't just store your complaint — it analyzes it, scores its impact, and helps authorities prioritize what matters most." }
];

const HOW_IT_WORKS = [
  { num: 1, icon: '📝', title: 'Report Your Issue', desc: 'Describe the problem in your area. Add photos, your location, and any details. Takes less than 2 minutes.' },
  { num: 2, icon: '🤖', title: 'AI Agents Get to Work', desc: '6 specialized AI agents analyze your complaint — categorizing it, assessing impact, grouping similar issues, and generating recommendations.' },
  { num: 3, icon: '🏛️', title: 'Government Plans & Acts', desc: 'Your complaint becomes part of a ranked development plan. Authorities get an evidence-based roadmap. You get real updates.' }
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

      {/* ── 3. How CivicAlign Works ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 font-poppins">How CivicAlign Works</h2>
            <p className="text-[#5A6A7A] mt-2 font-semibold">From complaint to resolution in three simple steps</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 md:gap-4">
            {HOW_IT_WORKS.map((step, idx) => (
              <React.Fragment key={step.num}>
                {/* Step Card */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between items-center text-center relative">
                  
                  {/* Step Number Badge */}
                  <div className="w-10 h-10 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold text-sm shadow-sm mb-4">
                    {step.num}
                  </div>

                  <div className="text-4xl mb-3">{step.icon}</div>
                  
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-gray-800 font-poppins text-base">{step.title}</h3>
                    <p className="text-xs text-[#5A6A7A] leading-relaxed font-semibold">{step.desc}</p>
                  </div>
                </div>

                {/* Arrow Connector */}
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:flex items-center justify-center text-gray-300 self-center px-2">
                    <svg className="w-6 h-6 transform rotate-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. What You Can Do Here ─────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 font-poppins">Everything You Need to Make Your Community Better</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-7 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-base font-extrabold text-gray-800 mb-2 font-poppins">{f.title}</h3>
                <p className="text-sm text-[#5A6A7A] leading-relaxed font-semibold">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Community Impact ─────────────────────────────────────────── */}
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

      {/* ── 6. Leaderboard Preview ──────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 font-poppins">Top Citizens</h2>
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
              to="/register"
              className="inline-block bg-[#1e40af] text-white font-semibold py-2.5 px-8 rounded-xl hover:bg-blue-800 transition-colors text-sm"
            >
              View Full Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Footer ───────────────────────────────────────────────────── */}
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
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
