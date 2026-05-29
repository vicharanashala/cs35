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
  const role = user?.role || "";
  const stats = profileData?.user
    ? {
        questions: profileData.user.questionsCount ?? 0,
        answers: profileData.user.answersCount ?? 0,
        verified: profileData.user.verifiedCount ?? 0,
      }
    : null;

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

                {/* Profile Popup */}
                {profileOpen && (
                  <div
                    role="menu"
                    aria-label="Profile menu"
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-sage-border
                               animate-scale-in overflow-hidden"
                    style={{ transformOrigin: "top right", animationDuration: "0.18s", animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                  >
                    {/* Profile Header Card */}
                    <div className="px-5 py-4 bg-gradient-to-br from-brand-50 to-warm-50 border-b border-sage-border">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold
                                         ring-2 ring-white shadow-sm"
                               style={{ background: "#5E7A5A" }}>
                            {avatarInitials}
                          </div>
                          {/* Decorative presence indicator */}
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"
                                aria-hidden="true" />
                        </div>

                        {/* Name + meta */}
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm font-bold text-ink-900 truncate leading-tight">{fullName}</p>
                          <p className="text-xs text-ink-400 truncate mt-0.5">
                            <span aria-hidden="true" className="text-ink-300">@</span>{username}
                          </p>
                          {role && (
                            <span className="inline-flex mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full capitalize
                                            bg-brand-100 text-brand-700 border border-brand-200">
                              {role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="px-4 py-3 border-b border-sage-border bg-warm-50/50">
                      {stats ? (
                        <div className="grid grid-cols-3 gap-2">
                          {/* Questions */}
                          <div className="text-center py-2 px-1 rounded-xl bg-white border border-sage-border/60
                                          hover:border-brand-200 hover:shadow-sm transition-all duration-150 cursor-default">
                            <p className="text-base font-bold text-ink-900 leading-tight">{stats.questions}</p>
                            <p className="text-xs text-ink-500 mt-0.5">Questions</p>
                          </div>
                          {/* Answers */}
                          <div className="text-center py-2 px-1 rounded-xl bg-white border border-sage-border/60
                                          hover:border-brand-200 hover:shadow-sm transition-all duration-150 cursor-default">
                            <p className="text-base font-bold text-ink-900 leading-tight">{stats.answers}</p>
                            <p className="text-xs text-ink-500 mt-0.5">Answers</p>
                          </div>
                          {/* Verified */}
                          <div className="text-center py-2 px-1 rounded-xl bg-white border border-brand-200
                                          hover:shadow-sm transition-all duration-150 cursor-default">
                            <p className="text-base font-bold text-brand-600 leading-tight">{stats.verified}</p>
                            <p className="text-xs text-ink-500 mt-0.5">Verified</p>
                          </div>
                        </div>
                      ) : (
                        /* Loading skeleton */
                        <div className="grid grid-cols-3 gap-2">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="py-2 px-1 rounded-xl bg-white border border-sage-border/60 animate-pulse">
                              <div className="mx-auto w-6 h-4 bg-sage-100 rounded" />
                              <div className="mx-auto w-10 h-2.5 bg-sage-100 rounded mt-1.5" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Items */}
                    <div className="py-2">
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </span>
                        My Profile
                        <svg className="w-3.5 h-3.5 ml-auto text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

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

                      {/* Divider */}
                      <div className="mx-4 my-1.5 h-px bg-sage-border/60" role="none" />

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
