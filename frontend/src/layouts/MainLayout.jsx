import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import Fuse from "fuse.js";
import HighlightText from "../components/HighlightText";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, faqApi, notificationApi } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import { socket } from "../services/socket";
import toast from 'react-hot-toast';
import logo from "../assets/logo.png";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const NAV_LINKS = [
  { to: "/",           label: "Home" },
  { to: "/faqs",       label: "FAQs" },
  { to: "/queue",      label: "Queue" },
  { to: "/ask",        label: "Ask Question" },
];

export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch]     = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const qc = useQueryClient();

  const userName = user?.name || "Student";
  const userRole = user?.role || "student";
  const isAdmin = userRole === "admin";
  const visibleLinks = NAV_LINKS.filter(({ to }) => !(isAdmin && to === "/ask"));

  // Fetch profile data for stats
  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userApi.me,
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?._id],
    queryFn: () => notificationApi.list(user?._id, user?.role === 'admin'),
    enabled: !!user?._id,
    refetchInterval: 30000,
    retry: false,
  });

  const markReadMut = useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', user?._id] });
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const username = profileData?.user?.username || user?.username || "";
  const email = profileData?.user?.email || user?.email || "";
  const joinDate = profileData?.user?.createdAt
    ? new Date(profileData.user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;
  const stats = profileData?.user
    ? {
        questions: profileData.user.questionsCount ?? 0,
        answers: profileData.user.answersCount ?? 0,
        verified: profileData.user.verifiedCount ?? 0,
        bookmarked: profileData.user.bookmarkedCount ?? 0,
      }
    : null;
  const hasActivity = stats && (stats.questions > 0 || stats.answers > 0 || stats.verified > 0);

  const isActive = (p) => (p === "/" ? location.pathname === "/" : location.pathname.startsWith(p));

  const { data: allFaqs = [] } = useQuery({
    queryKey: ['faqs-all'],
    queryFn: () => faqApi.list(),
    staleTime: 60000,
  });

  const resultsArray = useMemo(() => {
    const q = search.trim();
    if (!q) return [];
    const arr = Array.isArray(allFaqs) ? allFaqs : (allFaqs?.data || []);
    const fuse = new Fuse(arr, {
      keys: ['question', 'category', 'answer', 'tags'],
      includeMatches: true,
      threshold: 0.4,
      ignoreLocation: true,
    });
    return fuse.search(q).map(res => ({
      ...res.item,
      matches: res.matches
    })).slice(0, 5);
  }, [search, allFaqs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    if (search.trim()) navigate(`/faqs?q=${encodeURIComponent(search.trim())}`);
  };

  const handleResultClick = (id) => {
    setSearch("");
    setShowDropdown(false);
    navigate(`/faqs/${id}`);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
    setNotifOpen(false);
    setShowDropdown(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    const handleUpdate = () => {
      if (isAuthenticated) {
        qc.invalidateQueries({ queryKey: ["notifications", user?._id] });
        qc.invalidateQueries({ queryKey: ["user-profile"] });
        qc.invalidateQueries({ queryKey: ["user-activity", user?._id] });
        qc.invalidateQueries({ queryKey: ["user-profile-questions"] });
      }
    };

    socket.on("questionAdded", handleUpdate);
    socket.on("answerAdded", handleUpdate);
    socket.on("statusUpdated", handleUpdate);

    const handleUserUpdate = (data) => {
      if (isAuthenticated && data?.userId === user?._id) {
        qc.invalidateQueries({ queryKey: ["user-profile"] });
        qc.invalidateQueries({ queryKey: ["notifications", user?._id] });
        qc.invalidateQueries({ queryKey: ["user-activity", user?._id] });
        qc.invalidateQueries({ queryKey: ["user-profile-questions"] });
      }
    };
    socket.on("userUpdated", handleUserUpdate);

    const handleNewNotification = (notif) => {
      if (isAuthenticated && (notif.userId === user?._id || (notif.userId === 'admin' && user?.role === 'admin'))) {
        const safeLink = (notif.link || "/")
          .replace(/\/question\//g, "/questions/")
          .replace(/\/faq\//g, "/faqs/");
        toast(
          (t) => (
            <div className="flex items-start gap-3 cursor-pointer" onClick={() => { navigate(safeLink); toast.dismiss(t.id); }}>
              {notif.senderName && (
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  {notif.senderName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
              </div>
            </div>
          ),
          { duration: 5000 }
        );
        qc.invalidateQueries({ queryKey: ["notifications", user?._id] });
      }
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("questionAdded", handleUpdate);
      socket.off("answerAdded", handleUpdate);
      socket.off("statusUpdated", handleUpdate);
      socket.off("userUpdated", handleUserUpdate);
      socket.off("newNotification", handleNewNotification);
    };
  }, [qc, isAuthenticated, user?._id, user?.role, navigate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F7F2" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b" style={{ borderColor: "#E2E8DE" }}>
        <div className="container-xl h-14 flex items-center gap-4 relative">
          {/* Left group */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img src={logo} alt="AskSam Logo" className="w-8 h-8 object-contain rounded-full shadow-sm" />
              <span className="text-base font-bold" style={{ color: "#1F2937" }}>AskSam</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5 ml-2" aria-label="Main">
              {visibleLinks.map(({ to, label }) => (
                <Link key={to} to={to}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive(to)
                      ? "font-semibold"
                      : "hover:bg-opacity-60"
                  }`}
                  style={isActive(to)
                    ? { color: "#5E7A5A", background: "#f0f4ef" }
                    : { color: "#6B7280" }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} ref={searchRef} className="flex-1 max-w-md hidden lg:flex items-center gap-2 mr-4 relative">
            <div className="search-wrap flex-1">
              <svg className="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="search-input text-sm py-2 w-full"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search FAQs — e.g. NOC, offer letter…"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white shrink-0 transition-colors"
              style={{ background: "#5E7A5A" }}
              onMouseOver={(e) => e.currentTarget.style.background = "#4a6650"}
              onMouseOut={(e) => e.currentTarget.style.background = "#5E7A5A"}
            >
              Search
            </button>

            {/* Dropdown for search results */}
            {showDropdown && search.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-xl overflow-hidden z-50 animate-scale-in" style={{ borderColor: "#E2E8DE" }}>
                {resultsArray.length > 0 ? (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {resultsArray.slice(0, 5).map((faq) => (
                      <li key={faq._id} className="border-b border-gray-50 last:border-0">
                        <button
                          type="button"
                          onClick={() => handleResultClick(faq._id)}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#f0f4ef] transition-colors focus:bg-[#f0f4ef] focus:outline-none"
                        >
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                            <HighlightText text={faq.question} matches={faq.matches?.find(m => m.key === 'question')?.indices} />
                          </p>
                          <span className="text-xs font-medium text-gray-500 mt-0.5 line-clamp-1">
                            <HighlightText text={faq.category} matches={faq.matches?.find(m => m.key === 'category')?.indices} />
                          </span>
                        </button>
                      </li>
                    ))}
                    {resultsArray.length > 5 && (
                      <li className="border-t border-gray-50 bg-gray-50">
                        <button type="submit" className="w-full text-center px-4 py-2 text-xs font-semibold hover:underline" style={{ color: "#5E7A5A" }}>
                          View all results
                        </button>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No verified questions found.
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Right group */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Admin link */}
            {isAdmin && (
              <Link to="/admin" className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
                style={isActive("/admin") ? { color: "#5E7A5A", background: "#f0f4ef" } : { color: "#6B7280" }}>
                Admin
              </Link>
            )}

            {/* ── Notifications Bell Icon ── */}
            {isAuthenticated && (
              <div className="relative flex items-center" ref={notifRef}>
              <button
                type="button"
                onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                className="relative p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-600 rounded-full transition-colors focus:outline-none shrink-0"
                aria-label="Notifications"
              >
                <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border overflow-hidden animate-scale-in z-50 origin-top-right" style={{ borderColor: "#E2E8DE" }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E2E8DE", background: "#FAFAF5" }}>
                    <h3 className="font-bold text-sm" style={{ color: "#1F2937" }}>Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        className="text-xs font-semibold hover:underline" 
                        style={{ color: "#5E7A5A" }}
                        onClick={() => {
                          notifications.forEach(n => {
                            if (!n.isRead) markReadMut.mutate(n._id);
                          });
                        }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[22rem] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((n) => (
                          <Link
                            key={n._id}
                            to={n.link}
                            onClick={() => {
                              if (!n.isRead) markReadMut.mutate(n._id);
                              setNotifOpen(false);
                            }}
                            className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/10' : ''}`}
                          >
                            <div className="flex gap-3 items-start">
                              <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-white shadow-sm border border-gray-100 text-brand-700 font-bold' : 'bg-gray-100 text-gray-600 font-bold'}`}>
                                {n.senderName ? (
                                  <span className="text-sm">{n.senderName.charAt(0).toUpperCase()}</span>
                                ) : (
                                  <>
                                    {n.type === 'new_question' && <span className="text-sm">❓</span>}
                                    {n.type === 'answer_added' && <span className="text-sm">💬</span>}
                                    {n.type === 'answer_verified' && <span className="text-sm">✅</span>}
                                    {n.type === 'points_adjusted' && <span className="text-sm">💎</span>}
                                    {!['new_question', 'answer_added', 'answer_verified', 'points_adjusted'].includes(n.type) && <span className="text-sm">🔔</span>}
                                  </>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-0.5">
                                  <p className={`text-xs ${!n.isRead ? 'font-bold' : 'font-semibold'}`} style={{ color: !n.isRead ? "#111827" : "#4B5563" }}>
                                    {n.title}
                                  </p>
                                  <span className="text-[10px] whitespace-nowrap ml-2" style={{ color: "#9CA3AF" }}>
                                    {timeAgo(n.createdAt)}
                                  </span>
                                </div>
                                <p className={`text-xs line-clamp-2 ${!n.isRead ? 'text-gray-700' : 'text-gray-500'}`}>{n.message}</p>
                              </div>
                              {!n.isRead && <div className="w-2 h-2 mt-2 rounded-full bg-brand-500 shrink-0 shadow-sm" />}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                          <span className="text-xl opacity-50">📭</span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">All caught up!</h4>
                        <p className="text-xs text-gray-500">You don't have any new notifications.</p>
                      </div>
                    )}
                  </div>
                  <div className="border-t p-2 text-center" style={{ borderColor: "#E2E8DE", background: "#FAFAF5" }}>
                    <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-semibold hover:underline" style={{ color: "#5E7A5A" }}>
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ── Avatar & Profile Dropdown ── */}
          <div className="relative" ref={dropdownRef}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 transition-all duration-200 hover:ring-2 hover:ring-brand-300/60 hover:ring-offset-2 hover:ring-offset-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
                  style={{ background: "#5E7A5A" }}
                  aria-expanded={dropdownOpen}
                  aria-label="Open profile menu"
                >
                  {userName.charAt(0).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: "#34d399" }} aria-hidden="true" />
                </button>

                {dropdownOpen && (
                  <div
                    role="menu"
                    aria-label="Profile menu"
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border overflow-hidden animate-scale-in z-50"
                    style={{ borderColor: "#E2E8DE", transformOrigin: "top right", animationDuration: "0.2s" }}
                  >
                    {/* ── Header Section ── */}
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="relative p-5 text-center bg-gradient-to-br from-[#f0f4ef] to-[#ffffff] border-b block hover:opacity-90 transition-opacity"
                      style={{ borderColor: "#E2E8DE" }}
                    >
                      <div className="relative inline-block mb-3">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md ring-4 ring-white"
                             style={{ background: "#5E7A5A" }}>
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute bottom-1 right-0 w-4 h-4 rounded-full border-2 border-white bg-emerald-400"
                              title="Online" />
                      </div>
                      
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{userName}</h3>
                      {(username || email) && <p className="text-sm text-gray-500 mt-0.5 truncate max-w-full">{username ? `@${username}` : email}</p>}
                      
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          isAdmin ? "bg-red-50 text-red-700" : "bg-[#dde8db] text-[#3a4f38]"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-red-500" : "bg-[#5E7A5A]"}`} />
                          {userRole}
                        </span>
                        {joinDate && (
                          <span className="text-xs text-gray-400 font-medium">Joined {joinDate}</span>
                        )}
                      </div>
                    </Link>

                    {/* ── Stats Grid ── */}
                    {!isAdmin && (
                      <div className="px-5 py-4 border-b" style={{ borderColor: "#E2E8DE", background: "#fafafa" }}>
                        {!stats ? (
                          <div className="flex justify-between items-center px-4 animate-pulse">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                                <div className="w-12 h-3 bg-gray-200 rounded" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1.5">
                             <Link to="/profile?tab=questions" onClick={() => setDropdownOpen(false)} className="flex flex-col items-center p-1.5 rounded-xl bg-white border border-gray-100 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer text-center select-none decoration-none">
                               <span className="text-sm font-bold text-gray-900">{stats.questions}</span>
                               <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wide mt-0.5">Questions</span>
                             </Link>
                             <Link to="/profile?tab=answers" onClick={() => setDropdownOpen(false)} className="flex flex-col items-center p-1.5 rounded-xl bg-white border border-gray-100 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer text-center select-none decoration-none">
                               <span className="text-sm font-bold text-gray-900">{stats.answers}</span>
                               <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wide mt-0.5">Answers</span>
                             </Link>
                             <Link to="/profile?tab=verified" onClick={() => setDropdownOpen(false)} className="flex flex-col items-center p-1.5 rounded-xl bg-white border border-gray-100 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer text-center select-none decoration-none">
                               <span className="text-sm font-bold text-emerald-600">{stats.verified}</span>
                               <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wide mt-0.5 text-center">Verified</span>
                             </Link>
                             <Link to="/profile?tab=bookmarked" onClick={() => setDropdownOpen(false)} className="flex flex-col items-center p-1.5 rounded-xl bg-white border border-gray-100 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer text-center select-none decoration-none">
                               <span className="text-sm font-bold text-indigo-600">{stats.bookmarked}</span>
                               <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wide mt-0.5 text-center">Bookmarked</span>
                             </Link>
                           </div>
                        )}
                      </div>
                    )}

                    {/* ── Quick Actions ── */}
                    <div className="p-2">
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-gray-50 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-red-700 transition-colors">Admin Dashboard</span>
                        </Link>
                      ) : (
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-gray-50 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-[#f0f4ef] group-hover:text-[#5E7A5A] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-[#5E7A5A] transition-colors">My Profile</span>
                        </Link>
                      )}

                      <div className="my-1.5 border-t border-gray-100" />


                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-red-50 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-red-700 transition-colors">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
            )}
          </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-md transition-colors"
            style={{ color: "#6B7280" }}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-1 bg-white animate-fade-in" style={{ borderColor: "#E2E8DE" }}>
            {visibleLinks.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-md transition-colors"
                style={isActive(to) ? { color: "#5E7A5A", background: "#f0f4ef" } : { color: "#6B7280" }}>
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-md"
                style={isActive("/admin") ? { color: "#5E7A5A", background: "#f0f4ef" } : { color: "#6B7280" }}>
                Admin
              </Link>
            )}
            <button onClick={handleLogout} className="w-full text-left block px-3 py-2 text-sm font-medium rounded-md text-red-600">
              Logout
            </button>
            <form onSubmit={handleSearch} className="pt-2 relative">
              <div className="search-wrap">
                <svg className="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="search-input text-sm py-2 w-full"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search FAQs…"
                />
              </div>

              {/* Mobile Dropdown for search results */}
              {showDropdown && search.trim().length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-xl overflow-hidden z-50 animate-scale-in" style={{ borderColor: "#E2E8DE" }}>
                  {resultsArray.length > 0 ? (
                    <ul className="max-h-60 overflow-y-auto py-1">
                      {resultsArray.slice(0, 4).map((faq) => (
                        <li key={faq._id} className="border-b border-gray-50 last:border-0">
                          <button
                            type="button"
                            onClick={() => {
                              handleResultClick(faq._id);
                              setMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#f0f4ef] transition-colors focus:bg-[#f0f4ef] focus:outline-none"
                          >
                            <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                              <HighlightText text={faq.question} matches={faq.matches?.find(m => m.key === 'question')?.indices} />
                            </p>
                          </button>
                        </li>
                      ))}
                      {resultsArray.length > 4 && (
                        <li className="border-t border-gray-50 bg-gray-50">
                          <button type="submit" className="w-full text-center px-4 py-2 text-xs font-semibold hover:underline" style={{ color: "#5E7A5A" }}>
                            View all results
                          </button>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No verified questions found.
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1">
        <div key={location.pathname} className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-5 mt-auto" style={{ borderColor: "#E2E8DE", background: "#ffffff" }}>
        <div className="container-xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-sm font-semibold" style={{ color: "#5E7A5A" }}>AskSam</span>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>
            Community knowledge platform for Samagama interns · {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}