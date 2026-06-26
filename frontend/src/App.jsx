import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { useLanguage } from './hooks/useLanguage';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import MobileBottomNav from './components/common/MobileBottomNav';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import LanguageSelect from './pages/auth/LanguageSelect';

// Citizen Pages
import CitizenDashboard from './pages/citizen/Dashboard';
import ReportComplaint from './pages/citizen/ReportComplaint';
import MyComplaints from './pages/citizen/MyComplaints';
import CitizenComplaintDetail from './pages/citizen/ComplaintDetail';
import CommunityFeed from './pages/citizen/CommunityFeed';
import PublicMap from './pages/citizen/PublicMap';
import CitizenLeaderboard from './pages/citizen/Leaderboard';
import Profile from './pages/citizen/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ComplaintReview from './pages/admin/ComplaintReview';
import AdminComplaintDetail from './pages/admin/ComplaintDetail';
import Analytics from './pages/admin/Analytics';
import Initiatives from './pages/admin/Initiatives';
import AdminLeaderboard from './pages/admin/Leaderboard';
import Copilot from './pages/admin/Copilot';
import AdminMap from './pages/admin/AdminMap';

// Citizen Layout
const CitizenLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-6 md:ml-64 bg-gray-50 overflow-y-auto min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

const UserLanguageSync = () => {
  const { user } = useAuth();
  const { language, changeLanguage } = useLanguage();

  useEffect(() => {
    const preferred = user?.preferred_language;
    if (preferred && preferred !== language) {
      changeLanguage(preferred);
    }
  }, [user?.preferred_language, language, changeLanguage]);

  return null;
};
// Applies RTL direction + lang attribute whenever language changes
const RTLSetter = () => {
  const { language, isRTL } = useLanguage();
  useEffect(() => {
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);
  return null;
};

const App = () => (
  <>
    <UserLanguageSync />
    <RTLSetter />
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Language select — protected, no layout */}
      <Route element={<ProtectedRoute />}>
        <Route path="/language-select" element={<LanguageSelect />} />
      </Route>

      {/* Citizen routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<CitizenLayout />}>
          <Route path="/dashboard"       element={<CitizenDashboard />} />
          <Route path="/report-complaint" element={<ReportComplaint />} />
          <Route path="/my-complaints"   element={<MyComplaints />} />
          <Route path="/complaints/:id"  element={<CitizenComplaintDetail />} />
          <Route path="/community"       element={<CommunityFeed />} />
          <Route path="/map"             element={<PublicMap />} />
          <Route path="/leaderboard"     element={<CitizenLeaderboard />} />
          <Route path="/profile"         element={<Profile />} />
        </Route>
      </Route>

      {/* Admin routes — separate dark layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard"    element={<AdminDashboard />} />
            <Route path="/admin/review"       element={<ComplaintReview />} />
            <Route path="/admin/complaints/:id" element={<AdminComplaintDetail />} />
            <Route path="/admin/analytics"    element={<Analytics />} />
            <Route path="/admin/map"          element={<AdminMap />} />
            <Route path="/admin/initiatives"  element={<Initiatives />} />
            <Route path="/admin/leaderboard"  element={<AdminLeaderboard />} />
            <Route path="/admin/copilot"      element={<Copilot />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  </>
);

export default App;
