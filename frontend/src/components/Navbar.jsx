import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { userApi } from "../services/api";
import { useQuery } from "@tanstack/react-query";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Queue", to: "/queue" },
  { label: "Ask", to: "/ask" },
  { label: "Admin", to: "/admin", adminOnly: true },
];

export default function Navbar() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userApi.me,
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu = () => setIsMenuOpen(false);
  const handleKeyDown = (e) => { if (e.key === "Escape" && isMenuOpen) closeMenu(); };

  const avatarInitials = user?.name?.charAt(0)?.toUpperCase() || "U";
  const fullName = user?.name || "User";
  const username = profileData?.user?.username || user?.email || "";
  const role = user?.role || "student";
  const isAdmin = role === "admin";
  const joinDate = profileData?.user?.createdAt
    ? new Date(profileData.user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;
  const stats = profileData?.user
    ? {
        questions: profileData.user.questionsCount ?? 0,
        answers: profileData.user.answersCount ?? 0,
        verified: profileData.user.verifiedCount ?? 0,
      }
    : null;
  const hasActivity = stats && (stats.questions > 0 || stats.answers > 0 || stats.verified > 0);

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-sage-border/80 shadow-md shadow-sand-200/30"
            : "bg-white/90 backdrop-blur-md border-b border-sage-border/60"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="AskSam Home">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-200/50 group-hover:shadow-lg group-hover:shadow-brand-200/60 transition-all duration-200">
              AS
            </div>
            <span className="text-xl font-extrabold text-ink-900 group-hover:text-brand-500 transition-colors duration-200">
              Ask<span className="text-brand-500">Sam</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.filter(l => !l.adminOnly || user?.role === 'admin').map(({ label, to }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "text-brand-600 bg-brand-50/70"
                      : "text-ink-700 hover:text-brand-600 hover:bg-warm-50"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                  {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand-500 rounded-full" />}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center gap-2">

            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                {/* Avatar Button */}
                <button
                  type="button"
                  onClick={() => setProfileOpen(prev => !prev)}
                  aria-expanded={profileOpen}
                  aria-label="Open profile menu"
                  className="relative w-10 h-10 rounded-full flex items-center justify-center
                             text-white text-sm font-bold shrink-0 transition-all duration-200
                             hover:ring-2 hover:ring-brand-300/60 hover:ring-offset-2 hover:ring-offset-white
                             focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
                  style={{ background: "#5E7A5A" }}
                >
                  {avatarInitials}
                  {/* Online indicator */}
                  <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse-glow"
                        aria-label="Online" />
                </button>

                {/* ── Profile Popup ── */}
                {profileOpen && (
                  <div
                    role="menu"
                    aria-label="Profile menu"
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border overflow-hidden animate-scale-in"
                    style={{ borderColor: "#E2E8DE", transformOrigin: "top right", animationDuration: "0.18s", animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                  >
                    {/* ── Identity Section ── */}
                    <div className="px-5 pt-5 pb-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold
                                          ring-2 ring-brand-100 shadow-sm"
                               style={{ background: "#5E7A5A" }}>
                            {avatarInitials}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                                style={{ background: "#34d399" }}
                                aria-label="Online" />
                        </div>

                        {/* Name + username + role */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-ink-900 truncate leading-tight">{fullName}</p>
                          <p className="text-xs text-ink-400 truncate mt-0.5">
                            @{username}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                              isAdmin
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-brand-50 text-brand-700 border border-brand-200"
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: isAdmin ? "#dc2626" : "#34d399" }} />
                              {role}
                            </span>
                            {joinDate && (
                              <span className="text-xs text-ink-400">Joined {joinDate}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Activity Stats ── */}
                    {hasActivity && (
                      <div className="mx-4 px-1 py-3" style={{ borderTop: "1px solid #E2E8DE" }}>
                        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Activity
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-brand-50/50 transition-colors">
                            <span className="flex items-center gap-2 text-sm text-ink-700">
                              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Questions Asked
                            </span>
                            <span className="text-sm font-bold text-ink-900">{stats.questions}</span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-brand-50/50 transition-colors">
                            <span className="flex items-center gap-2 text-sm text-ink-700">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              Answers Given
                            </span>
                            <span className="text-sm font-bold text-ink-900">{stats.answers}</span>
                          </div>
                          {stats.verified > 0 && (
                            <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-brand-50/50 transition-colors">
                              <span className="flex items-center gap-2 text-sm text-ink-700">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Verified Answers
                              </span>
                              <span className="text-sm font-bold text-emerald-600">{stats.verified}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Loading skeleton for stats */}
                    {!stats && (
                      <div className="mx-4 px-1 py-3" style={{ borderTop: "1px solid #E2E8DE" }}>
                        <div className="space-y-2">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="flex items-center justify-between px-2 py-1.5">
                              <div className="skeleton h-3 w-28" />
                              <div className="skeleton h-3 w-6" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Quick Actions ── */}
                    <div className="py-1.5" style={{ borderTop: "1px solid #E2E8DE" }}>
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-3 mx-2 px-3 py-2.5 text-sm font-medium text-ink-700
                                     rounded-xl hover:bg-brand-50 hover:text-brand-600
                                     active:scale-[0.98] transition-all duration-150"
                        >
                          <span className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </span>
                          Admin Dashboard
                          <svg className="w-3.5 h-3.5 ml-auto text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ) : (
                        <Link
                          to="/my-questions"
                          onClick={() => setProfileOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-3 mx-2 px-3 py-2.5 text-sm font-medium text-ink-700
                                     rounded-xl hover:bg-brand-50 hover:text-brand-600
                                     active:scale-[0.98] transition-all duration-150"
                        >
                          <span className="w-8 h-8 rounded-lg bg-warm-100 text-warm-600 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          My Questions
                          <svg className="w-3.5 h-3.5 ml-auto text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-3 mx-2 px-3 py-2.5 text-sm font-medium text-ink-700
                                   rounded-xl hover:bg-brand-50 hover:text-brand-600
                                   active:scale-[0.98] transition-all duration-150"
                      >
                        <span className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </span>
                        Change Password
                        <svg className="w-3.5 h-3.5 ml-auto text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      {/* Divider */}
                      <div className="mx-4 my-1 h-px" style={{ background: "#E2E8DE" }} role="none" />

                      {/* Logout */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setProfileOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 mx-2 px-3 py-2.5 text-sm font-medium text-red-500
                                   rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all duration-150"
                      >
                        <span className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50/80 rounded-lg
                           hover:bg-brand-100 transition-all duration-200 border border-brand-100/50"
      >
                Sign In
              </Link>
            )}

            <Link
              to="/ask"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold
                         bg-brand-500 text-white rounded-xl hover:bg-brand-600 active:bg-brand-700
                         shadow-md shadow-brand-200/40 hover:shadow-lg hover:shadow-brand-200/50
                         transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ask Question
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/ask"
              className="inline-flex items-center justify-center w-9 h-9
                         bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              aria-label="Ask a question"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={toggleMenu}
              onKeyDown={handleKeyDown}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg
                         text-ink-700 hover:bg-warm-100 hover:text-brand-600
                         transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-400/50"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              <div className="w-5 h-5 relative flex flex-col justify-center">
                <span className={`absolute w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? "rotate-45 top-1/2" : "top-0.5"}`} />
                <span className={`absolute w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? "opacity-0 scale-0" : "top-1/2"}`} />
                <span className={`absolute w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? "-rotate-45 top-1/2" : "bottom-0.5"}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        id="mobile-menu"
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!isMenuOpen}
      >
        <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`} onClick={closeMenu} aria-hidden="true" />
        <div className={`absolute top-16 inset-x-0 bg-white border-b border-sage-border shadow-xl transform transition-all duration-300 ease-out ${isMenuOpen ? "translate-y-0" : "-translate-y-full"}`}>
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.filter(l => !l.adminOnly || user?.role === 'admin').map(({ label, to }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-brand-50 text-brand-600 border border-brand-100/50"
                      : "text-ink-700 hover:bg-warm-50 hover:text-brand-600"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                  {isActive && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-sage-border mt-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => { closeMenu(); logout(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
                             text-red-500 bg-red-50 rounded-xl hover:bg-red-100 border border-red-100 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              ) : (
                <Link to="/login" onClick={closeMenu}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
                             text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100 border border-brand-100/50 transition-all duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a14 7 0 00-7-7z" />
                  </svg>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
